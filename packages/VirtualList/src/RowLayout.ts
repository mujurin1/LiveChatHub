import { LinkedList, LinkedNode } from "./LinkedList";

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
  newNode: (rowKey: number, contentId?: number): LinkedNode<RowLayout> => {
    return LinkedList.new(RowLayout.new(rowKey, contentId));
  },
};
