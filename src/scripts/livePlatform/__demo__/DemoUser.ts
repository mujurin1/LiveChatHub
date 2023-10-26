export interface DemoUser {
  /**
   * 全配信プラットフォームで固有のユーザーID
   */
  globalId: string;
  /**
   * デモプラットフォーム内でのユーザーID
   */
  innerId: string;
  /**
   * ユーザー名
   */
  name: string;
}
