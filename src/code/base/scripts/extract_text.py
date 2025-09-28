import os
import sys
import json
import argparse
import whisper
import torch
import hashlib
from pathlib import Path
import pickle
import time
import numpy as np
from pydub import AudioSegment
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

_cached_model = None
_memory_cache = {}  
_cache_lock = threading.Lock()

def get_app_data_path():
    if sys.platform == "win32":
        return os.getenv("APPDATA")
    else:
        return os.path.join(os.getenv("HOME"), ".config")

def get_cache_file_path():
    """Get path to voice_to_text.pkl cache file (binary for speed)"""
    app_data = get_app_data_path()
    if not app_data:
        return None
    
    cache_dir = Path(app_data) / "Meridia" / "User" / "mira"
    cache_dir.mkdir(parents=True, exist_ok=True)
    
    return cache_dir / "voice_to_text.pkl"  

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

def get_cached_whisper_model():
    """Get cached Whisper model with GPU optimization"""
    global _cached_model
    
    if _cached_model is not None:
        return _cached_model
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    _cached_model = whisper.load_model("base", device=device)  
    print(f"Loaded Whisper model: base on {device}", file=sys.stderr)
    return _cached_model

def split_audio_into_chunks(audio_path, chunk_duration=30):
    """Split audio into chunks for parallel processing"""
    try:
        audio = AudioSegment.from_wav(audio_path)
        chunk_length_ms = chunk_duration * 1000
        
        chunks = []
        chunk_paths = []
        
        for i in range(0, len(audio), chunk_length_ms):
            chunk = audio[i:i + chunk_length_ms]
            
            # Create temporary file for chunk
            chunk_path = f"{audio_path}_chunk_{i//chunk_length_ms}.wav"
            chunk.export(chunk_path, format="wav")
            
            chunks.append({
                'path': chunk_path,
                'start_time': i / 1000.0,  # Convert to seconds
                'index': i // chunk_length_ms
            })
            chunk_paths.append(chunk_path)
        
        return chunks, chunk_paths
        
    except Exception as e:
        print(f"Error splitting audio: {e}", file=sys.stderr)
        return [{'path': audio_path, 'start_time': 0, 'index': 0}], []

def transcribe_chunk(chunk_info):
    """Transcribe a single audio chunk"""
    chunk_path = chunk_info['path']
    start_offset = chunk_info['start_time']
    chunk_index = chunk_info['index']
    
    print(f"Processing chunk {chunk_index}...", file=sys.stderr)
    
    # Check cache for this chunk
    chunk_hash = get_audio_hash_fast(chunk_path)
    if chunk_hash and chunk_hash in _memory_cache:
        print(f"Cache hit for chunk {chunk_index}!", file=sys.stderr)
        return _memory_cache[chunk_hash], chunk_index, start_offset
    
    model = get_cached_whisper_model()
    
    result = model.transcribe(
        chunk_path,
        word_timestamps=True,
        language="en",
        fp16=torch.cuda.is_available(),
        condition_on_previous_text=False,
        compression_ratio_threshold=2.4,
        logprob_threshold=-1.0,
        no_speech_threshold=0.6,
        temperature=0.0
    )
    
    words_with_timestamps = []
    if "segments" in result:
        for segment in result["segments"]:
            if "words" in segment:
                for word_info in segment["words"]:
                    words_with_timestamps.append({
                        "word": word_info["word"].strip(),
                        "start": round(float(word_info["start"]) + start_offset, 3),
                        "end": round(float(word_info["end"]) + start_offset, 3),
                        "conf": round(float(word_info.get("probability", 0.95)), 3)
                    })
    
    # Cache the result
    if chunk_hash:
        with _cache_lock:
            _memory_cache[chunk_hash] = words_with_timestamps
    
    print(f"Completed chunk {chunk_index}", file=sys.stderr)
    return words_with_timestamps, chunk_index, start_offset

