import os
import sys
import json
import argparse
import hashlib
from pathlib import Path
import pickle
import time
import threading
import subprocess
import tempfile

_memory_cache = {}  
_cache_lock = threading.Lock()

def get_app_data_path():
    if sys.platform == "win32":
        return Path(os.getenv("APPDATA")) / "Meridia" / "User" / "mira" / "models"
    else:
        return Path(os.getenv("HOME")) / ".config" / "Meridia" / "User" / "mira" / "models"

def get_cache_file_path():
    """Get path to voice_to_text.pkl cache file (binary for speed)"""
    app_data = get_app_data_path()
    if not app_data:
        return None
    
    cache_dir = app_data  # Use the same directory as model
    cache_dir.mkdir(parents=True, exist_ok=True)
    
    return (".." / cache_dir / "voice_to_text.pkl").resolve()

def get_audio_hash_fast(audio_path):
    """Ultra-fast hash using file stats + sample bytes"""
    try:
        stat = os.stat(audio_path)
        hash_data = f"{stat.st_size}_{stat.st_mtime}".encode()
        
        with open(audio_path, "rb") as f:
            sample = f.read(1024)
        
        hash_md5 = hashlib.md5()
        hash_md5.update(hash_data)
        hash_md5.update(sample)
        return hash_md5.hexdigest()
    except Exception as e:
        return None

def load_cache_fast():
    """Load entire cache into memory at startup"""
    global _memory_cache
    
    with _cache_lock:
        cache_file = get_cache_file_path()
        if not cache_file or not cache_file.exists():
            _memory_cache = {}
            return
        
        try:
            with open(cache_file, 'rb') as f:
                _memory_cache = pickle.load(f)
            print(f"Loaded {len(_memory_cache)} cached transcriptions", file=sys.stderr)
        except Exception as e:
            print(f"Error loading cache: {e}", file=sys.stderr)
            _memory_cache = {}

def save_cache_fast():
    """Save entire cache from memory to disk"""
    with _cache_lock:
        cache_file = get_cache_file_path()
        if not cache_file:
            return
        
        try:
            with open(cache_file, 'wb') as f:
                pickle.dump(_memory_cache, f)
            print(f"Saved {len(_memory_cache)} transcriptions to cache", file=sys.stderr)
        except Exception as e:
            print(f"Error saving cache: {e}", file=sys.stderr)

def get_whisper_paths(model_size="tiny"):
    """Get platform-specific whisper.cpp paths with downloaded model"""
    script_dir = Path(__file__).parent.resolve()
    app_data = get_app_data_path()
    
    # Platform-specific whisper binary paths
    if sys.platform == "win32":
        platform_dir = "win32"
        executable = "whisper-cli.exe"
    else:
        platform_dir = "linux"
        executable = "whisper-cli"
    
    # Use whisper-cli from your project
    whisper_dir = (script_dir / ".." / "native" / "cpp" / "whisper.cpp" / platform_dir).resolve()
    whisper_path = whisper_dir / executable
    

    model_filename = "ggml-tiny.bin"
    model_path = app_data / model_filename
    
    # Fallback to project directory if not in app data
    if not model_path.exists():
        fallback_model_dir = (script_dir / ".." / "native" / "cpp" / "whisper.cpp").resolve()
        model_path = fallback_model_dir / model_filename
    
    return str(whisper_path), str(model_path), str(whisper_dir)

