#!/usr/bin/env python3
"""
YT Media Downloader — Companion Server (Linux/macOS/Windows Cross-Platform)
Runs a local HTTP server on 127.0.0.1:19836 to handle high-speed yt-dlp & ffmpeg processing
and precise video trimming without rate limits or browser sandbox limitations.
"""

import os
import sys
import json
import time
import uuid
import queue
import shutil
import tempfile
import platform
import threading
import subprocess
import re
import urllib.request
from urllib.parse import urlparse, parse_qs
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn

# Prevent crash when built with PyInstaller --noconsole (where sys.stdout/stderr are None)
if sys.stdout is None:
    sys.stdout = open(os.devnull, "w", encoding="utf-8")
if sys.stderr is None:
    sys.stderr = open(os.devnull, "w", encoding="utf-8")

HOST = "127.0.0.1"
PORT = 19836
VERSION = "1.3.2"

# Determine base directory and tools path
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(os.path.abspath(sys.executable))
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Check for binaries inside tools/ or tools-linux/ or fallback to system PATH
possible_tools_dirs = [
    os.path.join(BASE_DIR, "tools"),
    os.path.join(BASE_DIR, "..", "tools"),
    os.path.join(BASE_DIR, "..", "..", "tools")
]
TOOLS_DIR = next((d for d in possible_tools_dirs if os.path.exists(d)), os.path.join(BASE_DIR, "tools"))

EXT = ".exe" if platform.system() == "Windows" else ""

def get_binary_path(name):
    # Check local tools folder first
    local_path = os.path.join(TOOLS_DIR, f"{name}{EXT}")
    if os.path.exists(local_path):
        return local_path
    # Check system PATH
    sys_path = shutil.which(name)
    if sys_path:
        return sys_path
    return name

def _extract_video_id(url):
    if not url:
        return ""
    if "v=" in url:
        return url.split("v=")[1].split("&")[0].split("#")[0]
    elif "youtu.be/" in url:
        return url.split("youtu.be/")[1].split("?")[0].split("#")[0]
    elif "/shorts/" in url:
        return url.split("/shorts/")[1].split("?")[0].split("#")[0]
    return ""

YTDLP_BIN = get_binary_path("yt-dlp")
FFMPEG_BIN = get_binary_path("ffmpeg")
FFPROBE_BIN = get_binary_path("ffprobe")

# Windows: hide CMD windows spawned by subprocess
IS_WINDOWS = platform.system() == "Windows"
_subprocess_kwargs = {}
if IS_WINDOWS:
    _subprocess_kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW

# Detect browser for cookies (avoids YouTube bot detection / CAPTCHA)
COOKIES_BROWSER = None
COOKIES_FILE = None

def _get_firefox_fork_profile_paths():
    """Find profile directories for Firefox forks like Zen, Floorp, LibreWolf, Waterfox."""
    paths = []
    if IS_WINDOWS:
        appdata = os.getenv("APPDATA", "")
        if appdata:
            possible_roots = [
                os.path.join(appdata, "Zen", "Profiles"),
                os.path.join(appdata, "floorp", "Profiles"),
                os.path.join(appdata, "LibreWolf", "Profiles"),
                os.path.join(appdata, "Waterfox", "Profiles"),
            ]
            for root in possible_roots:
                if os.path.exists(root):
                    try:
                        for item in os.listdir(root):
                            p_path = os.path.join(root, item)
                            if os.path.isdir(p_path) and (os.path.exists(os.path.join(p_path, "cookies.sqlite")) or os.path.exists(os.path.join(p_path, "cookies.sqlite-wal"))):
                                paths.append(p_path)
                    except Exception:
                        pass
    elif platform.system() == "Linux":
        home = os.path.expanduser("~")
        possible_roots = [
            os.path.join(home, ".zen"),
            os.path.join(home, ".var", "app", "app.zen_browser.zen", ".zen"),
            os.path.join(home, ".floorp"),
            os.path.join(home, ".librewolf"),
            os.path.join(home, ".waterfox"),
        ]
        for root in possible_roots:
            if os.path.exists(root):
                try:
                    for root_dir, dirs, files in os.walk(root):
                        if "cookies.sqlite" in files:
                            paths.append(root_dir)
                except Exception:
                    pass
    elif platform.system() == "Darwin":
        home = os.path.expanduser("~")
        possible_roots = [
            os.path.join(home, "Library", "Application Support", "Zen", "Profiles"),
            os.path.join(home, "Library", "Application Support", "floorp", "Profiles"),
            os.path.join(home, "Library", "Application Support", "LibreWolf", "Profiles"),
            os.path.join(home, "Library", "Application Support", "Waterfox", "Profiles"),
        ]
        for root in possible_roots:
            if os.path.exists(root):
                try:
                    for item in os.listdir(root):
                        p_path = os.path.join(root, item)
                        if os.path.isdir(p_path) and os.path.exists(os.path.join(p_path, "cookies.sqlite")):
                            paths.append(p_path)
                except Exception:
                    pass
    return paths

def _is_browser_installed(browser_name):
    """Checks if standard browser profile directories exist on the operating system."""
    if IS_WINDOWS:
        appdata = os.getenv("APPDATA", "")
        localappdata = os.getenv("LOCALAPPDATA", "")
        paths = {
            "firefox": os.path.join(appdata, "Mozilla", "Firefox", "Profiles"),
            "chrome": os.path.join(localappdata, "Google", "Chrome", "User Data"),
            "edge": os.path.join(localappdata, "Microsoft", "Edge", "User Data"),
            "brave": os.path.join(localappdata, "BraveSoftware", "Brave-Browser", "User Data"),
            "opera": os.path.join(appdata, "Opera Software", "Opera Stable"),
        }
        p = paths.get(browser_name.lower())
        return bool(p and os.path.exists(p))
    return False

def get_browser_cookies_args():
    """Find available browser profile cookies as fallback/supplement to bypass YouTube 403 Forbidden."""
    fork_paths = _get_firefox_fork_profile_paths()
    if fork_paths:
        for fp in fork_paths:
            ck_file = os.path.join(fp, "cookies.sqlite")
            if os.path.exists(ck_file) and os.path.getsize(ck_file) > 0:
                return ["--cookies-from-browser", f"firefox:{fp}"]
        return ["--cookies-from-browser", f"firefox:{fork_paths[0]}"]
    for b in ["firefox", "chrome", "edge", "brave", "opera"]:
        if _is_browser_installed(b):
            return ["--cookies-from-browser", b]
    return []

def get_js_runtime_args():
    """Detect external JavaScript runtime (Node.js, Deno, QuickJS) for solving YouTube n-challenges."""
    # 1. Local tools folder
    for name in ["node", "deno", "quickjs", "qjs"]:
        local_bin = os.path.join(TOOLS_DIR, f"{name}{EXT}")
        if os.path.exists(local_bin):
            return ["--js-runtimes", f"{name}:{local_bin}"]
    # 2. System PATH
    for name in ["node", "deno", "quickjs", "qjs", "bun"]:
        sys_bin = shutil.which(name)
        if sys_bin:
            return ["--js-runtimes", f"{name}:{sys_bin}"]
    # 3. Common Windows paths
    if IS_WINDOWS:
        common_paths = [
            r"C:\Program Files\nodejs\node.exe",
            r"C:\Program Files (x86)\nodejs\node.exe",
            os.path.expandvars(r"%LOCALAPPDATA%\Programs\node\node.exe"),
        ]
        for p in common_paths:
            if os.path.exists(p):
                return ["--js-runtimes", f"node:{p}"]
    return []

