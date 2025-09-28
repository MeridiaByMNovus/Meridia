import os
import sys
import requests
import zipfile
import shutil
from pathlib import Path
from tqdm import tqdm
import json
import time


def get_config_dir():
    """Get the appropriate config directory based on the platform"""
    if sys.platform == "win32":
        return os.getenv("APPDATA")
    else:
        return os.path.join(os.getenv("HOME"), ".config")


def print_progress(message, **kwargs):
    """Print progress message in JSON format"""
    progress_data = {"status": message, "timestamp": time.time(), **kwargs}
    print(json.dumps(progress_data), flush=True)


def download_file_with_progress(url, filename):
    """Download a file with progress bar and JSON progress updates"""
    print_progress("download_start", filename=os.path.basename(filename), url=url)
    
    response = requests.get(url, stream=True)
    response.raise_for_status()
    
    total_size = int(response.headers.get('content-length', 0))
    block_size = 8192
    downloaded = 0
    
    print_progress("download_progress", 
                  filename=os.path.basename(filename),
                  total_size=total_size, 
                  downloaded=0, 
                  percentage=0)
    
    with open(filename, 'wb') as file:
        for chunk in response.iter_content(chunk_size=block_size):
            if chunk:
                file.write(chunk)
                downloaded += len(chunk)
                
                # Update progress every MB or so
                if downloaded % (1024 * 1024) == 0 or downloaded == total_size:
                    percentage = (downloaded / total_size * 100) if total_size > 0 else 0
                    print_progress("download_progress",
                                  filename=os.path.basename(filename),
                                  total_size=total_size,
                                  downloaded=downloaded,
                                  percentage=round(percentage, 1))
    
    print_progress("download_complete", filename=os.path.basename(filename), total_size=downloaded)


def extract_zip_with_progress(zip_path, extract_to):
    """Extract zip file with progress and JSON updates"""
    print_progress("extract_start", zip_file=os.path.basename(zip_path), extract_to=str(extract_to))
    
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        file_list = zip_ref.namelist()
        total_files = len(file_list)
        
        print_progress("extract_progress", 
                      total_files=total_files, 
                      extracted=0, 
                      percentage=0)
        
        for i, file in enumerate(file_list, 1):
            zip_ref.extract(file, extract_to)
            
            # Update progress every 10 files or on last file
            if i % 10 == 0 or i == total_files:
                percentage = (i / total_files * 100)
                print_progress("extract_progress",
                              total_files=total_files,
                              extracted=i,
                              percentage=round(percentage, 1),
                              current_file=os.path.basename(file))
    
    print_progress("extract_complete", total_files=total_files)


