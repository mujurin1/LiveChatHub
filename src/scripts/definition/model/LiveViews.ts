/**
 * 放送のビュー
 */
export interface LiveViews {
  /**
   * 放送に接続するためのビュー
   */
  readonly connect: () => JSX.Element;
  /**
   * 放送にコメントをするためのビュー
   */
  readonly sendComment: () => JSX.Element;
}
