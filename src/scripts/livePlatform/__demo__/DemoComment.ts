export interface DemoComment {
  /**
   * 全配信プラットフォームで固有のコメントID
   */
  globalId: string;
  /**
   * デモプラットフォーム内でのコメントID
   */
  innerId: string;
  /**
   * コメントしたユーザーの（デモプラットフォーム内での）ID
   */
  userInnerId: string;
  /**
   * コメント内容
   */
  comment: string;
}
