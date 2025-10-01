import os
import sys
import requests
import hashlib
from pathlib import Path
from tqdm import tqdm

def get_app_data_path():
    if sys.platform == "win32":
        return Path(os.getenv("APPDATA")) / "Meridia" / "User" / "mira" / "models"
    else:
        return Path(os.getenv("HOME")) / ".config" / "Meridia" / "User" / "mira" / "models"

def download_with_progress(url, filepath):
    """Download file with progress bar"""
    print(f"Downloading to: {filepath}")
    
    # Make request with stream=True for large files
    response = requests.get(url, stream=True)
    response.raise_for_status()
    
    # Get total file size
    total_size = int(response.headers.get('content-length', 0))
    
    # Create progress bar
    progress_bar = tqdm(total=total_size, unit='B', unit_scale=True, desc="Downloading")
    
    # Download in chunks
    with open(filepath, 'wb') as file:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                file.write(chunk)
                progress_bar.update(len(chunk))
    
    progress_bar.close()
    print(f"Download complete: {filepath}")

def verify_model_hash(filepath, expected_hash=None):
    """Verify file integrity (optional)"""
    if not expected_hash:
        return True
    
    print("Verifying file integrity...")
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            sha256_hash.update(chunk)
    
    if sha256_hash.hexdigest() == expected_hash:
        print("File integrity verified")
        return True
    else:
        print("File integrity check failed")
        return False

def download_whisper_model():
    """Download whisper small multilingual model"""
    
    # Model configuration
    model_name = "ggml-tiny.bin"
    model_url = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin"
    expected_size_mb = 77 
    
    # Get download directory
    download_dir = get_app_data_path()
    download_dir.mkdir(parents=True, exist_ok=True)
    
    model_path = download_dir / model_name
    
    print(f"Whisper Model Downloader")
    print(f"Download directory: {download_dir}")
    print(f"Model: {model_name} (~{expected_size_mb}MB)")
    print(f"URL: {model_url}")
    
    if model_path.exists():
        return str(model_path)
    
    try:
        # Download the model
        print(f"Starting download...")
        download_with_progress(model_url, model_path)
        
        # Verify file size
        downloaded_size_mb = model_path.stat().st_size / (1024 * 1024)
        print(f"Downloaded size: {downloaded_size_mb:.1f}MB")
        
        if downloaded_size_mb < (expected_size_mb * 0.9):
            print(" Warning: Downloaded file seems too small")
        else:
            print("Download successful!")
        
        return str(model_path)
        
    except requests.exceptions.RequestException as e:
        print(f"Network error: {e}")
        return None
    except Exception as e:
        print(f"Download failed: {e}")
        return None

def main():
    print("Whisper Model Downloader for Meridia")
    print("=" * 50)
    
    # Check if requests and tqdm are available
    try:
        import requests
        import tqdm
    except ImportError as e:
        print(f"Missing dependency: {e}")
        print("Install with: pip install requests tqdm")
        return

    model_path = download_whisper_model()
    
    if model_path:
        print(f"\nModel ready at: {model_path}")
        print(f"\nUpdate your Python script to use:")
        print(f'model_path = "{model_path}"')
    else:
        print("\nDownload failed")

if __name__ == "__main__":
    main()