def transcribe_audio_in_parts(audio_path, max_workers=3, chunk_duration=30):
    """Transcribe audio by splitting into parts and processing in parallel"""
    start_time = time.time()
    
    # Check if entire file is cached
    audio_hash = get_audio_hash_fast(audio_path)
    if audio_hash and audio_hash in _memory_cache:
        print(f"Full file cache hit! ({(time.time() - start_time)*1000:.1f}ms)", file=sys.stderr)
        return _memory_cache[audio_hash]
    
    print("Splitting audio into chunks for parallel processing...", file=sys.stderr)
    chunks, temp_chunk_paths = split_audio_into_chunks(audio_path, chunk_duration)
    
    all_words = []
    
    try:
        # Process chunks in parallel
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all chunks for processing
            future_to_chunk = {
                executor.submit(transcribe_chunk, chunk): chunk 
                for chunk in chunks
            }
            
            # Collect results as they complete
            chunk_results = []
            for future in as_completed(future_to_chunk):
                try:
                    words, chunk_index, start_offset = future.result()
                    chunk_results.append((chunk_index, words))
                    print(f"✓ Chunk {chunk_index} processed ({len(words)} words)", file=sys.stderr)
                except Exception as e:
                    print(f"Error processing chunk: {e}", file=sys.stderr)
        
        # Sort results by chunk index and combine
        chunk_results.sort(key=lambda x: x[0])
        for chunk_index, words in chunk_results:
            all_words.extend(words)
    
    finally:
        # Clean up temporary chunk files
        for chunk_path in temp_chunk_paths:
            try:
                if os.path.exists(chunk_path):
                    os.remove(chunk_path)
            except Exception as e:
                print(f"Warning: Could not remove temp file {chunk_path}: {e}", file=sys.stderr)
    
    # Cache the complete result
    if audio_hash:
        with _cache_lock:
            _memory_cache[audio_hash] = all_words
    
    total_time = (time.time() - start_time) * 1000
    print(f"Parallel transcription completed in {total_time:.1f}ms ({len(chunks)} chunks)", file=sys.stderr)
    
    return all_words

def main():
    parser = argparse.ArgumentParser(description="Ultra-fast WAV transcription with parallel processing")
    parser.add_argument("audio_path", help="Path to the WAV audio file")
    parser.add_argument("--clear-cache", action="store_true", help="Clear cache")
    parser.add_argument("--preload", action="store_true", help="Preload model only")
    parser.add_argument("--workers", type=int, default=3, help="Number of parallel workers (default: 3)")
    parser.add_argument("--chunk-size", type=int, default=30, help="Chunk duration in seconds (default: 30)")
    parser.add_argument("--no-parallel", action="store_true", help="Disable parallel processing")
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
        get_cached_whisper_model()
        save_cache_fast()
        print("Model preloaded", file=sys.stderr)
        return
    
    if not os.path.exists(args.audio_path):
        print(f"Error: Audio file not found: {args.audio_path}", file=sys.stderr)
        sys.exit(1)
    
    try:
        if args.no_parallel:
            # Use original single-threaded method
            print("Using single-threaded processing...", file=sys.stderr)
            model = get_cached_whisper_model()
            result = model.transcribe(args.audio_path, word_timestamps=True)
            words_with_timestamps = []
            if "segments" in result:
                for segment in result["segments"]:
                    if "words" in segment:
                        for word_info in segment["words"]:
                            words_with_timestamps.append({
                                "word": word_info["word"].strip(),
                                "start": round(float(word_info["start"]), 3),
                                "end": round(float(word_info["end"]), 3),
                                "conf": round(float(word_info.get("probability", 0.95)), 3)
                            })
        else:
            # Use parallel processing
            words_with_timestamps = transcribe_audio_in_parts(
                args.audio_path, 
                max_workers=args.workers,
                chunk_duration=args.chunk_size
            )
        
        # Save cache periodically
        if len(_memory_cache) % 10 == 0:
            save_cache_fast()
        
        # Output results
        print(json.dumps(words_with_timestamps, separators=(',', ':')))
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)
    finally:
        save_cache_fast()

if __name__ == "__main__":
    main()
