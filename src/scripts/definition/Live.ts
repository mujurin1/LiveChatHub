import { SetOnlyTrigger } from "@lch/common";
import { LiveChatNotify } from "./LiveChatNotify";
import { LiveError } from "./model/LiveError";
import { LiveState } from "./model/LiveState";
import { LiveViews } from "./model/LiveViews";

/**
 * 放送
 *
 * 放送に接続して、コメントの受信や送信を行う\
 * 放送は１つの配信プラットフォームにつき１つのみ存在する
 */
export interface Live extends LiveChatNotify {
  /**
   * 配信プラットフォームID
   */
  readonly livePlatformId: string;

  /**
   * 配信プラットフォーム名
   */
  readonly livePlatformName: string;

  /**
   * エラー発生時に呼ばれる
   */
  readonly onError: SetOnlyTrigger<[LiveError]>;

  /**
   * 放送に接続しているか\
   * （コメントを取得・送信等イベントが発生しうる状態か）
   */
  readonly connecting: boolean;

  /**
   * 接続している放送の状態
   */
  readonly liveState?: LiveState;

  /**
   * 放送のビュー
   */
  readonly views: LiveViews;

  /**
   * 放送の状態が変更したことを通知する
   */
  readonly updateLiveState: SetOnlyTrigger<[LiveState]>;
}
