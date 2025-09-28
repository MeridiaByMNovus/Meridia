import os
import sys
import json
import subprocess
import wave
from pathlib import Path
from piper import PiperVoice

def get_app_data_path():
    if sys.platform == "win32":
        return os.getenv("APPDATA")
    else:
        return os.path.join(os.getenv("HOME"), ".config")

def download_voice_if_missing(voice_dir, voice_name):
    voice_file = voice_dir / f"{voice_name}.onnx"
    if not voice_file.exists():
        subprocess.run([
            "python",
            "-m",
            "piper.download_voices",
            voice_name,
            "--download-dir",
            str(voice_dir)
        ], check=True)
        voice_dir.mkdir(parents=True, exist_ok=True)
    else:
        ...


def synthesize_to_wav(message, wav_path, voice_path):
    voice = PiperVoice.load(str(voice_path))
    with wave.open(str(wav_path), "wb") as wav_file:
        voice.synthesize_wav(message, wav_file)
    return wav_path

def main():
    if len(sys.argv) < 3:
        sys.exit(1)

    message = sys.argv[1]
    filename = sys.argv[2]

    app_data_path = get_app_data_path()
    public_folder_path = Path(app_data_path) / "Meridia" / "User"
    mira_folder = public_folder_path / "mira"
    mira_folder.mkdir(parents=True, exist_ok=True)

    voice_name = "en_US-kristin-medium"
    # voice_name = "hi_IN-priyamvada-medium"
    voice_file_path = mira_folder / f"{voice_name}.onnx"

    try:
        download_voice_if_missing(mira_folder, voice_name)
        wav_path = synthesize_to_wav(message, mira_folder / filename, voice_file_path)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

    print(json.dumps({"filepath": str(wav_path)}))


if __name__ == "__main__":
    main()
