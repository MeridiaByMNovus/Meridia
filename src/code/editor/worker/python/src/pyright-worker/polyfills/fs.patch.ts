const fs = require('fs');
const os = require('os');

// declare const __fs_constants;
declare const __os_constants;

// fs.constants = __fs_constants;
os.constants = __os_constants;
os.platform = () => "unknown";
os.homedir = () => "/";