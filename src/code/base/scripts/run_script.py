import sys
import subprocess
import os
import uuid
import platform
import shutil


def execute_python_file(target_file, *args):
    """
    Cross-platform Python file execution with completion marker
    """
    completion_marker = f"__EXECUTION_COMPLETE_{uuid.uuid4().hex[:8]}__"
    
    try:
        # Check if target file exists
        if not os.path.exists(target_file):
            print(f"Error: File '{target_file}' not found")
            print(f"{completion_marker}_ERROR")
            return 1
            
        # Check if file is readable
        if not os.access(target_file, os.R_OK):
            print(f"Error: No read permission for '{target_file}'")
            print(f"{completion_marker}_ERROR")
            return 1
        
        # Cross-platform Python executable detection
        # Use "python" command instead of sys.executable to avoid permission issues
        python_cmd = get_python_command()
        
        # Build command - using python command for cross-platform compatibility
        cmd = [python_cmd, target_file] + list(args)
        
        # Execute the target Python file with cross-platform subprocess settings
        result = subprocess.run(
            cmd,
            capture_output=False,  # Allow interactive input/output
            text=True,
            cwd=os.getcwd(),
            # Cross-platform shell settings
            shell=False,  # More secure and cross-platform
            # Inherit environment variables
            env=os.environ.copy()
        )
        
        # Print completion marker with exit code
        if result.returncode == 0:
            print(f"\n{completion_marker}_SUCCESS")
        else:
            print(f"\n{completion_marker}_ERROR_{result.returncode}")
        
        return result.returncode
        
    except PermissionError as e:
        print(f"Permission error: {e}")
        if platform.system() == "Windows":
            print("Try running as Administrator or check Windows execution policies")
        else:
            print("Try running with sudo or check file permissions")
        print(f"{completion_marker}_PERMISSION_ERROR")
        return 126
    except FileNotFoundError as e:
        print(f"File or Python interpreter not found: {e}")
        print("Make sure Python is installed and available in PATH")
        print(f"{completion_marker}_FILE_NOT_FOUND")
        return 127
    except KeyboardInterrupt:
        print(f"\n{completion_marker}_INTERRUPTED")
        return 130
    except OSError as e:
        # Handles various OS-level errors across platforms
        print(f"OS error: {e}")
        print(f"{completion_marker}_OS_ERROR")
        return 1
    except Exception as e:
        print(f"Execution error: {e}")
        print(f"{completion_marker}_EXCEPTION")
        return 1


def get_python_command():
    """
    Get the appropriate Python command for the current platform
    """
    # Try to find python command in PATH
    python_commands = ["python3", "python", "py"]
    
    for cmd in python_commands:
        if shutil.which(cmd):
            return cmd
    
    # Fallback to sys.executable if no python command found in PATH
    # This might still cause permission issues but provides a fallback
    print("Warning: No python command found in PATH, using sys.executable")
    return sys.executable


def check_python_installation():
    """
    Verify Python installation across platforms
    """
    try:
        python_cmd = get_python_command()
        result = subprocess.run(
            [python_cmd, "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.returncode == 0
    except:
        return False


if __name__ == "__main__":
    # Verify Python installation first
    if not check_python_installation():
        print("Error: Python interpreter not properly configured")
        sys.exit(1)
    
    if len(sys.argv) < 2:
        print("Usage: python execute_with_marker.py <target_file.py> [args...]")
        print(f"Python executable: {get_python_command()}")
        print(f"Platform: {platform.system()} {platform.release()}")
        sys.exit(1)
    
    target_file = sys.argv[1]
    args = sys.argv[2:] if len(sys.argv) > 2 else []
    
    exit_code = execute_python_file(target_file, *args)
    sys.exit(exit_code)
