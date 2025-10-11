type ApiPart = { [key: string]: any };

export function _merge<T extends ApiPart[]>(...apis: T): MergeObjects<T> {
  const result: ApiPart = {};

  for (const api of apis) {
    for (const [key, value] of Object.entries(api)) {
      if (
        key === "window" &&
        result.window &&
        typeof result.window === "object" &&
        typeof value === "object"
      ) {
        // merge window objects recursively
        result.window = { ...result.window, ...value };
      } else {
        result[key] = value;
      }
    }
  }

  return result as MergeObjects<T>;
}

// Helper recursive type to merge multiple object types
type MergeObjects<T extends any[]> = T extends [infer First, ...infer Rest]
  ? Rest extends any[]
    ? MergeTwoObjects<First & {}, MergeObjects<Rest>>
    : First
  : {};

type MergeTwoObjects<A, B> = {
  [K in keyof A | keyof B]: K extends keyof B
    ? K extends keyof A
      ? // If both have same key and both values are objects, recursively merge
        A[K] extends object
        ? B[K] extends object
          ? MergeTwoObjects<A[K], B[K]>
          : B[K]
        : B[K]
      : B[K]
    : K extends keyof A
    ? A[K]
    : never;
};
