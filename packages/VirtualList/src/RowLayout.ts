
export interface RowLayout {
  rowKey: number;
  /**
   * 表示するコンテンツのID
   */
  contentId?: string;
}

export const RowLayout = {
  new: (rowKey: number, contentId?: string): RowLayout => {
    return { rowKey, contentId };
  },
  toNull: (rowLayout: RowLayout): RowLayout => {
    rowLayout.contentId = undefined;
    return rowLayout;
  }
};
