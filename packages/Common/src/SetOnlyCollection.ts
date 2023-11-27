import { ReadonlyCollection } from "./ReadonlyCollection";

/**
 * 一意のキーと値をセットで持っているコレクション\
 * インデックスはキーの追加された順序\
 * キーの配列, 値の配列, キーから値の取得が可能
 */
export class SetonlyCollection<
  K extends number | string,
  V,
> implements ReadonlyCollection<K, V> {
  readonly keyIndexes: Record<K, number> = {} as Record<K, number>;
  readonly keys: K[] = [];
  readonly values: V[] = [];


  /**
   * 要素数
   */
  public get length(): number {
    return this.keys.length;
  }

  /**
   * コンストラクタ
   */
  constructor(initials?: { key: K, value: V; }[]) {
    if (initials != null) {
      for (const data of initials) {
        this.set(data.key, data.value);
      }
    }
  }

  getValue(key: K): V {
    const index = this.keyIndexes[key];
    return this.values[index];
  }

  atValue(index: number): V | undefined {
    return this.values.at(index);
  }

  /**
   * 新しい要素をセットする\
   * 既に同じキーが存在する場合は上書きする
   * @param key キー
   * @param value 値
   */
  set(key: K, value: V): void {
    const index = this.keyIndexes[key];
    if (index == null) {
      const index = this.keys.length;
      this.keyIndexes[key] = this.keys.length;
      this.keys[index] = key;
      this.values[index] = value;
    } else {
      this.values[index] = value;
    }
  }

  asReadonly(): ReadonlyCollection<K, V> {
    return this;
  }

  // filter(fn: Fn<[V], boolean>): SetonlyCollection<V> {
  //   const collection = new SetonlyCollection<V>(this.#getKey);
  //   for (const [_, value] of this) {
  //     if (fn(value)) collection.set(value);
  //   }

  //   return collection;
  // }

  // find(fn: Fn<[V], boolean>): V | undefined {
  //   for (const [_, value] of this) {
  //     if (fn(value)) return value;
  //   }
  // }

  // *[Symbol.iterator](): Iterator<readonly [string, V], void, undefined> {
  //   for (const value of this.values) {
  //     const key = this.#getKey(value);
  //     yield [key, value];
  //   }
  // }
}
