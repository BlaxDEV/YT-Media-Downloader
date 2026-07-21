import os
import zipfile
import json

def create_posix_zip(source_dir, output_zip, target_browser='chrome'):
    print(f"Packing {source_dir} -> {output_zip} ({target_browser.upper()} format)...")
    with zipfile.ZipFile(output_zip, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(source_dir):
            # Skip hidden folders like .git, and backend/build directories that do not belong inside the extension ZIP
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('scripts', 'linux-host', 'native-host', 'tools', 'build', 'dist')]
            for file in sorted(files):
                # Skip hidden files, zips, python/powershell/bash scripts, inno setup scripts, binaries, systemd units, and icon.ico inside the zip
                if file.startswith('.') or file.endswith(('.zip', '.py', '.ps1', '.iss', '.exe', '.sh', '.service')) or file == 'icon.ico':
                    continue
                
                # Browser-specific manifest filtering
                if target_browser == 'chrome' and file == 'manifest.firefox.json':
                    continue
                if target_browser == 'firefox' and file == 'manifest.json':
                    continue
                
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, source_dir)
                # FORCE POSIX forward slashes regardless of Windows OS
                arc_name = rel_path.replace('\\', '/')
                
                # For Firefox build, rename manifest.firefox.json to manifest.json inside the zip
                if target_browser == 'firefox' and arc_name == 'manifest.firefox.json':
                    arc_name = 'manifest.json'
                
                # Create ZipInfo with UNIX system flag (3) so validators on Linux/Mozilla AMO never see backslashes
                zinfo = zipfile.ZipInfo.from_file(file_path, arc_name)
                zinfo.create_system = 3  # UNIX / POSIX
                # Set standard file permissions (0644 for regular files)
                zinfo.external_attr = (0o644 & 0xFFFF) << 16
                zinfo.compress_type = zipfile.ZIP_DEFLATED
                
                with open(file_path, 'rb') as f:
                    zf.writestr(zinfo, f.read())
    print(f"Successfully created: {output_zip} ({os.path.getsize(output_zip)} bytes)")

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.abspath(__file__))
    # If located inside 'scripts', go up one level first
    if os.path.basename(base_dir) == 'scripts':
        base_dir = os.path.dirname(base_dir)
        
    # Check if we are running inside YT-Downloader-Extension or root directory
    if os.path.basename(base_dir) == 'YT-Downloader-Extension':
        ext_dir = base_dir
        out_dir = os.path.dirname(base_dir)
    else:
        ext_dir = os.path.join(base_dir, 'YT-Downloader-Extension')
        out_dir = base_dir
    
    # Dynamically read version from manifest.json inside ext_dir
    manifest_path = os.path.join(ext_dir, 'manifest.json')
    version = "1.1.7"
    if os.path.exists(manifest_path):
        with open(manifest_path, 'r', encoding='utf-8') as mf:
            data = json.load(mf)
            if 'version' in data:
                version = data['version']
    
    # Enforce exact naming rule for dedicated browser extension packages
    zip_chrome = os.path.join(out_dir, f'YT-Media-Downloader-Extension-Chrome-v{version}.zip')
    zip_firefox = os.path.join(out_dir, f'YT-Media-Downloader-Extension-Firefox-v{version}.zip')
    
    create_posix_zip(ext_dir, zip_chrome, target_browser='chrome')
    if os.path.exists(os.path.join(ext_dir, 'manifest.firefox.json')):
        create_posix_zip(ext_dir, zip_firefox, target_browser='firefox')
