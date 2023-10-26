import { SetOnlyTrigger } from "@lch/common";
import { LcComment } from "./model/LcComment";
import { LcUser } from "./model/LcUser";

/**
 * チャットの更新の種類
 */
export type UpdateVariation = "Add" | "Update" | "Delete";

/**
 * 放送のチャットが変化したことを通知する
 */
export interface LiveChatNotify {
  /**
   * 放送のコメントが変化（追加・更新・削除）したことを通知する\
   * 通知を送信する時点で`comment.globalUserId`のユーザーは`changeUsers`により通知されていることを保証する
   */
  readonly changeComments: SetOnlyTrigger<[UpdateVariation, ...LcComment[]]>;

  /**
   * 放送のコメントをしたユーザーが変化（追加・更新・削除）したことを通知する
   */
  readonly changeUsers: SetOnlyTrigger<[UpdateVariation, ...LcUser[]]>;
}