def transcribe_audio_fast(audio_path, model_size="tiny"):
    """Ultra-fast transcription using whisper.cpp with downloaded model"""
    start_time = time.time()
    
    # Check cache first
    audio_hash = get_audio_hash_fast(audio_path)
    if audio_hash and audio_hash in _memory_cache:
        cache_time = (time.time() - start_time) * 1000
        print(f"Cache hit! ({cache_time:.1f}ms)", file=sys.stderr)
        return _memory_cache[audio_hash]
    
    whisper_path, model_path, whisper_dir = get_whisper_paths(model_size)
    
    # Check if whisper.cpp exists
    if not os.path.exists(whisper_path):
        raise FileNotFoundError(f"whisper.cpp not found at: {whisper_path}")
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found at: {model_path}")
    
    try:
        # Create temporary output file
        with tempfile.NamedTemporaryFile(mode='w', suffix='', delete=False) as temp_file:
            output_file = temp_file.name
        
        # whisper.cpp command arguments optimized for accents with small model
        cmd = [
            whisper_path,
            '-m', model_path,
            '-f', audio_path,
            '--max-len', '1',              # Word-level timestamps
            '--output-json',               # JSON output
            '--output-file', output_file,  # Output file
        ]
        
        # Set up environment for Linux (library path)
        env = os.environ.copy()
        if sys.platform != "win32":
            env['LD_LIBRARY_PATH'] = whisper_dir + ':' + env.get('LD_LIBRARY_PATH', '')
        
        print(f"Running whisper.cpp transcription with {model_size} model...", file=sys.stderr)
        
        # Run whisper.cpp with longer timeout for small model
        result = subprocess.run(
            cmd,
            cwd=whisper_dir,
            env=env,
            capture_output=True,
            text=True,
            timeout=60  # 60 second timeout for small model
        )
        
        if result.returncode != 0:
            raise RuntimeError(f"whisper.cpp failed: {result.stderr}")
        
        # Read JSON output
        json_file = output_file + '.json'
        if not os.path.exists(json_file):
            raise FileNotFoundError("JSON output file not created")
        
        with open(json_file, 'r', encoding='utf-8') as f:
            whisper_result = json.load(f)
        
        # Convert to expected format
        words_with_timestamps = convert_whisper_result(whisper_result)
        
        # Clean up temp files
        try:
            os.unlink(output_file)
            os.unlink(json_file)
        except:
            pass
        
        # Cache the result
        if audio_hash:
            with _cache_lock:
                _memory_cache[audio_hash] = words_with_timestamps
        
        total_time = (time.time() - start_time) * 1000
        print(f"Transcription completed in {total_time:.1f}ms ({len(words_with_timestamps)} words)", file=sys.stderr)
        
        return words_with_timestamps
        
    except Exception as e:
        print(f"Transcription error: {e}", file=sys.stderr)
        raise

def convert_whisper_result(whisper_result):
    """Convert whisper.cpp JSON to expected format"""
    words_with_timestamps = []
    
    if 'transcription' in whisper_result and isinstance(whisper_result['transcription'], list):
        for segment in whisper_result['transcription']:
            if 'text' in segment and segment['text'].strip():
                word = segment['text'].strip()
                start_time = segment['offsets']['from'] / 1000  # Convert ms to seconds
                end_time = segment['offsets']['to'] / 1000
                
                words_with_timestamps.append({
                    "word": word,
                    "start": round(start_time, 3),
                    "end": round(end_time, 3),
                    "conf": 0.95  # whisper.cpp doesn't provide confidence scores
                })
    
    return words_with_timestamps

def main():
    parser = argparse.ArgumentParser(description="Ultra-fast CPU WAV transcription using whisper.cpp")
    parser.add_argument("audio_path", help="Path to the WAV audio file")
    parser.add_argument("--clear-cache", action="store_true", help="Clear cache")
    parser.add_argument("--preload", action="store_true", help="Preload model only")
    parser.add_argument("--model-size", default="small", 
                       choices=["tiny", "tiny.en", "base", "base.en", "small", "small.en", "medium", "medium.en"], 
                       help="Model size - small is best for accents (default: small)")
    args = parser.parse_args()
    
    # Load cache
    load_cache_fast()
    
    if args.clear_cache:
        _memory_cache.clear()
        cache_file = get_cache_file_path()
        if cache_file and cache_file.exists():
            cache_file.unlink()
        print("Cache cleared", file=sys.stderr)
        return
    
    if args.preload:
        # For whisper.cpp, preloading just means checking paths
        try:
            whisper_path, model_path, whisper_dir = get_whisper_paths(args.model_size)
            if os.path.exists(whisper_path) and os.path.exists(model_path):
                print(f"whisper.cpp and {args.model_size} model verified", file=sys.stderr)
            else:
                print(f"whisper.cpp or {args.model_size} model not found", file=sys.stderr)
                print(f"Expected model at: {model_path}", file=sys.stderr)
        except Exception as e:
            print(f"Preload error: {e}", file=sys.stderr)
        save_cache_fast()
        return
    
    if not os.path.exists(args.audio_path):
        print(f"Error: Audio file not found: {args.audio_path}", file=sys.stderr)
        sys.exit(1)
    
    try:
        words_with_timestamps = transcribe_audio_fast(
            args.audio_path,
            model_size=args.model_size
        )
        
        # Save cache every 5 transcriptions
        if len(_memory_cache) % 5 == 0:
            save_cache_fast()
        
        # Output results in same format as before
        print(json.dumps(words_with_timestamps, separators=(',', ':')))
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)
    finally:
        save_cache_fast()

if __name__ == "__main__":
    main()
