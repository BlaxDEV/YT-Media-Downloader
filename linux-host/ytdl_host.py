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
VERSION = "1.1.6"

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

# In-memory job tracking and history
jobs = {}
history = []
history_lock = threading.Lock()

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
                self._send_json({"history": history})

        elif path == "/info":
            url = query.get("url", [""])[0]
            if not url:
                self._send_json({"error": "URL requerida"}, status_code=400)
                return
            try:
                cmd = [YTDLP_BIN, "--dump-json", "--no-warnings", "--no-playlist", url]
                res = subprocess.run(cmd, capture_output=True, text=True, check=True)
                info = json.loads(res.stdout)
                self._send_json({
                    "title": info.get("title", "Video de YouTube"),
                    "duration": info.get("duration", 0),
                    "thumbnail": info.get("thumbnail", ""),
                    "uploader": info.get("uploader", "")
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
                if len(history) > 50:
                    history.pop()

            thread = threading.Thread(target=self._run_download_task, args=(job_id, body))
            thread.daemon = True
            thread.start()

            self._send_json({"id": job_id, "status": "processing"})

        else:
            self._send_json({"error": "Ruta POST no válida"}, status_code=404)

    def _run_download_task(self, job_id, body):
        job = jobs[job_id]
        try:
            url = body.get("url")
            out_dir = job["output_dir"]
            fmt_type = body.get("type", "video") # "video" or "audio"
            ext = body.get("ext", "mp4")
            trim_a = body.get("trim_a")
            trim_b = body.get("trim_b")

            cmd = [YTDLP_BIN, "--no-warnings", "--newline", "--progress-template", "%(progress._percent_str)s"]
            if FFMPEG_BIN != "ffmpeg":
                cmd.extend(["--ffmpeg-location", os.path.dirname(FFMPEG_BIN)])

            # Trimming arguments
            if trim_a is not None and trim_b is not None:
                cmd.extend(["--download-sections", f"*{trim_a}-{trim_b}"])

            if fmt_type == "audio":
                cmd.extend(["-x", "--audio-format", ext])
            else:
                # Video format combining
                cmd.extend(["-f", "bestvideo+bestaudio/best", "--merge-output-format", ext])

            cmd.extend(["-o", os.path.join(out_dir, "%(title)s.%(ext)s"), url])

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
                            job["progress"] = pct_val
                        except:
                            pass

            if process.returncode == 0:
                job["progress"] = 100.0
                job["status"] = "complete"
            else:
                job["status"] = "error"
        except Exception as e:
            job["status"] = "error"
            job["error"] = str(e)

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
