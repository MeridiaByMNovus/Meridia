import subprocess
import json
import re

def get_registered_pythons():
    try:
        output = subprocess.check_output(["py", "-0p"], text=True)
        lines = output.strip().splitlines()
        result = []
        for line in lines:
            match = re.match(r"\\s*(-[\\w.:]+)\\s+\\*?\\s*(.*)", line)
            if not match:
                continue
            ver_tag, path = match.groups()
            path = path.strip()
            try:
                version_output = subprocess.check_output([path, "--version"], stderr=subprocess.STDOUT, text=True).strip()
            except Exception as ve:
                version_output = f"Error: {ve}"
            result.append({
                "version_tag": ver_tag,
                "cmd": path,
                "version": version_output
            })
        return result
    except Exception as e:
        return [{"error": str(e)}]

if __name__ == "__main__":
    print(json.dumps(get_registered_pythons(), indent=2))
