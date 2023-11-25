import { SampleSiteComment } from "./SampleSiteConnector";

/**
 * コメントの他にギフトや広告など\
 * コメントと一緒にコメント欄に表示されるデータ
 */
export interface FeedData {
  id: number;
  content: SampleSiteComment;
}
