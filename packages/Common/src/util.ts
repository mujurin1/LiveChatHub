/**
 * `False`なら例外を出す
 * @param condition
 */
export function assert<T>(condition: T): asserts condition {
  if (!condition) throw new Error("Assertion Failed");
}

/**
 * `null`なら例外を出す
 * @param value 
 */
export function assertNotNullish<T>(
  value: T | null | undefined
): asserts value is T {
  if (value == null) throw new Error("Valeu is null");
}

export type Fn<A extends unknown[] = [], R = void> = (...arg: A) => R;

/**
 * min 以上 max 未満の範囲の整数を引数に関数を実行する
 * @param min
 * @param max
 * @param reducer
 */
export function reduceFromRange<T>(
  min: number,
  max: number,
  reducer: (i: number) => T
): T[] {
  const ary: T[] = [];

  for (let i = min; i < max; i++) {
    ary.push(reducer(i));
  }

  return ary;
}