def download_vosk_model(model_name="vosk-model-en-us-0.42-gigaspeech"):
    """Download and extract Vosk model to config directory"""
    
    model_urls = {
        "vosk-model-en-us-librispeech-0.2": "https://alphacephei.com/vosk/models/vosk-model-en-us-librispeech-0.2.zip",
        "vosk-model-en-us-0.42-gigaspeech": "https://alphacephei.com/vosk/models/vosk-model-en-us-0.42-gigaspeech.zip",
        "vosk-model-en-us-0.22": "https://alphacephei.com/vosk/models/vosk-model-en-us-0.22.zip",
        "vosk-model-en-us-0.22-lgraph": "https://alphacephei.com/vosk/models/vosk-model-en-us-0.22-lgraph.zip",
        "vosk-model-small-en-us-0.15": "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"
    }
    
    if model_name not in model_urls:
        print_progress("error", message=f"Model '{model_name}' not found", available_models=list(model_urls.keys()))
        return False
    
    config_dir = get_config_dir()
    if not config_dir:
        print_progress("error", message="Could not determine config directory")
        return False
    
    models_dir = Path(config_dir) / "Meridia" / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    
    model_path = models_dir / model_name
    
    # Check if model already exists
    if model_path.exists():
        print_progress("model_exists", model=model_name, path=str(model_path))
        return True
    
    print_progress("download_init", model=model_name, destination=str(models_dir))
    
    url = model_urls[model_name]
    zip_filename = models_dir / f"{model_name}.zip"
    
    try:
        # Download
        download_file_with_progress(url, str(zip_filename))
        
        # Extract
        extract_zip_with_progress(str(zip_filename), str(models_dir))
        
        # Clean up
        print_progress("cleanup_start", zip_file=str(zip_filename))
        zip_filename.unlink()
        print_progress("cleanup_complete", zip_file=str(zip_filename))
        
        # Verify extraction
        if model_path.exists():
            # Create config info
            config_info = {
                "model_name": model_name,
                "model_path": str(model_path),
                "download_date": time.strftime("%Y-%m-%d %H:%M:%S"),
                "url": url,
                "size_mb": sum(f.stat().st_size for f in model_path.rglob('*') if f.is_file()) / (1024 * 1024)
            }
            
            config_file = models_dir / f"{model_name}.json"
            with open(config_file, 'w') as f:
                json.dump(config_info, f, indent=2)
            
            print_progress("model_ready", 
                          model=model_name, 
                          path=str(model_path),
                          size_mb=round(config_info["size_mb"], 1))
            return True
        else:
            print_progress("error", message=f"Model extraction failed - directory not found: {model_path}")
            return False
            
    except requests.RequestException as e:
        print_progress("error", message=f"Download failed: {str(e)}", error_type="network")
        return False
    except zipfile.BadZipFile as e:
        print_progress("error", message=f"Invalid zip file: {str(e)}", error_type="zip")
        return False
    except Exception as e:
        print_progress("error", message=f"Unexpected error: {str(e)}", error_type="general")
        return False


def list_available_models():
    """List all available models that can be downloaded"""
    models = {
        "vosk-model-en-us-0.42-gigaspeech": {
            "size": "2.3 GB", 
            "accuracy": "WER: 5.64%", 
            "description": "Most accurate, large model"
        },
        "vosk-model-en-us-0.22": {
            "size": "1.8 GB", 
            "accuracy": "WER: 5.69%", 
            "description": "Good accuracy, medium size"
        },
        "vosk-model-en-us-0.22-lgraph": {
            "size": "128 MB", 
            "accuracy": "WER: 7.82%", 
            "description": "Small size, lower accuracy"
        },
        "vosk-model-small-en-us-0.15": {
            "size": "40 MB", 
            "accuracy": "WER: ~10%", 
            "description": "Very small, basic accuracy"
        }
    }
    
    print_progress("available_models", models=models)


def get_model_path(model_name="vosk-model-en-us-0.42-gigaspeech"):
    """Get the path to a specific model"""
    config_dir = get_config_dir()
    if not config_dir:
        return None
    
    model_path = Path(config_dir) / "Meridia" / "models" / model_name
    if model_path.exists():
        # Get model info if available
        config_file = model_path.parent / f"{model_name}.json"
        model_info = {"path": str(model_path), "exists": True}
        
        if config_file.exists():
            try:
                with open(config_file, 'r') as f:
                    model_info.update(json.load(f))
            except:
                pass
        
        print_progress("model_found", model=model_name, **model_info)
        return str(model_path)
    else:
        print_progress("model_not_found", model=model_name)
        return None


def main():
    """Main function to handle command line arguments"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Download Vosk speech recognition models")
    parser.add_argument('--model', '-m', 
                       default='vosk-model-en-us-0.42-gigaspeech',
                       help='Model to download (default: vosk-model-en-us-0.42-gigaspeech)')
    parser.add_argument('--list', '-l', 
                       action='store_true',
                       help='List available models')
    parser.add_argument('--path', '-p',
                       help='Get path to specific model')
    
    args = parser.parse_args()
    
    print_progress("script_start", command="download_vosk_model")
    
    if args.list:
        list_available_models()
        return
    
    if args.path:
        path = get_model_path(args.path)
        return
    
    # Download model
    success = download_vosk_model(args.model)
    if success:
        print_progress("script_complete", model=args.model, success=True)
    else:
        print_progress("script_complete", model=args.model, success=False)
        sys.exit(1)


if __name__ == "__main__":
    main()
