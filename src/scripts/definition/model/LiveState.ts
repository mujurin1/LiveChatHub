import { LcUser } from "./LcUser";

/**
 * 放送の状態
 */
export interface LiveState {
  /**
   * 視聴可能か
   */
  readonly canWatching: boolean;
  /**
   * 放送開始時刻 UTC
   */
  readonly startTime: number;
  /**
   * 放送タイトル
   */
  readonly title: string;
  /**
   * 放送者のユーザー
   */
  readonly liverId: LcUser;
  /**
   * ログインしているか?
   */
  readonly isLogin: boolean;
  /**
   * ログインしているユーザー
   */
  readonly loginUser?: LcUser;
  /**
   * リアルタイムか
   */
  readonly isReal: boolean;
  /**
   * コメント可能か
   */
  readonly canComment: boolean;
}
