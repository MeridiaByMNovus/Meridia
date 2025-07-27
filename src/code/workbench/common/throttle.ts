export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  ms: number
): T {
  let last = 0;
  let pending: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: any[] | null = null;

  const run = () => {
    last = Date.now();
    pending = null;
    fn(...(lastArgs as any[]));
    lastArgs = null;
  };

  return function (this: any, ...args: any[]) {
    const now = Date.now();
    lastArgs = args;
    if (now - last >= ms) {
      run();
    } else if (!pending) {
      pending = setTimeout(run, ms - (now - last));
    }
  } as T;
}
