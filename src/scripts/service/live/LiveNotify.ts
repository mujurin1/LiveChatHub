// import { SetOnlyTrigger } from "@n_c_b/common";
// import {
//   UpdateVariation,
//   LcComment,
//   LcUser,
//   LiveState,
// } from "@n_c_b/n_c_browser-definition";
// import { LiveError } from "@n_c_b/n_c_browser-definition";

// export type LivePlatformId = string;

// /**
//  * チャットが変化したことを通知する
//  */
// export interface LiveNotify {
//   /**
//    * 放送の状態が変化したことを通知する
//    */
//   readonly changeState: SetOnlyTrigger<[LivePlatformId, LiveState]>;

//   /**
//    * コメントが変化（追加・更新・削除）したことを通知する\
//    * 通知を送信する時点で`comment.globalUserId`のユーザーは`changeUsers`により通知されていることを保証する
//    */
//   readonly changeComments: SetOnlyTrigger<
//     [LivePlatformId, UpdateVariation, ...LcComment[]]
//   >;

//   /**
//    * コメントをしたユーザーが変化（追加・更新・削除）したことを通知する
//    */
//   readonly changeUsers: SetOnlyTrigger<
//     [LivePlatformId, UpdateVariation, ...LcUser[]]
//   >;

//   /**
//    * Liveでエラーが発生したことを通知する
//    */
//   readonly onError: SetOnlyTrigger<[LiveError]>;
// }
