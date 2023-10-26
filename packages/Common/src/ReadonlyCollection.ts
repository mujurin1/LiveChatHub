import { Fn } from "./util";

/**
 * インデックス・キーから要素を取り出せるコレクション`
 * Value(V)の中には`string`のキーを持ったプロパティが必要
 */
export interface ReadonlyCollection<V> extends Iterable<readonly [string, V]> {
  /**
   * 要素数
   */
  length: number;

  /**
   * インデックスから要素を取り出す
   * @param index インデックス
   */
  at(index: number): V | undefined;

  /**
   * キーから要素を取り出す
   * @param key キー
   */
  get(key: string): V | undefined;

  /**
   * 現在の要素から条件に一致する要素だけの新しいコレクションを返す
   * @param fn 条件式
   */
  filter(fn: Fn<[V], boolean>): ReadonlyCollection<V>;

  /**
   * 最初に一致する要素を返す
   * @param fn 条件式
   */
  find(fn: Fn<[V], boolean>): V | undefined;
}
