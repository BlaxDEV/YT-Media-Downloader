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
import shutil
import tempfile
import platform
import threading
import subprocess
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
VERSION = "1.2.8"

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

def select_output_folder(current_dir=None):
    """Opens a native OS folder picker dialog. Returns selected path string or None if cancelled."""
    if not current_dir or not os.path.exists(current_dir):
        current_dir = os.path.expanduser("~/Downloads")
        if not os.path.exists(current_dir):
            current_dir = os.path.expanduser("~/Documents")

    try:
        import tkinter as tk
        from tkinter import filedialog

        root = tk.Tk()
        root.withdraw()
        root.attributes("-topmost", True)
        folder = filedialog.askdirectory(
            title="Seleccionar carpeta de descarga / Select Download Folder",
            initialdir=current_dir
        )
        root.destroy()
        if folder:
            return os.path.abspath(folder)
        return None
    except Exception:
        if platform.system() == "Windows":
            try:
                ps_script = f'''
                Add-Type -AssemblyName System.Windows.Forms
                $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
                $dialog.SelectedPath = "{current_dir.replace('/', '\\')}"
                $dialog.Description = "Seleccionar carpeta de descarga / Select Download Folder"
                if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {{
                    Write-Output $dialog.SelectedPath
                }}
                '''
                res = subprocess.check_output(["powershell", "-Command", ps_script], text=True, timeout=30).strip()
                if res and os.path.exists(res):
                    return os.path.abspath(res)
            except Exception:
                pass
        return None

def _extract_video_id(url):
    if not url:
        return ""
    if "v=" in url:
        return url.split("v=")[1].split("&")[0]
    elif "youtu.be/" in url:
        return url.split("youtu.be/")[1].split("?")[0]
    elif "/shorts/" in url:
        return url.split("/shorts/")[1].split("?")[0]
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

IN_MEMORY_COOKIES_NETSCAPE = None
COOKIES_LOCK = threading.Lock()

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
            title="Seleccionar carpeta de descarga — YT Media Downloader"
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
            $f.Description = 'Seleccionar carpeta de descarga — YT Media Downloader'
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
    """Run yt-dlp with optional in-memory cookies using an ephemeral temp file deleted instantly after execution."""
    cmd = [YTDLP_BIN] + args
    netscape_str = _get_current_netscape_cookies()
    temp_cookie_path = None

    if netscape_str:
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

# In-memory job tracking and persistent disk history
jobs = {}
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
                    history = data[:50]
    except Exception:
        history = []

def _save_history():
    try:
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(history[:50], f, ensure_ascii=False, indent=2)
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

class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

class YTDLRequestHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, data, status_code=200):
        self.send_response(status_code)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == "/ping":
            self._send_json({"status": "ok", "version": VERSION, "platform": platform.system()})

        elif path == "/history":
            with history_lock:
                history_data = []
                for job in history:
                    item = dict(job)
                    if item.get("status") == "complete":
                        item["file_exists"] = _check_item_exists(item)
                    else:
                        item["file_exists"] = True
                    history_data.append(item)
                self._send_json({"downloads": history_data, "history": history_data})

        elif path == "/info":
            url = query.get("url", [""])[0]
            if not url:
                self._send_json({"error": "URL requerida"}, status_code=400)
                return
            try:
                res = _run_ytdlp_cmd(["--dump-json", "--no-warnings", "--no-playlist", url])
                if res.returncode != 0:
                    res = _run_ytdlp_cmd(["--dump-json", "--no-warnings", "--no-playlist", "--extractor-args", "youtube:player_client=android,web", url])
                if res.returncode != 0:
                    err_msg = res.stderr.strip() if res.stderr else f"Error al ejecutar yt-dlp (exit code {res.returncode})"
                    self._send_json({"error": err_msg}, status_code=500)
                    return
                info = json.loads(res.stdout)
                chapters = []
                for idx, ch in enumerate(info.get("chapters") or []):
                    chapters.append({
                        "index": idx + 1,
                        "title": ch.get("title", f"Capítulo {idx + 1}"),
                        "start_time": ch.get("start_time", 0),
                        "end_time": ch.get("end_time", 0)
                    })
                self._send_json({
                    "title": info.get("title", "Video de YouTube"),
                    "duration": info.get("duration", 0),
                    "thumbnail": info.get("thumbnail", ""),
                    "uploader": info.get("uploader", ""),
                    "chapters": chapters
                })
            except Exception as e:
                self._send_json({"error": f"Error al obtener información: {str(e)}"}, status_code=500)

        elif path == "/formats":
            url = query.get("url", [""])[0]
            if not url:
                self._send_json({"error": "URL requerida"}, status_code=400)
                return
            try:
                res = _run_ytdlp_cmd(["--dump-json", "--no-warnings", "--no-playlist", url])
                if res.returncode != 0:
                    res = _run_ytdlp_cmd(["--dump-json", "--no-warnings", "--no-playlist", "--extractor-args", "youtube:player_client=android,web", url])
                if res.returncode != 0:
                    err_msg = res.stderr.strip() if res.stderr else f"Error al ejecutar yt-dlp (exit code {res.returncode})"
                    self._send_json({"error": err_msg}, status_code=500)
                    return
                info = json.loads(res.stdout)
                formats = []
                target_res = ["1080p", "720p", "480p", "360p", "240p", "144p"]
                for fmt in info.get("formats", []):
                    height = fmt.get("height")
                    if height:
                        res_str = f"{height}p"
                        if res_str in target_res:
                            formats.append({
                                "format_id": fmt.get("format_id"),
                                "resolution": res_str,
                                "ext": fmt.get("ext", "mp4"),
                                "filesize": fmt.get("filesize") or fmt.get("filesize_approx") or 0,
                                "type": "video"
                            })
                self._send_json({"formats": formats, "title": info.get("title", "Video")})
            except Exception as e:
                self._send_json({"error": f"Error obteniendo formatos: {str(e)}"}, status_code=500)

        elif path == "/progress":
            job_id = query.get("id", [""])[0]
            job = jobs.get(job_id)
            if not job:
                self._send_json({"error": "Trabajo no encontrado"}, status_code=404)
                return
            self._send_json({
                "progress": job["progress"],
                "status": job["status"],
                "output_dir": job["output_dir"]
            })

        else:
            self._send_json({"error": "Ruta no válida"}, status_code=404)

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

        if path == "/cookies":
            self._send_json({"status": "ok"})

        elif path == "/info":
            url = body.get("url")
            if not url:
                self._send_json({"error": "URL requerida"}, status_code=400)
                return
            try:
                res = _run_ytdlp_cmd(["--dump-json", "--no-warnings", "--no-playlist", url])
                if res.returncode != 0:
                    res = _run_ytdlp_cmd(["--dump-json", "--no-warnings", "--no-playlist", "--extractor-args", "youtube:player_client=android,web", url])
                if res.returncode != 0:
                    err_msg = res.stderr.strip() if res.stderr else f"Error al ejecutar yt-dlp (exit code {res.returncode})"
                    self._send_json({"error": err_msg}, status_code=500)
                    return
                info = json.loads(res.stdout)
                chapters = []
                for idx, ch in enumerate(info.get("chapters") or []):
                    chapters.append({
                        "index": idx + 1,
                        "title": ch.get("title", f"Capítulo {idx + 1}"),
                        "start_time": ch.get("start_time", 0),
                        "end_time": ch.get("end_time", 0)
                    })
                self._send_json({
                    "title": info.get("title", "Video de YouTube"),
                    "duration": info.get("duration", 0),
                    "thumbnail": info.get("thumbnail", ""),
                    "uploader": info.get("uploader", ""),
                    "chapters": chapters
                })
            except Exception as e:
                self._send_json({"error": f"Error al obtener información: {str(e)}"}, status_code=500)

        elif path == "/formats":
            url = body.get("url")
            if not url:
                self._send_json({"error": "URL requerida"}, status_code=400)
                return
            try:
                res = _run_ytdlp_cmd(["--dump-json", "--no-warnings", "--no-playlist", url])
                if res.returncode != 0:
                    res = _run_ytdlp_cmd(["--dump-json", "--no-warnings", "--no-playlist", "--extractor-args", "youtube:player_client=android,web", url])
                if res.returncode != 0:
                    err_msg = res.stderr.strip() if res.stderr else f"Error al ejecutar yt-dlp (exit code {res.returncode})"
                    self._send_json({"error": err_msg}, status_code=500)
                    return
                info = json.loads(res.stdout)
                formats = []
                target_res = ["1080p", "720p", "480p", "360p", "240p", "144p"]
                for fmt in info.get("formats", []):
                    height = fmt.get("height")
                    if height:
                        res_str = f"{height}p"
                        if res_str in target_res:
                            formats.append({
                                "format_id": fmt.get("format_id"),
                                "resolution": res_str,
                                "ext": fmt.get("ext", "mp4"),
                                "filesize": fmt.get("filesize") or fmt.get("filesize_approx") or 0,
                                "type": "video"
                            })
                self._send_json({"formats": formats, "title": info.get("title", "Video")})
            except Exception as e:
                self._send_json({"error": f"Error obteniendo formatos: {str(e)}"}, status_code=500)

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
                self._send_json({"error": "URL requerida"}, status_code=400)
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

            jobs[job_id] = {
                "id": job_id,
                "url": url,
                "title": body.get("title", "Descargando..."),
                "type": fmt_type,
                "quality": quality,
                "format": fmt_ext,
                "duration": duration_val,
                "thumbnail": thumb_url,
                "date": date_str,
                "timestamp_str": timestamp_str,
                "filesize_str": "",
                "progress": 0.0,
                "status": "processing",
                "output_dir": out_dir
            }

            with history_lock:
                history.insert(0, jobs[job_id])
                while len(history) > 50:
                    history.pop()
                _save_history()

            thread = threading.Thread(target=self._run_download_task, args=(job_id, body))
            thread.daemon = True
            thread.start()

            self._send_json({"id": job_id, "status": "processing"})

        elif path == "/clear_history":
            with history_lock:
                history.clear()
                _save_history()
            self._send_json({"status": "ok"})

        elif path == "/select_folder":
            curr = body.get("current_dir") or DEFAULT_DOWNLOAD_DIR
            chosen = select_output_folder(curr)
            if chosen:
                self._send_json({"folder": chosen, "cancelled": False, "status": "ok"})
            else:
                self._send_json({"folder": None, "cancelled": True, "status": "cancelled"})

        else:
            self._send_json({"error": "Ruta POST no válida"}, status_code=404)

    def _run_download_task(self, job_id, body):
        job = jobs[job_id]
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

            netscape_str = _get_current_netscape_cookies()
            if netscape_str:
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
                        if tr.get("start") is not None and tr.get("end") is not None:
                            cmd.extend(["--download-sections", f"*{tr['start']}-{tr['end']}"])
                elif trim_a is not None and trim_b is not None and (str(trim_a) != "0:00" or str(trim_b) != ""):
                    cmd.extend(["--download-sections", f"*{trim_a}-{trim_b}"])

            if fmt_type == "audio":
                cmd.extend(["-x", "--audio-format", ext])
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

                    # Real numeric format_id from yt-dlp (e.g. "137+251")
                    has_real_fmt = fmt_id and not fmt_id.startswith("res:") and fmt_id not in ("", "undefined")
                    if has_real_fmt:
                        format_spec = f"{fmt_id}/bestvideo[height<={target_h}]+bestaudio/best"
                    else:
                        format_spec = f"bestvideo[height<={target_h}]+bestaudio/bestvideo[height<={target_h}]+best/best"

                    cmd.extend(["-f", format_spec, "--merge-output-format", ext])
                if audio_meta:
                    cmd.extend(["--embed-metadata"])

            out_template = os.path.join(out_dir, "%(title)s.temp_conv.%(ext)s" if is_anim_export else "%(title)s.%(ext)s")
            cmd.extend(["-o", out_template, url])

            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, **_subprocess_kwargs)

            while True:
                line = process.stdout.readline()
                if not line and process.poll() is not None:
                    break
                if line:
                    line = line.strip()
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
                job["status"] = "error"
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

def main():
    print(f"=========================================================")
    print(f"  YT Media Downloader Companion Server v{VERSION}")
    print(f"  Running on: {platform.system()} ({platform.machine()})")
    print(f"  Listening at: http://{HOST}:{PORT}")
    print(f"=========================================================")
    # Purge legacy cookies files from disk on startup for security
    _purge_legacy_cookies()
    try:
        server = ThreadingHTTPServer((HOST, PORT), YTDLRequestHandler)
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[YTDL] Server stopped by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\n[YTDL] Fatal error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
