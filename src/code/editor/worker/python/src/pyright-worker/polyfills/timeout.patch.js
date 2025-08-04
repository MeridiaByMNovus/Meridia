const setTimeoutOriginal = self.setTimeout.bind(self);
const clearTimeoutOriginal = self.clearTimeout.bind(self);

self.setTimeout = (handler, timeout, ...args) =>
{
    const timeoutId = setTimeoutOriginal(handler, timeout, ...args);
    return {
        __browserTimeoutId: timeoutId,
        unref: () => { },
    };
}

self.clearTimeout = (handler) =>
{
    clearTimeoutOriginal(handler.__browserTimeoutId);
}