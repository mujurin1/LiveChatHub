/**
 * LiveChat-Hub の表面上のコメントの形式
 */
export interface LcComment {
  /**
   * 全配信プラットフォームで固有のコメントID
   */
  readonly globalId: string;
  /**
   * このコメントの配信プラットフォームID
   */
  readonly livePlatformId: string;
  /**
   * コメントをしたユーザーのID
   */
  readonly userGlobalId: string;
  /**
   * コメント内容
   */
  readonly content: LcCommentContent;
}

/**
 * コメント内容\
 * コメビュの表現力に直結する
 */
export interface LcCommentContent {
  /**
   * テキスト
   */
  readonly text: string;
  /**
   * 投稿時刻 UTC
   */
  readonly time: number;
  /**
   * コメント番号
   */
  readonly no?: number;
}
