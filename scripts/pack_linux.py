import os
import tarfile

VERSION = "1.3.0"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LINUX_HOST_DIR = os.path.join(BASE_DIR, "linux-host")
OUTPUT_DIR = os.path.join(BASE_DIR, "Output")
PACKAGE_NAME = f"Setup_YT_Downloader-Linux-v{VERSION}"
TAR_PATH = os.path.join(OUTPUT_DIR, f"{PACKAGE_NAME}.tar.gz")

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Creating Linux release archive: {TAR_PATH}")

    with tarfile.open(TAR_PATH, "w:gz") as tar:
        host_py = os.path.join(LINUX_HOST_DIR, "ytdl_host.py")
        tar.add(host_py, arcname=f"{PACKAGE_NAME}/ytdl_host.py")
        
        install_sh = os.path.join(LINUX_HOST_DIR, "install_linux.sh")
        tar.add(install_sh, arcname=f"{PACKAGE_NAME}/install.sh")
        
        service_file = os.path.join(LINUX_HOST_DIR, "yt-downloader.service")
        tar.add(service_file, arcname=f"{PACKAGE_NAME}/systemd/yt-downloader.service")
        
        build_sh = os.path.join(LINUX_HOST_DIR, "build_linux.sh")
        tar.add(build_sh, arcname=f"{PACKAGE_NAME}/build_linux.sh")

    print(f"Successfully created: {TAR_PATH} ({os.path.getsize(TAR_PATH)} bytes)")

if __name__ == "__main__":
    main()
