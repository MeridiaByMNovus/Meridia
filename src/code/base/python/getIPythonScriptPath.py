import IPython
from IPython.paths import get_ipython_package_dir
import json

result = {
    "IPython__file__": IPython.__file__
}

result["IPython_package_dir"] = get_ipython_package_dir()


print(json.dumps(result, indent=2))
