/**
 * LiveChat-Hub の表面上のユーザーの形式
 */
export interface LcUser {
  /**
   * 全配信プラットフォームで固有のユーザーID
   */
  readonly globalId: string;
  /**
   * このユーザーの配信プラットフォームID
   */
  readonly livePlatformId: string;
  /**
   * ユーザーの状態
   */
  readonly state: LcUserState;
}

/**
 * ユーザーの状態\
 * コメビュの表現力に繋がる
 */
export interface LcUserState {
  /**
   * ユーザー名
   */
  readonly name: string;
  /**
   * ユーザーのアイコンURL
   */
  readonly userIconUrl?: string;
}
