/**
 * Liveエラー
 */
export interface LiveError {
  /**
   * 配信プラットフォームID
   */
  livePlatformId: string;
  /**
   * エラーメッセージ
   */
  errorMessage: string;
}
