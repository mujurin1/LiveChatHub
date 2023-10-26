import { ReadonlyCollection } from "./ReadonlyCollection";
import { Fn } from "./util";

/**
 * 一意のキーを持っている値のコレクション\
 * 追加・変更のみできる
 */
export class SetonlyCollection<V> implements ReadonlyCollection<V> {
  /**
   * Valueからキーを取得する
   */
  readonly #getKey: Fn<[V], string>;
  readonly #array: V[];
  /**
   * Record<Key, Index>
   */
  readonly #record: Record<string, number>;

  /**
   * 要素数
   */
  public get length(): number {
    return this.#array.length;
  }

  /**
   * コンストラクタ
   * @param getKey `V`に存在するキープロパティ名
   */
  constructor(getKey: Fn<[V], string>) {
    this.#getKey = getKey;
    this.#array = [];
    this.#record = {};
  }

  at(index: number): V | undefined {
    return this.#array.at(index);
  }

  get(key: string): V | undefined {
    const index = this.#record[key];
    return this.#array[index];
  }

  /**
   * 新しい要素をセットする\
   * すでにある要素は上書きする
   * @param value 値
   */
  set(value: V): void {
    const key = this.#getKey(value);
    const index = this.#record[key];
    if (index == null) {
      this.#record[key] = this.#array.length;
      this.#array.push(value);
    } else {
      this.#array[index] = value;
    }
  }

  filter(fn: Fn<[V], boolean>): SetonlyCollection<V> {
    const collection = new SetonlyCollection<V>(this.#getKey);
    for (const [_, value] of this) {
      if (fn(value)) collection.set(value);
    }

    return collection;
  }

  find(fn: Fn<[V], boolean>): V | undefined {
    for (const [_, value] of this) {
      if (fn(value)) return value;
    }
  }

  *[Symbol.iterator](): Iterator<readonly [string, V], void, undefined> {
    for (const value of this.#array) {
      const key = this.#getKey(value);
      yield [key, value];
    }
  }
}
