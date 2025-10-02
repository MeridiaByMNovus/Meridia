import sys
import black
import traceback

def format_file(filepath: str):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            source = f.read()
        
        try:
            formatted_source = black.format_str(source, mode=black.FileMode())
        except black.InvalidInput:
            print(f"Warning: Could not format {filepath} due to parse errors. Saving original content.")
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(source)
            return

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(formatted_source)
        
        print(f"Formatted {filepath} successfully.")

    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python formatter.py <file_path>")
        sys.exit(1)

    file_path = sys.argv[1]
    format_file(file_path)
