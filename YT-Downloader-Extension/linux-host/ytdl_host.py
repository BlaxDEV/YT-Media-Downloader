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
import platform
import threading
import subprocess
from urllib.parse import urlparse, parse_qs
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn

HOST = "127.0.0.1"
PORT = 19836
VERSION = "1.2.2"

# Determine base directory and tools path
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(os.path.abspath(sys.executable))
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Check for binaries inside tools/ or tools-linux/ or fallback to system PATH
TOOLS_DIR = os.path.join(BASE_DIR, "tools")
if not os.path.exists(TOOLS_DIR):
    TOOLS_DIR = os.path.join(BASE_DIR, "..", "tools")

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

YTDLP_BIN = get_binary_path("yt-dlp")
FFMPEG_BIN = get_binary_path("ffmpeg")
FFPROBE_BIN = get_binary_path("ffprobe")

# Default download directory
if platform.system() == "Windows":
    DEFAULT_DOWNLOAD_DIR = os.path.join(os.path.expanduser("~"), "Downloads", "YTMediaDownloader")
else:
    DEFAULT_DOWNLOAD_DIR = os.path.join(os.path.expanduser("~"), "Downloads", "YTMediaDownloader")

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
                cmd = [YTDLP_BIN, "--dump-json", "--no-warnings", "--no-playlist", url]
                res = subprocess.run(cmd, capture_output=True, text=True, check=True)
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
                cmd = [YTDLP_BIN, "--dump-json", "--no-warnings", "--no-playlist", url]
                res = subprocess.run(cmd, capture_output=True, text=True, check=True)
                info = json.loads(res.stdout)
                formats = []
                # Parse video formats
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
                self._send_json({"formats": formats})
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

        if path == "/open_folder":
            folder_path = body.get("path") or DEFAULT_DOWNLOAD_DIR
            if os.path.exists(folder_path):
                try:
                    sys_name = platform.system()
                    if sys_name == "Windows":
                        os.startfile(folder_path)
                    elif sys_name == "Darwin":
                        subprocess.Popen(["open", folder_path])
                    else:  # Linux
                        subprocess.Popen(["xdg-open", folder_path])
                    self._send_json({"status": "ok"})
                except Exception as e:
                    self._send_json({"error": str(e)}, status_code=500)
            else:
                self._send_json({"error": "La carpeta no existe"}, status_code=404)

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
                    stream_cmd = [YTDLP_BIN, "--no-warnings", "-g", "-f", "bestvideo/best", url]
                    stream_res = subprocess.run(stream_cmd, capture_output=True, text=True, check=True)
                    stream_url = stream_res.stdout.strip().split("\n")[0]
                    ff_cmd = [FFMPEG_BIN, "-y", "-ss", str(timestamp), "-i", stream_url, "-vframes", "1", "-q:v", "2", out_path]
                    subprocess.run(ff_cmd, capture_output=True, check=True)
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

            jobs[job_id] = {
                "id": job_id,
                "url": url,
                "title": body.get("title", "Descargando..."),
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

        else:
            self._send_json({"error": "Ruta POST no válida"}, status_code=404)

    def _run_download_task(self, job_id, body):
        job = jobs[job_id]
        try:
            url = body.get("url")
            out_dir = job["output_dir"]
            fmt_type = body.get("type", "video") # "video" or "audio"
            ext = body.get("ext", "mp4").lower()
            trim_a = body.get("trim_a") or body.get("trim_start")
            trim_b = body.get("trim_b") or body.get("trim_end")
            trim_ranges = body.get("trim_ranges", [])
            split_chapters = body.get("split_chapters", False)
            selected_chapters = body.get("chapters", [])
            lufs_norm = body.get("lufs_norm", False)
            audio_meta = body.get("audio_meta", False)

            is_anim_export = ext in ("gif", "webp")
            target_ext = ext
            if is_anim_export:
                ext = "mp4"

            cmd = [YTDLP_BIN, "--no-warnings", "--newline", "--progress-template", "%(progress._percent_str)s"]
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
                    cmd.extend(["-f", "bestvideo+bestaudio/best", "--merge-output-format", ext])
                if audio_meta:
                    cmd.extend(["--embed-metadata"])

            out_template = os.path.join(out_dir, "%(title)s.temp_conv.%(ext)s" if is_anim_export else "%(title)s.%(ext)s")
            cmd.extend(["-o", out_template, url])

            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)

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
                    subprocess.run(ff_conv, capture_output=True)
                    try:
                        os.remove(temp_mp4)
                    except:
                        pass
                    job["filename"] = final_path

                job["progress"] = 100.0
                job["status"] = "complete"
            else:
                job["status"] = "error"
            with history_lock:
                _save_history()
        except Exception as e:
            job["status"] = "error"
            job["error"] = str(e)
            with history_lock:
                _save_history()

def main():
    print(f"=========================================================")
    print(f"  YT Media Downloader Companion Server v{VERSION}")
    print(f"  Running on: {platform.system()} ({platform.machine()})")
    print(f"  Listening at: http://{HOST}:{PORT}")
    print(f"=========================================================")
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
