import os
import sys
import json
import queue
import sounddevice as sd
import numpy as np
import tempfile
import wave
from pathlib import Path
import threading
import time
import subprocess

def get_app_data_path():
    if sys.platform == "win32":
        return Path(os.getenv("APPDATA")) / "Meridia" / "User" / "mira" / "models"
    else:
        return Path(os.getenv("HOME")) / ".config" / "Meridia" / "User" / "mira" / "models"

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

print(json.dumps({"status": "initializing_whisper"}), flush=True)

# Check whisper.cpp availability
try:
    whisper_path, model_path, whisper_dir = get_whisper_paths("tiny")
    if not os.path.exists(whisper_path):
        raise FileNotFoundError(f"whisper-cli not found at: {whisper_path}")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found at: {model_path}")
    print(json.dumps({"status": "loaded", "model": "whisper-cpp-tiny"}), flush=True)
except Exception as e:
    print(json.dumps({"error": f"Whisper setup failed: {str(e)}"}), flush=True)
    sys.exit(1)

# Audio configuration
samplerate = 16000
chunk_duration = 2  # Process every 2 seconds for better accuracy with accents
recording_buffer = []
is_recording = True

def audio_callback(indata, frames, time, status):
    if status:
        print(json.dumps({"error": str(status)}), flush=True)
    
    try:
        audio = np.frombuffer(indata, dtype=np.float32)
        recording_buffer.extend(audio)
    except Exception as e:
        print(json.dumps({"error": f"Audio processing error: {str(e)}"}), flush=True)

def transcribe_with_whisper(audio_file):
    """Transcribe audio file using whisper.cpp"""
    try:
        whisper_path, model_path, whisper_dir = get_whisper_paths("tiny")
        
        # Create temporary output file
        with tempfile.NamedTemporaryFile(mode='w', suffix='', delete=False) as temp_file:
            output_file = temp_file.name
        
        cmd = [
            whisper_path,
            '-m', model_path,
            '-f', audio_file,
            '--max-len', '0',
            '--output-json',
            '--output-file', output_file,         
        ]
        
        # Set up environment
        env = os.environ.copy()
        if sys.platform != "win32":
            env['LD_LIBRARY_PATH'] = whisper_dir + ':' + env.get('LD_LIBRARY_PATH', '')
        
        # Run whisper.cpp with timeout for real-time
        result = subprocess.run(
            cmd,
            cwd=whisper_dir,
            env=env,
            capture_output=True,
            text=True,
            timeout=8  # 8 second timeout for small model
        )
        
        if result.returncode != 0:
            return None
        
        # Read JSON output
        json_file = output_file + '.json'
        if not os.path.exists(json_file):
            return None
        
        with open(json_file, 'r', encoding='utf-8') as f:
            whisper_result = json.load(f)
        
        # Clean up temp files
        try:
            os.unlink(output_file)
            os.unlink(json_file)
        except:
            pass
        
        # Extract text from whisper result
        text_parts = []
        if 'transcription' in whisper_result:
            for segment in whisper_result['transcription']:
                if 'text' in segment and segment['text'].strip():
                    text_parts.append(segment['text'].strip())
        
        return ' '.join(text_parts).strip() if text_parts else None
        
    except Exception as e:
        print(json.dumps({"error": f"Whisper transcription error: {str(e)}"}), flush=True)
        return None

def process_audio_chunks():
    """Process audio chunks with whisper.cpp"""
    global recording_buffer, is_recording
    
    while is_recording:
        time.sleep(chunk_duration)
        
        if len(recording_buffer) == 0:
            continue
            
        # Get current chunk
        chunk = np.array(recording_buffer)
        recording_buffer = []  # Clear buffer
        
        # Skip if chunk is too short (minimum 1 second for good accent recognition)
        if len(chunk) < samplerate * 1.0:  
            continue
            
        try:
            # Create temporary audio file
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
                temp_file = f.name
            
            # Convert to 16-bit WAV
            audio_int16 = (chunk * 32767).astype(np.int16)
            
            with wave.open(temp_file, 'wb') as wav_file:
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2)
                wav_file.setframerate(samplerate)
                wav_file.writeframes(audio_int16.tobytes())
            
            # Transcribe with whisper.cpp
            start_time = time.time()
            text = transcribe_with_whisper(temp_file)
            process_time = (time.time() - start_time) * 1000
            
            # Clean up temp file
            os.unlink(temp_file)
            
            if text and len(text.strip()) > 0:
                # Same output format as original
                output = {
                    "text": text,
                    "result": [],  # Keep compatibility with original format
                    "processing_time_ms": round(process_time),
                    "confidence": "high"
                }
                print(json.dumps(output), flush=True)
            
        except Exception as e:
            print(json.dumps({"error": f"Transcription error: {str(e)}"}), flush=True)

def main():
    global is_recording
    
    print(json.dumps({"status": "started", "model": "whisper-cpp-small"}), flush=True)
    
    # No microphone calibration needed for whisper.cpp
    print(json.dumps({"status": "calibration_complete"}), flush=True)
    
    # Start audio processing thread
    processing_thread = threading.Thread(target=process_audio_chunks, daemon=True)
    processing_thread.start()
    
    try:
        with sd.RawInputStream(
            samplerate=samplerate, 
            blocksize=4000, 
            device=None, 
            dtype='float32',
            channels=1, 
            callback=audio_callback
        ):
            print(json.dumps({"status": "listening"}), flush=True)
            while True:
                time.sleep(0.1)  
                        
    except KeyboardInterrupt:
        is_recording = False
        print(json.dumps({"status": "stopped"}), flush=True)
    except Exception as e:
        is_recording = False
        print(json.dumps({"error": f"Runtime error: {str(e)}"}), flush=True)

if __name__ == "__main__":
    main()