IN_MEMORY_COOKIES_NETSCAPE = None
COOKIES_LOCK = threading.Lock()

PO_TOKEN = None
PO_TOKEN_LOCK = threading.Lock()

def update_po_token(token):
    global PO_TOKEN
    if token and isinstance(token, str):
        with PO_TOKEN_LOCK:
            PO_TOKEN = token.strip()
            print(f"[YTDL-Security] Updated PO-Token: {PO_TOKEN[:15]}... (RAM only)")

def _get_current_po_token():
    with PO_TOKEN_LOCK:
        return PO_TOKEN

def _height_to_res_str(h):
    if not h or not isinstance(h, (int, float)):
        return None
    if h >= 2160: return "4K"
    if h >= 1440: return "1440p"
    if h >= 1080: return "1080p"
    if h >= 720: return "720p"
    if h >= 480: return "480p"
    if h >= 360: return "360p"
    if h >= 240: return "240p"
    return "144p"

def _extract_video_formats(info):
    formats = []
    duration = info.get("duration") or 0
    target_res = ["4K", "1440p", "1080p", "720p", "480p", "360p", "240p", "144p"]

    # Find best audio stream size to add to video-only DASH streams
    best_audio_size = 0
    for fmt in info.get("formats", []):
        acodec = fmt.get("acodec", "")
        vcodec = fmt.get("vcodec", "none")
        if acodec and acodec != "none" and (vcodec == "none" or not fmt.get("height")):
            a_size = fmt.get("filesize") or fmt.get("filesize_approx") or 0
            if a_size > best_audio_size:
                best_audio_size = a_size

    for fmt in info.get("formats", []):
        height = fmt.get("height")
        res_str = _height_to_res_str(height)
        if res_str and res_str in target_res:
            vcodec = fmt.get("vcodec", "")
            if vcodec and vcodec != "none":
                f_size = fmt.get("filesize") or fmt.get("filesize_approx") or 0
                if not f_size and duration:
                    tbr = fmt.get("tbr") or fmt.get("vbr") or 0
                    if tbr:
                        f_size = int((tbr * 1000 * duration) / 8)
                # Add best audio size for realistic combined download estimate
                if f_size and best_audio_size:
                    f_size += best_audio_size
                formats.append({
                    "format_id": fmt.get("format_id"),
                    "resolution": res_str,
                    "ext": fmt.get("ext", "mp4"),
                    "filesize": f_size,
                    "type": "video"
                })

    # Also extract audio streams so extension can pair audio and display tracks
    for fmt in info.get("formats", []):
        acodec = fmt.get("acodec", "")
        vcodec = fmt.get("vcodec", "none")
        if acodec and acodec != "none" and (vcodec == "none" or not fmt.get("height")):
            a_size = fmt.get("filesize") or fmt.get("filesize_approx") or 0
            formats.append({
                "format_id": fmt.get("format_id"),
                "resolution": "audio only",
                "ext": fmt.get("ext", "m4a"),
                "filesize": a_size,
                "type": "audio"
            })

    return formats

def _extract_audio_tracks(info):
    tracks = []
    seen = set()
    for fmt in info.get("formats", []):
        acodec = fmt.get("acodec", "")
        vcodec = fmt.get("vcodec", "none")
        if acodec and acodec != "none" and (vcodec == "none" or not fmt.get("height")):
            fid = fmt.get("format_id")
            if fid and fid not in seen:
                seen.add(fid)
                lang = fmt.get("language") or ""
                note = fmt.get("format_note") or fmt.get("ext") or "Audio"
                label = f"{note} ({lang})" if lang else f"{note}"
                tracks.append({
                    "format_id": fid,
                    "label": label,
                    "lang": lang,
                    "ext": fmt.get("ext", "m4a")
                })
    return tracks

DISCARD_COOKIES = {
    "SID", "HSID", "SSID", "APISID", "SAPISID",
    "ACCOUNT_CHOOSER", "OSID", "__Secure-1PSID", "__Secure-3PSID",
    "__Secure-1PAPISID", "__Secure-3PAPISID", "__Secure-1PSIDTS",
    "__Secure-3PSIDTS", "__Secure-1PSIDCC", "__Secure-3PSIDCC"
}

def _purge_legacy_cookies():
    """Purge any legacy plaintext cookie files from disk for security."""
    target_files = [".yt_cookies.txt", ".yt_cookies_temp.txt", "cookies.txt"]
    search_dirs = [
        DEFAULT_DOWNLOAD_DIR,
        BASE_DIR,
        os.path.dirname(BASE_DIR),
        os.path.expanduser("~/Downloads"),
        os.path.expanduser("~/Documents"),
        os.path.join(os.path.expanduser("~/Downloads"), "YTMediaDownloader"),
        os.path.join(os.path.expanduser("~/Documents"), "YTDownloader"),
    ]
    for d in search_dirs:
        if d and os.path.exists(d) and os.path.isdir(d):
            for fname in target_files:
                fpath = os.path.join(d, fname)
                if os.path.exists(fpath):
                    try:
                        os.remove(fpath)
                        print(f"[YTDL-Security] Purged legacy cookie file: {fpath}")
                    except Exception as e:
                        print(f"[YTDL-Security] Could not delete {fpath}: {e}")

def select_output_folder(current_dir=None):
    """Opens a native OS folder picker dialog to let the user pick a download folder."""
    initial = current_dir if current_dir and os.path.exists(current_dir) else DEFAULT_DOWNLOAD_DIR
    selected = None

    # Try Tkinter (Standard on Windows/Linux/macOS)
    try:
        import tkinter as tk
        from tkinter import filedialog
        root = tk.Tk()
        root.withdraw()
        root.attributes('-topmost', True)
        selected = filedialog.askdirectory(
            initialdir=initial,
            title="Select Download Folder — YT Media Downloader"
        )
        root.destroy()
    except Exception:
        pass

    # Fallback via PowerShell on Windows if Tkinter unavailable
    if not selected and IS_WINDOWS:
        try:
            ps_script = f"""
            Add-Type -AssemblyName System.Windows.Forms
            $f = New-Object System.Windows.Forms.FolderBrowserDialog
            $f.Description = 'Select Download Folder — YT Media Downloader'
            $f.SelectedPath = '{initial}'
            if ($f.ShowDialog() -eq 'OK') {{ $f.SelectedPath }}
            """
            cf = getattr(subprocess, 'CREATE_NO_WINDOW', 0)
            res = subprocess.run(["powershell", "-NoProfile", "-Command", ps_script], capture_output=True, text=True, creationflags=cf)
            if res.returncode == 0 and res.stdout.strip():
                selected = res.stdout.strip()
        except Exception:
            pass

    if selected and os.path.exists(selected) and os.path.isdir(selected):
        return os.path.abspath(selected)
    
    return initial

