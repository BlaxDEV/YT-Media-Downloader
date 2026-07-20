import os
import zipfile

def create_posix_zip(source_dir, output_zip):
    print(f"Packing {source_dir} -> {output_zip} (POSIX forward-slash format)...")
    with zipfile.ZipFile(output_zip, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(source_dir):
            # Skip hidden folders like .git and the scripts folder containing backend scripts
            dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'scripts']
            for file in sorted(files):
                # Skip hidden files, zips, python scripts, powershell scripts, inno setup scripts, exe binaries, and icon.ico inside the zip
                if file.startswith('.') or file.endswith('.zip') or file.endswith('.py') or file.endswith('.ps1') or file.endswith('.iss') or file.endswith('.exe') or file == 'icon.ico':
                    continue
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, source_dir)
                # FORCE POSIX forward slashes regardless of Windows OS
                arc_name = rel_path.replace('\\', '/')
                
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
    # Check if we are running inside YT-Downloader-Extension or root directory
    if os.path.basename(base_dir) == 'YT-Downloader-Extension':
        ext_dir = base_dir
        out_dir = os.path.dirname(base_dir)
    else:
        ext_dir = os.path.join(base_dir, 'YT-Downloader-Extension')
        out_dir = base_dir
    
    zip_media_v = os.path.join(out_dir, 'YT-Media-Downloader-v1.1.6.zip')
    zip_media_gen = os.path.join(out_dir, 'YT-Media-Downloader.zip')
    
    create_posix_zip(ext_dir, zip_media_v)
    create_posix_zip(ext_dir, zip_media_gen)
