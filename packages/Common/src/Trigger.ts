import { Fn } from "./util";

/**
 * トリガーへ関数の追加・削除のみさせるインターフェース
 */
export interface SetOnlyTrigger<T extends unknown[] = []> {
  add(fn: Fn<T, void>): void;
  addOnce(fn: Fn<T, void>): void;
  delete(fn: Fn<T, void>): void;
}

/**
 * 関数を登録して、呼び出してもらうやつ
 * @template T 登録する関数の引数型
 */
export class Trigger<T extends unknown[] = []> implements SetOnlyTrigger<T> {
  private readonly funcSet = new Set<Fn<T, void>>();

  /**
   * セット専用トリガーへキャストする
   */
  public asSetOnlyTrigger(): SetOnlyTrigger<T> {
    return this;
  }

  /**
   * `fire`されたら実行される関数を追加する
   * @param fn 関数
   */
  public add(fn: Fn<T, void>): void {
    this.funcSet.add(fn);
  }

  /**
   * `fire`されたら１度だけ実行される関数を追加する
   * @param fn 関数
   */
  public addOnce(fn: Fn<T, void>): void {
    const onceFn = (...args: T) => {
      fn(...args);
      this.delete(onceFn);
    };
    this.add(onceFn);
  }

  /**
   * 追加した関数を削除する
   * @param fn 関数
   */
  public delete(fn: Fn<T, void>): void {
    this.funcSet.delete(fn);
  }

  /**
   * セットされている関数を全て実行する
   * @param {T} args 実行する関数の引数
   */
  public fire(...args: T): void {
    this.funcSet.forEach((fn) => fn(...args));
  }
}
