import { ReadonlyCollection, SetOnlyTrigger } from "@lch/common";
import { UpdateVariation } from "../../definition/LiveChatNotify";
import { LcComment } from "../../definition/model/LcComment";
import { LcUser } from "../../definition/model/LcUser";


/**
 * チャットを保持・提供する
 */
export interface ChatStore {
  /**
   * コメントのコレクション
   */
  readonly comments: ReadonlyCollection<LcComment>;
  /**
   * ユーザーのコレクション
   */
  readonly users: ReadonlyCollection<LcUser>;

  /**
   * コメントが変化（追加・更新・削除）したことを通知する\
   * 通知を送信する時点で`comment.globalUserId`のユーザーは`changeUsers`により通知されていることを保証する
   */
  readonly changeCommentNotice: SetOnlyTrigger<[UpdateVariation]>;

  /**
   * コメントをしたユーザーが変化（追加・更新・削除）したことを通知する
   */
  readonly changeUserNotice: SetOnlyTrigger<[UpdateVariation]>;

  /**
   * コメントを変更する
   * @param valiation 変更の種類
   * @param comments 変更するコメント配列
   */
  changeComments(valiation: UpdateVariation, ...comments: LcComment[]): void;

  /**
   * ユーザーを変更する
   * @param valiation 変更の種類
   * @param comments 変更するユーザー配列
   */
  changeUsers(valiation: UpdateVariation, ...users: LcUser[]): void;
}
