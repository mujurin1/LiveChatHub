import { Fn } from "./util";

/**
 * 一意のキーと値をセットで持っている読み取り専用コレクション\
 * キーの配列, 値の配列, キーから値の取得が可能
 */
export interface ReadonlyCollection<
  V,
  K extends number | string
> {
  /**
   * { Key: Index } のレコード
   */
  readonly keyIndexes: Readonly<Record<K, number>>;

  /**
   * 要素数
   */
  readonly length: number;

  /**
   * キーの配列
   */
  readonly keys: ReadonlyArray<K>;

  /**
   * 値の配列
   */
  readonly values: ReadonlyArray<V>;

  /**
   * キーから値を取り出す
   * @param key キー
   */
  getValue(key: K): V | undefined;

  /**
   * インデックスから値を取り出す
   * @param index インデックス
   */
  atValue(index: number): V | undefined;

  // /**
  //  * 現在の要素から条件に一致する要素だけの新しいコレクションを返す
  //  * @param fn 条件式
  //  */
  // filter(fn: Fn<[V], boolean>): ReadonlyCollection<V>;

  // /**
  //  * 最初に一致する要素を返す
  //  * @param fn 条件式
  //  */
  // find(fn: Fn<[V], boolean>): V | undefined;
}
