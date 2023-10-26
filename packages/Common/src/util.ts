/**
 * `False`なら例外を出す
 * @param condition
 */
export function assert<T>(condition: T): asserts condition {
  if (!condition) throw new Error("Assertion Failed");
}

export function assertNotNullish<T>(
  value: T | null | undefined
): asserts value is T {
  assert(value !== null && value !== undefined);
}

export type Fn<A extends unknown[] = [], R = void> = (...arg: A) => R;