def update_in_memory_cookies(cookies_list):
    """Sanitize and format cookies into a Netscape Cookie string in RAM only (0 disk persistence)."""
    global IN_MEMORY_COOKIES_NETSCAPE
    if not cookies_list or not isinstance(cookies_list, list):
        return

    netscape_lines = [
        "# Netscape HTTP Cookie File",
        "# https://curl.haxx.se/docs/http-cookies.html",
        "# Generated dynamically in-memory by YT Media Downloader",
        ""
    ]
    count = 0
    for c in cookies_list:
        if not isinstance(c, dict):
            continue
        name = c.get("name")
        if not name or name in DISCARD_COOKIES or name.startswith("__Secure-"):
            continue
        value = str(c.get("value", ""))
        domain = str(c.get("domain") or ".youtube.com")
        path = str(c.get("path") or "/")
        secure = "TRUE" if c.get("secure") else "FALSE"
        include_subdomains = "TRUE" if domain.startswith(".") else "FALSE"
        try:
            expiration = str(int(c.get("expirationDate") or (time.time() + 86400 * 365)))
        except Exception:
            expiration = str(int(time.time() + 86400 * 365))

        line = f"{domain}\t{include_subdomains}\t{path}\t{secure}\t{expiration}\t{name}\t{value}"
        netscape_lines.append(line)
        count += 1

    if count > 0:
        with COOKIES_LOCK:
            IN_MEMORY_COOKIES_NETSCAPE = "\n".join(netscape_lines) + "\n"
        print(f"[YTDL-Security] Updated in-memory Netscape cookies: {count} entries (RAM only)")

def _get_current_netscape_cookies():
    with COOKIES_LOCK:
        return IN_MEMORY_COOKIES_NETSCAPE

def _run_ytdlp_cmd(args, timeout=None):
    """Run yt-dlp with optional in-memory cookies and PO-Token using an ephemeral temp file deleted instantly after execution."""
    cmd = [YTDLP_BIN] + args
    
    js_args = get_js_runtime_args()
    if js_args:
        cmd.extend(js_args)

    netscape_str = _get_current_netscape_cookies()
    po_token_str = _get_current_po_token()
    temp_cookie_path = None

    if po_token_str:
        cmd.extend(["--extractor-args", f"youtube:po_token=web+{po_token_str}"])

    browser_cookies = get_browser_cookies_args()
    if browser_cookies:
        cmd.extend(browser_cookies)
    elif netscape_str:
        try:
            tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".ytck", delete=False, encoding="utf-8")
            tmp.write(netscape_str)
            tmp.close()
            temp_cookie_path = tmp.name
            cmd.extend(["--cookies", temp_cookie_path])
        except Exception as e:
            print(f"[YTDL] Error creating ephemeral cookie temp file: {e}")

    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, **_subprocess_kwargs)
        return res
    finally:
        if temp_cookie_path and os.path.exists(temp_cookie_path):
            try:
                os.remove(temp_cookie_path)
            except Exception:
                pass

# Default download directory (Documents/YTDownloader)
DOCUMENTS_DIR = os.path.join(os.path.expanduser("~"), "Documents")
DEFAULT_DOWNLOAD_DIR = os.path.join(DOCUMENTS_DIR, "YTDownloader")
os.makedirs(DEFAULT_DOWNLOAD_DIR, exist_ok=True)
UPDATES_DIR = os.path.join(DEFAULT_DOWNLOAD_DIR, "Updates")
os.makedirs(UPDATES_DIR, exist_ok=True)

# ─── Update System (Safe, AV-Friendly) ───────────────────────────
GITHUB_REPO = "BlaxDEV/YT-Media-Downloader"
update_cache = {"timestamp": 0, "data": None}
update_download_state = {
    "status": "idle",
    "progress": 0.0,
    "downloaded_bytes": 0,
    "total_bytes": 0,
    "file_path": None,
    "error": None
}
update_download_lock = threading.Lock()

def _parse_version(v_str):
    if not v_str:
        return (0,)
    clean = re.sub(r'^[vV]', '', str(v_str).strip())
    parts = []
    for p in clean.split('.'):
        digits = re.match(r'^\d+', p)
        if digits:
            try:
                parts.append(int(digits.group(0)))
            except ValueError:
                parts.append(0)
        else:
            parts.append(0)
    return tuple(parts)

