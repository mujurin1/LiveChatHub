
export interface RowLayout {
  rowKey: number;
  /**
   * 表示するコンテンツのID
   */
  contentId?: number;
}

export const RowLayout = {
  new: (rowKey: number, contentId?: number): RowLayout => {
    return { rowKey, contentId };
  },
};
