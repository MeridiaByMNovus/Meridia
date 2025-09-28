import os
import sys
import json
import queue
import sounddevice as sd
import numpy as np
import speech_recognition as sr
import tempfile
import wave
from pathlib import Path
import threading
import time

# Initialize Speech Recognition
print(json.dumps({"status": "initializing_speech_recognition"}), flush=True)
r = sr.Recognizer()
mic = sr.Microphone()

# Optimize for fast response
r.energy_threshold = 300
r.dynamic_energy_threshold = True
r.pause_threshold = 0.8  # Quick response
r.phrase_threshold = 0.3
r.non_speaking_duration = 0.5

print(json.dumps({"status": "loaded", "model": "google-speech-recognition"}), flush=True)

# Audio configuration
samplerate = 16000
chunk_duration = 1  # Process audio every 1 second (faster than Whisper's 3)
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

def process_audio_chunks():
    """Process audio chunks with SpeechRecognition"""
    global recording_buffer, is_recording
    
    while is_recording:
        time.sleep(chunk_duration)
        
        if len(recording_buffer) == 0:
            continue
            
        # Get current audio chunk
        chunk = np.array(recording_buffer)
        recording_buffer = []  # Clear buffer
        
        if len(chunk) < samplerate * 0.5:  # Skip very short chunks (less than 0.5 seconds)
            continue
            
        try:
            # Save chunk to temporary WAV file
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
                temp_file = f.name
            
            # Convert to 16-bit and save
            audio_int16 = (chunk * 32767).astype(np.int16)
            
            with wave.open(temp_file, 'wb') as wav_file:
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2)
                wav_file.setframerate(samplerate)
                wav_file.writeframes(audio_int16.tobytes())
            
            # Transcribe with SpeechRecognition (MUCH FASTER)
            start_time = time.time()
            
            with sr.AudioFile(temp_file) as audio_file:
                audio_data = r.record(audio_file)
                text = r.recognize_google(audio_data).strip()
            
            process_time = (time.time() - start_time) * 1000  # Convert to ms
            
            if text:
                # Create compatible output with timing info
                output = {
                    "text": text,
                    "result": [],  # SpeechRecognition doesn't provide word-level timestamps
                    "processing_time_ms": round(process_time),
                    "confidence": "high"  # Google API generally has high confidence
                }
                print(json.dumps(output), flush=True)
            
            # Clean up temp file
            os.unlink(temp_file)
            
        except sr.UnknownValueError:
            # No clear speech detected - don't output anything
            pass
        except sr.RequestError as e:
            print(json.dumps({"error": f"Network error: {str(e)}"}), flush=True)
        except Exception as e:
            print(json.dumps({"error": f"Transcription error: {str(e)}"}), flush=True)

def main():
    global is_recording
    
    print(json.dumps({"status": "started", "model": "google-speech-recognition"}), flush=True)
    
    # Adjust for ambient noise once at startup
    try:
        with mic as source:
            print(json.dumps({"status": "calibrating_microphone"}), flush=True)
            r.adjust_for_ambient_noise(source, duration=1)
            print(json.dumps({"status": "calibration_complete"}), flush=True)
    except Exception as e:
        print(json.dumps({"error": f"Microphone calibration failed: {str(e)}"}), flush=True)
    
    # Start processing thread
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
                time.sleep(0.1)  # Keep main thread alive
                        
    except KeyboardInterrupt:
        is_recording = False
        print(json.dumps({"status": "stopped"}), flush=True)
    except Exception as e:
        is_recording = False
        print(json.dumps({"error": f"Runtime error: {str(e)}"}), flush=True)

if __name__ == "__main__":
    main()
