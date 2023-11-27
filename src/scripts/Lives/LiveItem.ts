import { DemoLiveContent } from "./DemoLive";

/**
 * コメントの他にギフトや広告など\
 * コメントと一緒にコメント欄に表示されるデータ
 */
export interface LiveItem {
  /**
   * 0-8bit: managedIndex\
   * 9-bit: liveItemIndex
   */
  id: number;
  connectId: string;

  content: DemoLiveContent;
}