def check_for_updates(force=False):
    global update_cache
    now = time.time()
    if not force and update_cache["data"] and (now - update_cache["timestamp"] < 3600):
        return update_cache["data"]

    api_url = f"https://api.github.com/repos/{GITHUB_REPO}/releases/latest"
    req = urllib.request.Request(
        api_url,
        headers={
            "User-Agent": f"YT-Media-Downloader/{VERSION}",
            "Accept": "application/vnd.github.v3+json"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status != 200:
                raise Exception(f"GitHub API returned status {response.status}")
            data = json.loads(response.read().decode("utf-8"))

        tag = data.get("tag_name", "").strip()
        latest_clean = re.sub(r'^[vV]', '', tag)
        current_parsed = _parse_version(VERSION)
        latest_parsed = _parse_version(latest_clean)
        is_newer = latest_parsed > current_parsed

        is_win = platform.system() == "Windows"
        assets = data.get("assets") or []
        target_asset = None
        for asset in assets:
            name = asset.get("name", "")
            if is_win:
                if name.endswith(".exe") and ("Win" in name or "Setup" in name or "YT_Downloader" in name):
                    target_asset = asset
                    break
            else:
                if (name.endswith(".tar.gz") or name.endswith(".sh")) and ("Linux" in name or "YT_Downloader" in name):
                    target_asset = asset
                    break

        if not target_asset and assets:
            target_asset = assets[0]

        result = {
            "status": "ok",
            "update_available": is_newer,
            "current_version": VERSION,
            "latest_version": latest_clean,
            "tag_name": tag,
            "title": data.get("name") or f"Versión {tag}",
            "notes": (data.get("body") or "").strip(),
            "html_url": data.get("html_url") or f"https://github.com/{GITHUB_REPO}/releases/latest",
            "asset_name": target_asset.get("name") if target_asset else "",
            "download_url": target_asset.get("browser_download_url") if target_asset else "",
            "asset_size": target_asset.get("size") if target_asset else 0,
            "published_at": data.get("published_at", "")
        }
        update_cache["timestamp"] = now
        update_cache["data"] = result
        return result
    except Exception as e:
        if update_cache["data"]:
            return update_cache["data"]
        return {
            "status": "error",
            "update_available": False,
            "current_version": VERSION,
            "error": str(e)
        }

def _download_update_worker(download_url, dest_path):
    global update_download_state
    try:
        req = urllib.request.Request(
            download_url,
            headers={"User-Agent": f"YT-Media-Downloader/{VERSION}"}
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            total_size = int(resp.headers.get("Content-Length", 0))
            with update_download_lock:
                update_download_state["status"] = "downloading"
                update_download_state["total_bytes"] = total_size
                update_download_state["downloaded_bytes"] = 0
                update_download_state["progress"] = 0.0
                update_download_state["file_path"] = dest_path
                update_download_state["error"] = None

            downloaded = 0
            chunk_size = 65536
            temp_path = dest_path + ".part"
            with open(temp_path, "wb") as f:
                while True:
                    chunk = resp.read(chunk_size)
                    if not chunk:
                        break
                    f.write(chunk)
                    downloaded += len(chunk)
                    pct = round((downloaded / total_size) * 100, 1) if total_size > 0 else 50.0
                    with update_download_lock:
                        update_download_state["downloaded_bytes"] = downloaded
                        update_download_state["progress"] = pct

            if os.path.exists(dest_path):
                try:
                    os.remove(dest_path)
                except Exception:
                    pass
            os.replace(temp_path, dest_path)

        with update_download_lock:
            update_download_state["status"] = "ready"
            update_download_state["progress"] = 100.0
            update_download_state["file_path"] = dest_path
    except Exception as e:
        with update_download_lock:
            update_download_state["status"] = "error"
            update_download_state["error"] = str(e)

# In-memory job tracking and persistent disk history
jobs = {}
jobs_lock = threading.Lock()
history = []
history_lock = threading.Lock()
HISTORY_FILE = os.path.join(DEFAULT_DOWNLOAD_DIR, ".ytdl_history.json")

def _load_history():
    global history
    try:
        if os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    history = data[:100]
    except Exception:
        history = []

def _clean_history_item(item):
    if not isinstance(item, dict):
        return {}
    cleaned = dict(item)
    cleaned.pop("process", None)
    return cleaned

def _save_history():
    try:
        clean_list = [_clean_history_item(h) for h in history[:100]]
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(clean_list, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

def _check_item_exists(item):
    out_dir = item.get("output_dir") or DEFAULT_DOWNLOAD_DIR
    if not os.path.exists(out_dir):
        return False
    fname = item.get("filename")
    if fname and os.path.exists(fname):
        return True
    if fname and os.path.exists(os.path.join(out_dir, os.path.basename(fname))):
        return True
    if os.path.exists(out_dir):
        title = item.get("title", "")
        if not title or title == "Descargando...":
            return True
        t_clean = "".join(c for c in title if c.isalnum()).lower()
        if not t_clean or len(t_clean) <= 2:
            return True
        try:
            for f in os.listdir(out_dir):
                f_clean = "".join(c for c in f if c.isalnum()).lower()
                if t_clean[:12] in f_clean or f_clean.startswith(t_clean[:10]):
                    return True
        except Exception:
            pass
    return False

_load_history()

download_queue = queue.Queue()

def cancel_job(job_id):
    """Cancels an active or queued download job, terminating any running process and updating history."""
    with jobs_lock:
        job = jobs.get(job_id)
        if job:
            job["cancelled"] = True
            job["status"] = "cancelled"
            job["progress"] = 0.0
            job["error"] = "Cancelled by user"

    if job:
        proc = job.get("process")
        if proc and proc.poll() is None:
            try:
                if IS_WINDOWS:
                    subprocess.run(
                        ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                        capture_output=True,
                        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0)
                    )
                else:
                    proc.terminate()
                    try:
                        proc.wait(timeout=2)
                    except subprocess.TimeoutExpired:
                        proc.kill()
            except Exception as e:
                print(f"[YTDL] Error terminating process for {job_id}: {e}")

    with history_lock:
        found = False
        for h in history:
            if h.get("id") == job_id:
                h["status"] = "cancelled"
                h["progress"] = 0.0
                h["error"] = "Cancelled by user"
                found = True
                break
        _save_history()

    if job:
        fname = job.get("filename")
        if fname:
            part_file = f"{fname}.part"
            for fpath in (fname, part_file):
                if os.path.exists(fpath):
                    try:
                        os.remove(fpath)
                    except Exception:
                        pass
        return True
    return found

class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

class YTDLRequestHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, data, status_code=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status_code)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == "/ping" or path == "/status":
            self._send_json({
                "status": "ok",
                "version": VERSION,
                "platform": platform.system(),
                "has_cookies": bool(_get_current_netscape_cookies()),
                "has_potoken": bool(_get_current_po_token()),
                "features": ["po_token", "playlist_queue", "audio_studio", "trimming", "cookie_bypass"]
            })

        elif path == "/history":
            with history_lock:
                history_data = []
                for job in history:
                    item = _clean_history_item(job)
                    live_job = jobs.get(item.get("id"))
                    if live_job:
                        item["progress"] = live_job.get("progress", item.get("progress", 0))
                        item["status"] = live_job.get("status", item.get("status"))
                    if item.get("status") == "complete":
                        item["file_exists"] = _check_item_exists(item)
                    else:
                        item["file_exists"] = True
                    history_data.append(item)
                self._send_json({"downloads": history_data, "history": history_data})

        elif path == "/info":
            url = query.get("url", [""])[0]
            if not url:
                self._send_json({"error": "URL is required"}, status_code=400)
                return
            try:
                res = _run_ytdlp_cmd(["--dump-json", "--no-warnings", "--no-playlist", url])
                if res.returncode != 0:
                    res = _run_ytdlp_cmd(["--dump-json", "--no-warnings", "--no-playlist", "--extractor-args", "youtube:player_client=android,web", url])
                if res.returncode != 0:
                    err_msg = res.stderr.strip() if res.stderr else f"Error executing yt-dlp (exit code {res.returncode})"
                    self._send_json({"error": err_msg}, status_code=500)
                    return
                info = json.loads(res.stdout)
                chapters = []
                for idx, ch in enumerate(info.get("chapters") or []):
                    chapters.append({
                        "index": idx + 1,
                        "title": ch.get("title", f"Chapter {idx + 1}"),
                        "start_time": ch.get("start_time", 0),
                        "end_time": ch.get("end_time", 0)
                    })
                self._send_json({
                    "title": info.get("title", "YouTube Video"),
                    "duration": info.get("duration", 0),
                    "thumbnail": info.get("thumbnail", ""),
                    "uploader": info.get("uploader", ""),
                    "chapters": chapters
                })
            except Exception as e:
                self._send_json({"error": f"Error fetching video info: {str(e)}"}, status_code=500)

        elif path == "/formats":
            url = query.get("url", [""])[0]
            if not url:
                self._send_json({"error": "URL is required"}, status_code=400)
                return
            try:
                res = _run_ytdlp_cmd(["--dump-json", "--no-warnings", "--no-playlist", url])
                if res.returncode != 0:
                    res = _run_ytdlp_cmd(["--dump-json", "--no-warnings", "--no-playlist", "--extractor-args", "youtube:player_client=android,ios,mweb,web", url])
                if res.returncode != 0:
                    err_msg = res.stderr.strip() if res.stderr else f"Error executing yt-dlp (exit code {res.returncode})"
                    self._send_json({"error": err_msg}, status_code=500)
                    return
                info = json.loads(res.stdout)
                formats = _extract_video_formats(info)

                # Fallback: if single resolution returned, retry with multi-client player_client
                if len(set(f["resolution"] for f in formats)) <= 1:
                    retry_res = _run_ytdlp_cmd(["--dump-json", "--no-warnings", "--no-playlist", "--extractor-args", "youtube:player_client=android,ios,mweb,web", url])
                    if retry_res.returncode == 0:
                        retry_info = json.loads(retry_res.stdout)
                        retry_formats = _extract_video_formats(retry_info)
                        if len(retry_formats) > len(formats):
                            formats = retry_formats
                            info = retry_info

                self._send_json({
                    "formats": formats,
                    "title": info.get("title", "Video"),
                    "subtitles": list((info.get("subtitles") or {}).keys()),
                    "automatic_captions": list((info.get("automatic_captions") or {}).keys()),
                    "audio_tracks": _extract_audio_tracks(info)
                })
            except Exception as e:
                self._send_json({"error": f"Error fetching formats: {str(e)}"}, status_code=500)

        elif path == "/check_update":
            force = query.get("force", ["false"])[0] == "true"
            res = check_for_updates(force=force)
            self._send_json(res)

        elif path == "/update_progress":
            with update_download_lock:
                state_copy = dict(update_download_state)
            self._send_json(state_copy)

        elif path == "/progress":
            job_id = query.get("id", [""])[0]
            job = jobs.get(job_id)
            if not job:
                self._send_json({"error": "Job not found"}, status_code=404)
                return
            self._send_json({
                "progress": job["progress"],
                "status": job["status"],
                "output_dir": job["output_dir"]
            })

        else:
            self._send_json({"error": "Invalid path"}, status_code=404)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get("Content-Length", 0))
        body_data = self.rfile.read(content_length)
        try:
            body = json.loads(body_data.decode("utf-8"))
        except:
            body = {}

        # Ingest and sanitize in-memory cookies if transmitted
        cookies_data = body.get("cookies")
        if cookies_data and isinstance(cookies_data, list):
            update_in_memory_cookies(cookies_data)

        # Ingest PO-Token if transmitted
        potoken_data = body.get("po_token") or body.get("potoken")
        if potoken_data:
            update_po_token(potoken_data)

        if path == "/cookies" or path == "/po_token":
            self._send_json({"status": "ok", "has_potoken": bool(_get_current_po_token())})

        elif path == "/info":
            url = body.get("url")
            if not url:
                self._send_json({"error": "URL is required"}, status_code=400)
                return
            try:
                res = _run_ytdlp_cmd(["--dump-json", "--no-warnings", "--no-playlist", url])
                if res.returncode != 0:
                    res = _run_ytdlp_cmd(["--dump-json", "--no-warnings", "--no-playlist", "--extractor-args", "youtube:player_client=android,web", url])
                if res.returncode != 0:
                    err_msg = res.stderr.strip() if res.stderr else f"Error executing yt-dlp (exit code {res.returncode})"
                    self._send_json({"error": err_msg}, status_code=500)
                    return
                info = json.loads(res.stdout)
                chapters = []
                for idx, ch in enumerate(info.get("chapters") or []):
                    chapters.append({
                        "index": idx + 1,
                        "title": ch.get("title", f"Chapter {idx + 1}"),
                        "start_time": ch.get("start_time", 0),
                        "end_time": ch.get("end_time", 0)
                    })
                self._send_json({
                    "title": info.get("title", "YouTube Video"),
                    "duration": info.get("duration", 0),
                    "thumbnail": info.get("thumbnail", ""),
                    "uploader": info.get("uploader", ""),
                    "chapters": chapters
                })
            except Exception as e:
                self._send_json({"error": f"Error fetching video info: {str(e)}"}, status_code=500)

        elif path == "/formats":
            url = body.get("url")
            if not url:
                self._send_json({"error": "URL is required"}, status_code=400)
                return
            try:
                res = _run_ytdlp_cmd(["--dump-json", "--no-warnings", "--no-playlist", url])
                if res.returncode != 0:
                    res = _run_ytdlp_cmd(["--dump-json", "--no-warnings", "--no-playlist", "--extractor-args", "youtube:player_client=android,ios,mweb,web", url])
                if res.returncode != 0:
                    err_msg = res.stderr.strip() if res.stderr else f"Error executing yt-dlp (exit code {res.returncode})"
                    self._send_json({"error": err_msg}, status_code=500)
                    return
                info = json.loads(res.stdout)
                formats = _extract_video_formats(info)

                # Fallback: if single resolution returned, retry with multi-client player_client
                if len(set(f["resolution"] for f in formats)) <= 1:
                    retry_res = _run_ytdlp_cmd(["--dump-json", "--no-warnings", "--no-playlist", "--extractor-args", "youtube:player_client=android,ios,mweb,web", url])
                    if retry_res.returncode == 0:
                        retry_info = json.loads(retry_res.stdout)
                        retry_formats = _extract_video_formats(retry_info)
                        if len(retry_formats) > len(formats):
                            formats = retry_formats
                            info = retry_info

                self._send_json({
                    "formats": formats,
                    "title": info.get("title", "Video"),
                    "subtitles": list((info.get("subtitles") or {}).keys()),
                    "automatic_captions": list((info.get("automatic_captions") or {}).keys()),
                    "audio_tracks": _extract_audio_tracks(info)
                })
            except Exception as e:
                self._send_json({"error": f"Error fetching formats: {str(e)}"}, status_code=500)

        elif path == "/playlist_info":
            url = body.get("url")
            if not url:
                self._send_json({"error": "URL is required"}, status_code=400)
                return
            try:
                res = _run_ytdlp_cmd(["--flat-playlist", "--dump-json", "--no-warnings", "--playlist-end", "100", url])
                if res.returncode != 0:
                    err_msg = res.stderr.strip() if res.stderr else f"Error fetching playlist info (exit code {res.returncode})"
                    self._send_json({"error": err_msg}, status_code=500)
                    return
                
                items = []
                playlist_title = "Playlist"
                lines = [line.strip() for line in res.stdout.strip().split("\n") if line.strip()]
                for idx, line in enumerate(lines):
                    try:
                        item_json = json.loads(line)
                        p_title = item_json.get("playlist_title") or item_json.get("playlist")
                        if p_title:
                            playlist_title = p_title
                        
                        v_id = item_json.get("id") or _extract_video_id(item_json.get("url") or "")
                        v_url = f"https://www.youtube.com/watch?v={v_id}" if v_id else (item_json.get("url") or url)
                        dur_val = item_json.get("duration") or 0
                        dur_str = item_json.get("duration_string") or (f"{int(dur_val//60)}:{int(dur_val%60):02d}" if dur_val else "")
                        
                        items.append({
                            "index": idx + 1,
                            "id": v_id,
                            "title": item_json.get("title") or f"Video {idx + 1}",
                            "duration_str": dur_str,
                            "url": v_url
                        })
                    except Exception:
                        pass
                
                self._send_json({
                    "status": "ok",
                    "playlist_title": playlist_title,
                    "total_videos": len(items),
                    "items": items
                })
            except Exception as e:
                self._send_json({"error": f"Error fetching playlist: {str(e)}"}, status_code=500)

        elif path == "/frame_grab":
            url = body.get("url")
            timestamp = body.get("timestamp", 0)
            title = body.get("title", "Frame")
            out_dir = body.get("output_dir") or DEFAULT_DOWNLOAD_DIR
            os.makedirs(out_dir, exist_ok=True)
            try:
                clean_title = "".join(c for c in title if c.isalnum() or c in " -_()").strip() or "frame"
                time_str = f"{int(float(timestamp))}s"
                out_path = os.path.join(out_dir, f"{clean_title} - Frame {time_str}.png")
                
                if body.get("data_url"):
                    import base64
                    header, encoded = body["data_url"].split(",", 1) if "," in body["data_url"] else ("", body["data_url"])
                    data = base64.b64decode(encoded)
                    with open(out_path, "wb") as f:
                        f.write(data)
                else:
                    stream_res = _run_ytdlp_cmd(["--no-warnings", "-g", "-f", "bestvideo/best", url])
                    if stream_res.returncode != 0:
                        raise Exception(stream_res.stderr or "Error extracting stream URL")
                    stream_url = stream_res.stdout.strip().split("\n")[0]
                    ff_cmd = [FFMPEG_BIN, "-y", "-ss", str(timestamp), "-i", stream_url, "-vframes", "1", "-q:v", "2", out_path]
                    subprocess.run(ff_cmd, capture_output=True, check=True, **_subprocess_kwargs)
                self._send_json({"status": "ok", "path": out_path})
            except Exception as e:
                self._send_json({"error": str(e)}, status_code=500)

        elif path == "/download":
            url = body.get("url")
            if not url:
                self._send_json({"error": "URL is required"}, status_code=400)
                return

            job_id = str(uuid.uuid4())[:8]
            out_dir = body.get("output_dir") or DEFAULT_DOWNLOAD_DIR
            os.makedirs(out_dir, exist_ok=True)

            import datetime
            now_dt = datetime.datetime.now()
            date_str = now_dt.strftime("%d/%m/%Y")
            time_str = now_dt.strftime("%H:%M")
            timestamp_str = f"{date_str} {time_str}"

            video_id = _extract_video_id(url)
            thumb_url = body.get("thumbnail")
            if not thumb_url and video_id:
                thumb_url = f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg"

            fmt_type = body.get("type", "video")
            quality = body.get("quality", "1080p" if fmt_type == "video" else "320k")
            fmt_ext = (body.get("ext") or body.get("audio_format") or "MP4").upper()
            duration_val = body.get("duration") or body.get("duration_str") or ""

            initial_status = "processing" if download_queue.empty() else "queued"

            job_entry = {
                "id": job_id,
                "url": url,
                "title": body.get("title", "Downloading..."),
                "type": fmt_type,
                "quality": quality,
                "format": fmt_ext,
                "duration": duration_val,
                "thumbnail": thumb_url,
                "date": date_str,
                "timestamp_str": timestamp_str,
                "filesize_str": "",
                "progress": 0.0,
                "status": initial_status,
                "output_dir": out_dir
            }

            with jobs_lock:
                jobs[job_id] = dict(job_entry)

            with history_lock:
                history.insert(0, dict(job_entry))
                active_ids = {j_id for j_id, j in jobs.items() if j.get("status") in ("processing", "queued")}
                while len(history) > 100:
                    evicted = False
                    for idx in range(len(history) - 1, -1, -1):
                        if history[idx].get("id") not in active_ids:
                            history.pop(idx)
                            evicted = True
                            break
                    if not evicted:
                        break
                _save_history()

            download_queue.put((job_id, body))

            self._send_json({"id": job_id, "status": initial_status})

        elif path == "/download_batch":
            items = body.get("items")
            if not items or not isinstance(items, list):
                self._send_json({"error": "Items list is required"}, status_code=400)
                return

            out_dir = body.get("output_dir") or DEFAULT_DOWNLOAD_DIR
            os.makedirs(out_dir, exist_ok=True)

            fmt_type = body.get("type", "video")
            quality = body.get("quality", "1080p" if fmt_type == "video" else "320k")
            fmt_ext = (body.get("ext") or body.get("audio_format") or "MP4").upper()

            import datetime
            now_dt = datetime.datetime.now()
            date_str = now_dt.strftime("%d/%m/%Y")
            time_str = now_dt.strftime("%H:%M")
            timestamp_str = f"{date_str} {time_str}"

            created_jobs = []
            with history_lock, jobs_lock:
                for idx, item in enumerate(items):
                    item_url = item.get("url") or (f"https://www.youtube.com/watch?v={item.get('id')}" if item.get('id') else "")
                    if not item_url:
                        continue
                    job_id = str(uuid.uuid4())[:8]
                    v_id = item.get("id") or _extract_video_id(item_url)
                    thumb_url = item.get("thumbnail") or (f"https://i.ytimg.com/vi/{v_id}/mqdefault.jpg" if v_id else "")

                    item_body = dict(body)
                    item_body.pop("items", None)
                    item_body["url"] = item_url
                    item_body["title"] = item.get("title") or f"Video {idx + 1}"
                    item_body["duration_str"] = item.get("duration_str") or ""
                    item_body["thumbnail"] = thumb_url
                    item_body["is_playlist"] = False
                    # Remove active-player-only parameters
                    item_body.pop("format_id", None)
                    item_body.pop("trim_a", None)
                    item_body.pop("trim_b", None)
                    item_body.pop("trim_start", None)
                    item_body.pop("trim_end", None)
                    item_body.pop("trim_ranges", None)
                    item_body.pop("split_chapters", None)
                    item_body.pop("chapters", None)

                    initial_status = "processing" if (idx == 0 and download_queue.empty()) else "queued"

                    job_entry = {
                        "id": job_id,
                        "url": item_url,
                        "title": item_body["title"],
                        "type": fmt_type,
                        "quality": quality,
                        "format": fmt_ext,
                        "duration": item_body["duration_str"],
                        "thumbnail": thumb_url,
                        "date": date_str,
                        "timestamp_str": timestamp_str,
                        "filesize_str": "",
                        "progress": 0.0,
                        "status": initial_status,
                        "output_dir": out_dir
                    }
                    jobs[job_id] = dict(job_entry)
                    history.insert(0, dict(job_entry))
                    download_queue.put((job_id, item_body))
                    created_jobs.append({"id": job_id, "title": job_entry["title"], "url": item_url})

                active_ids = {j_id for j_id, j in jobs.items() if j.get("status") in ("processing", "queued")}
                while len(history) > 100:
                    evicted = False
                    for i in range(len(history) - 1, -1, -1):
                        if history[i].get("id") not in active_ids:
                            history.pop(i)
                            evicted = True
                            break
                    if not evicted:
                        break
                _save_history()

            self._send_json({
                "status": "ok",
                "count": len(created_jobs),
                "jobs": created_jobs
            })

        elif path == "/select_folder":
            curr = body.get("current_dir") or DEFAULT_DOWNLOAD_DIR
            chosen = select_output_folder(curr)
            if chosen:
                self._send_json({"folder": chosen, "cancelled": False, "status": "ok"})
            else:
                self._send_json({"folder": None, "cancelled": True, "status": "cancelled"})

        elif path == "/clear_history":
            with history_lock:
                history.clear()
                _save_history()
            self._send_json({"status": "ok"})

        elif path == "/cancel":
            job_id = body.get("id")
            if not job_id:
                self._send_json({"error": "Job ID is required"}, status_code=400)
                return
            ok = cancel_job(job_id)
            self._send_json({"status": "ok" if ok else "not_found", "cancelled": ok})

        elif path == "/download_update":
            url = body.get("download_url")
            name = body.get("asset_name")
            if not url:
                cached = update_cache.get("data") or {}
                url = cached.get("download_url")
                name = cached.get("asset_name")
            if not url:
                self._send_json({"error": "No download URL provided and no cached update found"}, status_code=400)
                return
            if not name:
                name = f"Setup_YT_Downloader-Win-v{VERSION}.exe" if platform.system() == "Windows" else f"Setup_YT_Downloader-Linux-v{VERSION}.tar.gz"

            dest_path = os.path.join(UPDATES_DIR, name)
            with update_download_lock:
                if update_download_state.get("status") == "downloading":
                    self._send_json({"status": "already_downloading", "progress": update_download_state.get("progress", 0)})
                    return
                update_download_state["status"] = "downloading"
                update_download_state["progress"] = 0.0
                update_download_state["error"] = None
                update_download_state["file_path"] = dest_path

            t = threading.Thread(target=_download_update_worker, args=(url, dest_path), daemon=True)
            t.start()
            self._send_json({"status": "started", "file_path": dest_path})

        elif path == "/install_update":
            with update_download_lock:
                file_path = update_download_state.get("file_path")
            if not file_path or not os.path.exists(file_path):
                file_path = body.get("file_path")
            if not file_path or not os.path.exists(file_path):
                self._send_json({"error": "No downloaded installer file found"}, status_code=400)
                return
            try:
                abs_path = os.path.abspath(file_path)
                if platform.system() == "Windows":
                    os.startfile(abs_path)
                else:
                    subprocess.Popen(["xdg-open", abs_path])
                self._send_json({"status": "ok", "message": "Installer launched", "file_path": abs_path})
            except Exception as e:
                self._send_json({"error": f"Failed to launch installer: {e}"}, status_code=500)

        elif path == "/open_folder":
            folder = body.get("path") or DEFAULT_DOWNLOAD_DIR
            if os.path.exists(folder):
                try:
                    if IS_WINDOWS:
                        os.startfile(folder)
                    elif platform.system() == "Darwin":
                        subprocess.run(["open", folder])
                    else:
                        subprocess.run(["xdg-open", folder])
                    self._send_json({"status": "ok"})
                except Exception as e:
                    self._send_json({"error": str(e)}, status_code=500)
            else:
                self._send_json({"error": "Folder does not exist"}, status_code=404)

        else:
            self._send_json({"error": "Invalid POST path"}, status_code=404)

def _run_download_task(job_id, body):
    job = jobs[job_id]
    url = job.get("url") or body.get("url", "")
    out_dir = job.get("output_dir") or body.get("out_dir") or DEFAULT_DOWNLOAD_DIR
    temp_cookie_path = None
    try:
        fmt_type = body.get("type", "video") # "video" or "audio"
        trim_a = body.get("trim_a") or body.get("trim_start")
        trim_b = body.get("trim_b") or body.get("trim_end")
        trim_ranges = body.get("trim_ranges", [])
        split_chapters = body.get("split_chapters", False)
        selected_chapters = body.get("chapters", [])
        lufs_norm = body.get("lufs_norm", False)
        audio_meta = body.get("audio_meta", False)

        if fmt_type == "audio":
            ext = (body.get("ext") or body.get("audio_format") or "mp3").lower()
            valid_audio = ("best", "aac", "alac", "flac", "m4a", "mka", "mp3", "ogg", "opus", "vorbis", "wav")
            if ext not in valid_audio:
                ext = "mp3"
        else:
            ext = body.get("ext", "mp4").lower()

        is_anim_export = ext in ("gif", "webp")
        target_ext = ext
        if is_anim_export:
            ext = "mp4"

        cmd = [YTDLP_BIN, "--no-warnings", "--newline", "--progress-template", "%(progress._percent_str)s"]

        # Attach JS runtime for solving YouTube challenges (avoids 403 Forbidden)
        js_args = get_js_runtime_args()
        if js_args:
            cmd.extend(js_args)

        # Attach PO-Token if present in payload or global memory
        po_token_val = body.get("po_token") or body.get("potoken")
        if po_token_val:
            update_po_token(po_token_val)
        cur_po = _get_current_po_token()
        if cur_po:
            cmd.extend(["--extractor-args", f"youtube:po_token=web+{cur_po}"])

        # Playlist & Rate Throttling
        is_playlist = bool(body.get("is_playlist", False))
        if is_playlist:
            sleep_val = body.get("sleep_interval", 3)
            cmd.extend([
                "--sleep-requests", "1.5",
                "--sleep-interval", str(sleep_val),
                "--max-sleep-interval", str(int(sleep_val) + 3)
            ])
        else:
            cmd.append("--no-playlist")
            v_id = _extract_video_id(url)
            if v_id and "list=" in url:
                url = f"https://www.youtube.com/watch?v={v_id}"

        netscape_str = _get_current_netscape_cookies()
        browser_cookies = get_browser_cookies_args()
        if browser_cookies:
            cmd.extend(browser_cookies)
        elif netscape_str:
            try:
                tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".ytck", delete=False, encoding="utf-8")
                tmp.write(netscape_str)
                tmp.close()
                temp_cookie_path = tmp.name
                cmd.extend(["--cookies", temp_cookie_path])
            except Exception as e:
                print(f"[YTDL] Error creating ephemeral cookie temp file for download: {e}")

        if FFMPEG_BIN != "ffmpeg":
            cmd.extend(["--ffmpeg-location", os.path.dirname(FFMPEG_BIN)])

        # Chapters handling
        if split_chapters:
            cmd.append("--split-chapters")
        elif selected_chapters:
            for ch in selected_chapters:
                if ch.get("start") is not None and ch.get("end") is not None:
                    cmd.extend(["--download-sections", f"*{ch['start']}-{ch['end']}"])

        # Trimming arguments (Multi-cuts or single cut)
        if not split_chapters and not selected_chapters:
            if trim_ranges and len(trim_ranges) > 0:
                for tr in trim_ranges:
                    if isinstance(tr, dict) and tr.get("start") is not None and tr.get("end") is not None:
                        cmd.extend(["--download-sections", f"*{tr['start']}-{tr['end']}"])
                    elif isinstance(tr, str) and "-" in tr:
                        cmd.extend(["--download-sections", f"*{tr}"])
            elif trim_a is not None and trim_b is not None and (str(trim_a) != "0:00" or str(trim_b) != ""):
                cmd.extend(["--download-sections", f"*{trim_a}-{trim_b}"])

        if fmt_type == "audio":
            cmd.extend(["-f", "bestaudio/best", "-x", "--audio-format", ext])
            audio_q = body.get("audio_quality") or body.get("quality")
            if audio_q:
                cmd.extend(["--audio-quality", str(audio_q).lower()])
            postprocessor_args = []
            if lufs_norm:
                postprocessor_args.extend(["-af", "loudnorm=I=-14:LRA=11:TP=-1.5"])
            if postprocessor_args:
                cmd.extend(["--postprocessor-args", f"ffmpeg:{' '.join(postprocessor_args)}"])
            if audio_meta:
                cmd.extend(["--embed-metadata", "--embed-thumbnail"])
        else:
            # Video format combining
            if is_anim_export:
                cmd.extend(["-f", "bestvideo[height<=1080]/best"])
            else:
                fmt_id = str(body.get("format_id") or "")
                quality = str(body.get("quality") or "1080p")
                # Extract target height from quality field (e.g. "1080p" -> "1080")
                target_h = quality.replace("p", "").strip() or "1080"
                no_audio = bool(body.get("no_audio", False))
                audio_track = body.get("audio_track")

                has_real_fmt = fmt_id and not fmt_id.startswith("res:") and fmt_id not in ("", "undefined")

                if no_audio:
                    # User explicitly opted out of audio
                    v_only_fmt = fmt_id.split("+")[0] if has_real_fmt else ""
                    if v_only_fmt:
                        format_spec = f"{v_only_fmt}/bestvideo[height<={target_h}]/bestvideo"
                    else:
                        format_spec = f"bestvideo[height<={target_h}]/bestvideo/best"
                else:
                    # Default: Include sound. Merge requested video stream with audio stream.
                    a_spec = f"{audio_track}/bestaudio" if audio_track else "bestaudio"
                    if has_real_fmt:
                        if "+" in fmt_id:
                            # fmt_id already includes audio combination (e.g. "137+140")
                            format_spec = f"{fmt_id}/bestvideo[height<={target_h}]+{a_spec}/bestvideo[height<={target_h}]+bestaudio/best"
                        else:
                            # fmt_id is video-only (e.g. "137") -> MUST append audio stream with +
                            format_spec = f"{fmt_id}+{a_spec}/{fmt_id}+bestaudio/bestvideo[height<={target_h}]+{a_spec}/bestvideo[height<={target_h}]+bestaudio/best"
                    else:
                        format_spec = f"bestvideo[height<={target_h}]+{a_spec}/bestvideo[height<={target_h}]+bestaudio/bestvideo[height<={target_h}]+best/best"

                cmd.extend(["-f", format_spec, "--merge-output-format", ext])
            if audio_meta:
                cmd.extend(["--embed-metadata"])

        out_template = os.path.join(out_dir, "%(title)s.temp_conv.%(ext)s" if is_anim_export else "%(title)s.%(ext)s")
        cmd.extend(["-o", out_template, url])

        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, **_subprocess_kwargs)
        job["process"] = process

        last_lines = []
        while True:
            if job.get("cancelled") or job.get("status") == "cancelled":
                break
            line = process.stdout.readline()
            if not line and process.poll() is not None:
                break
            if line:
                line = line.strip()
                last_lines.append(line)
                if len(last_lines) > 20:
                    last_lines.pop(0)
                if "%" in line:
                    try:
                        clean_pct = line.replace("%", "").strip()
                        pct_val = float(clean_pct)
                        job["progress"] = pct_val if not is_anim_export else (pct_val * 0.7)
                    except:
                        pass
                for prefix in ("[download] Destination:", "[Merger] Merging formats into", "[ExtractAudio] Destination:"):
                    if prefix in line:
                        fname = line.split(prefix)[-1].strip().strip('"').strip("'")
                        if fname:
                            job["filename"] = fname

        if job.get("cancelled") or job.get("status") == "cancelled":
            job["status"] = "cancelled"
            job["progress"] = 0.0
            with history_lock:
                for h in history:
                    if h.get("id") == job_id:
                        h["status"] = job.get("status", "unknown")
                        h["progress"] = job.get("progress", 0.0)
                        h["filesize_str"] = job.get("filesize_str", "")
                        if job.get("filename"):
                            h["filename"] = job["filename"]
                        if job.get("error"):
                            h["error"] = job["error"]
                        break
                _save_history()
            return

        if process.returncode == 0:
            if is_anim_export and job.get("filename") and os.path.exists(job["filename"]):
                temp_mp4 = job["filename"]
                final_path = temp_mp4.replace(".temp_conv.mp4", f".{target_ext}")
                job["progress"] = 85.0
                if target_ext == "gif":
                    ff_conv = [FFMPEG_BIN, "-y", "-i", temp_mp4, "-vf", "fps=15,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse", final_path]
                else:
                    ff_conv = [FFMPEG_BIN, "-y", "-i", temp_mp4, "-vf", "fps=20,scale=1080:-1:flags=lanczos", "-vcodec", "libwebp", "-lossless", "0", "-qscale", "80", "-preset", "default", "-loop", "0", "-an", "-vsync", "0", final_path]
                subprocess.run(ff_conv, capture_output=True, **_subprocess_kwargs)
                try:
                    os.remove(temp_mp4)
                except:
                    pass
                job["filename"] = final_path

            job["progress"] = 100.0
            job["status"] = "complete"
            if job.get("filename") and os.path.exists(job["filename"]):
                try:
                    size_b = os.path.getsize(job["filename"])
                    if size_b >= 1073741824:
                        job["filesize_str"] = f"{size_b / 1073741824:.2f} GB"
                    else:
                        job["filesize_str"] = f"{round(size_b / 1048576)} MB"
                except Exception:
                    pass
        else:
            if job.get("cancelled"):
                job["status"] = "cancelled"
                job["progress"] = 0.0
            else:
                job["status"] = "error"
                err_text = "\n".join(l for l in last_lines if "ERROR:" in l or "WARNING:" in l) or (last_lines[-1] if last_lines else "Download process exited with non-zero status")
                job["error"] = err_text
                print(f"[YTDL] Error downloading {job_id}: {err_text}")
        with history_lock:
            _save_history()
    except Exception as e:
        job["status"] = "error"
        job["error"] = str(e)
        with history_lock:
            _save_history()
    finally:
        if temp_cookie_path and os.path.exists(temp_cookie_path):
            try:
                os.remove(temp_cookie_path)
            except Exception:
                pass

