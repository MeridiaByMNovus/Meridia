// process polyfill is missing execArgv field
process.execArgv = [];
(process as any).platform = "unknown";