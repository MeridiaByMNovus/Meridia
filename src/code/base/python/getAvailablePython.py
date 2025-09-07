import subprocess
import json
import re
import os
import shutil
import platform


def get_registered_pythons():
    result = []
    seen_paths = set()
    
    
    if platform.system() == "Windows":
        try:
            output = subprocess.check_output(["py", "-0p"], text=True)
            lines = output.strip().splitlines()
            
            for line in lines:
                
                match = re.match(r"\s*(-[\w.:]+)\s+\*?\s*(.*)", line)
                if not match:
                    continue
                ver_tag, path = match.groups()
                path = path.strip()
                
                if path in seen_paths:
                    continue
                seen_paths.add(path)
                
                try:
                    version_output = subprocess.check_output([path, "--version"], stderr=subprocess.STDOUT, text=True).strip()
                except Exception as ve:
                    version_output = f"Error: {ve}"
                
                result.append({
                    "version_tag": ver_tag,
                    "cmd": path,
                    "version": version_output,
                    "source": "py_launcher"
                })
        except (subprocess.CalledProcessError, FileNotFoundError):
            pass  
    
    
    python_commands = ["python", "python3", "python3.12", "python3.11", "python3.10", "python3.9", "python3.8", "python3.7", "python2.7"]
    
    for cmd in python_commands:
        path = shutil.which(cmd)
        if path and path not in seen_paths:
            seen_paths.add(path)
            try:
                version_output = subprocess.check_output([path, "--version"], stderr=subprocess.STDOUT, text=True).strip()
            except Exception as ve:
                version_output = f"Error: {ve}"
            
            result.append({
                "version_tag": f"-{cmd}",
                "cmd": path,
                "version": version_output,
                "source": "PATH"
            })
    
    
    if platform.system() == "Windows":
        common_paths = [
            "C:\\Python*\\python.exe",
            "C:\\Program Files\\Python*\\python.exe",
            "C:\\Program Files (x86)\\Python*\\python.exe",
            os.path.expanduser("~\\AppData\\Local\\Programs\\Python\\Python*\\python.exe")
        ]
        
        import glob
        for pattern in common_paths:
            for path in glob.glob(pattern):
                if os.path.isfile(path) and path not in seen_paths:
                    seen_paths.add(path)
                    try:
                        version_output = subprocess.check_output([path, "--version"], stderr=subprocess.STDOUT, text=True).strip()
                    except Exception as ve:
                        version_output = f"Error: {ve}"
                    
                    result.append({
                        "version_tag": "-system",
                        "cmd": path,
                        "version": version_output,
                        "source": "system_search"
                    })
    
    else:  
        common_paths = [
            "/usr/bin/python",
            "/usr/bin/python3",
            "/usr/local/bin/python",
            "/usr/local/bin/python3",
            "/opt/python*/bin/python*",
            "/home/*/.pyenv/versions/*/bin/python",
            "/usr/bin/python3.*",
            "/usr/local/bin/python3.*"
        ]
        
        import glob
        for pattern in common_paths:
            for path in glob.glob(pattern):
                if os.path.isfile(path) and os.access(path, os.X_OK) and path not in seen_paths:
                    seen_paths.add(path)
                    try:
                        version_output = subprocess.check_output([path, "--version"], stderr=subprocess.STDOUT, text=True).strip()
                    except Exception as ve:
                        version_output = f"Error: {ve}"
                    
                    result.append({
                        "version_tag": "-system",
                        "cmd": path,
                        "version": version_output,
                        "source": "system_search"
                    })
    
    
    venv_indicators = ['VIRTUAL_ENV', 'CONDA_DEFAULT_ENV', 'PYENV_VERSION']
    for env_var in venv_indicators:
        if env_var in os.environ:
            result.append({
                "version_tag": "-current_env",
                "cmd": "current environment",
                "version": f"{env_var}={os.environ[env_var]}",
                "source": "environment"
            })
    
    
    unique_result = []
    real_paths_seen = set()
    
    for item in result:
        if item["cmd"] != "current environment":
            try:
                real_path = os.path.realpath(item["cmd"])
                if real_path not in real_paths_seen:
                    real_paths_seen.add(real_path)
                    unique_result.append(item)
            except:
                unique_result.append(item)  
        else:
            unique_result.append(item)
    
    if not unique_result:
        return [{"error": "No Python installations found"}]
    
    return unique_result


if __name__ == "__main__":
    print(json.dumps(get_registered_pythons(), indent=2))