def _download_worker():
    while True:
        try:
            job_id, body = download_queue.get()
        except Exception:
            break
        try:
            with jobs_lock:
                job = jobs.get(job_id)
                if not job or job.get("cancelled") or job.get("status") == "cancelled":
                    continue
                job["status"] = "processing"
            with history_lock:
                for h in history:
                    if h.get("id") == job_id:
                        h["status"] = "processing"
                        break
                _save_history()
            _run_download_task(job_id, body)
        except Exception as e:
            print(f"[YTDL] Download worker error for {job_id}: {e}")
        finally:
            download_queue.task_done()

_worker_thread = threading.Thread(target=_download_worker, daemon=True)
_worker_thread.start()

def main():
    print(f"=========================================================")
    print(f"  YT Media Downloader Companion Server v{VERSION}")
    print(f"  Running on: {platform.system()} ({platform.machine()})")
    print(f"  Listening at: http://{HOST}:{PORT}")
    print(f"=========================================================")
    # Purge legacy cookies files from disk on startup for security
    _purge_legacy_cookies()
    server = None
    for attempt in range(5):
        try:
            server = ThreadingHTTPServer((HOST, PORT), YTDLRequestHandler)
            break
        except Exception as e:
            if attempt < 4:
                time.sleep(1)
            else:
                try:
                    err_log = os.path.join(DEFAULT_DOWNLOAD_DIR, "server_error.log")
                    with open(err_log, "a", encoding="utf-8") as f:
                        f.write(f"[{time.ctime()}] Fatal error starting server: {e}\n")
                except Exception:
                    pass
                sys.exit(1)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[YTDL] Server stopped by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\n[YTDL] Fatal error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
