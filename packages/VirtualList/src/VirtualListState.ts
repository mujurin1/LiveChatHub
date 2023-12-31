import { ReducersToActions, SetonlyCollection, createSlice } from "@lch/common";
import { LinkedList, LinkedNode } from "./LinkedList";
import { RowLayout } from "./RowLayout";
import { MIN_ROW_HEIGHT } from "./VirtualList";

type RowLayoutNode = LinkedNode<RowLayout>;

export interface VirtualListState {
  contentHeights: SetonlyCollection<number, number>;
  rowLayoutNode: RowLayoutNode | null;

  rowCount: number;
  rowShift: number;
  viewportHeight: number;
  scrollTop: number;
  autoScroll: boolean;
}

export const virtualListStateSlice = createSlice({
  create: (): VirtualListState => ({
    contentHeights: new SetonlyCollection<number, number>(),
    rowLayoutNode: null,

    rowCount: 0,
    rowShift: 0,
    viewportHeight: 0,
    scrollTop: 0,
    autoScroll: true,
  }),
  reducers: {
    scrollTo: (state, scrollTop: number) => {
      if (scrollTop < 0) scrollTop = 0;
      state.scrollTop = scrollTop;
      reducers.refreshRowLayout(state);
    },
    scrollToBottom: (state) => {
      const top = sumContentHeight(state) - state.viewportHeight;
      reducers.scrollTo(state, top);
    },
    addContent: (state, contentId: number, initialHeight?: number) => {
      const bottom = sumContentHeight(state) - state.viewportHeight;
      const isAutoScroll = state.autoScroll && bottom <= state.scrollTop + 3;

      if (initialHeight == null) {
        initialHeight = isAutoScroll ? 0.0625 : MIN_ROW_HEIGHT;
      }

      const contentHeights = state.contentHeights.clone();
      contentHeights.set(contentId, initialHeight);

      state.contentHeights = contentHeights;

      if (isAutoScroll)
        reducers.scrollToBottom(state);
    },
    addContents: (state, contentIds: number[], initialHeight?: number) => {
      for (const contentId of contentIds)
        reducers.addContent(state, contentId, initialHeight);
    },
    updateRowHeight: (state, contentId: number, height: number) => {
      if (state.rowLayoutNode == null) return;

      const oldValue = state.contentHeights.getValue(contentId);
      if (height === oldValue) return;

      const contentHeights = state.contentHeights.clone();
      contentHeights.set(contentId, height);

      // スクロール位置がずれないように調整する
      let scrollTop = state.scrollTop;
      if (isRowFormerDisplayRange(state, contentId)) {
        scrollTop += height - oldValue;
      }

      state.contentHeights = contentHeights;
      state.scrollTop = scrollTop;

      // TODO: -height の意味は？ -height がいらないなら addContent と同じなので関数に出来る
      const bottom = sumContentHeight(state) - state.viewportHeight - height;
      // ここの3はスクロールが完全に下でない場合でも許容するため
      if (state.autoScroll && bottom <= scrollTop + 3) {
        reducers.scrollToBottom(state);
      } else {
        reducers.refreshRowLayout(state);
      }
    },
    setViewportHeight: (state, height: number) => {
      const oldHeight = state.viewportHeight;
      if (height === oldHeight) return;

      state.viewportHeight = height;
      let scrollTop = state.scrollTop + (oldHeight - height);

      const sum = sumContentHeight(state);
      if (scrollTop > sum - height) scrollTop = sum - height;
      if (scrollTop < 0) scrollTop = 0;

      state.scrollTop = scrollTop;
      const rowCount = Math.floor(height / MIN_ROW_HEIGHT) + 2;

      state.rowCount = rowCount;
      state.viewportHeight = height;

      if (state.contentHeights.length !== 0)
        reducers.refreshRowLayout(state);
    },
    setAutoScroll: (state, autoScroll: boolean) => {
      if (autoScroll === state.autoScroll) return;
      state.autoScroll = autoScroll;
    },
    refreshRowLayout: (state) => {
      let contentIndex = 0;
      let rowShift = state.scrollTop;

      for (; contentIndex < state.contentHeights.length; contentIndex++) {
        const height = state.contentHeights.values[contentIndex];
        const newTop = rowShift - height;
        if (newTop <= 0) break;
        rowShift = newTop;
      }

      rowShift = -rowShift;

      //#region rowLayoutNode
      const rowLayoutNode = RowLayout.newNode(
        contentIndex % state.rowCount,
        state.contentHeights.keys[contentIndex]
      );

      let lastNode = rowLayoutNode;
      let sumRowHeight = rowShift + state.contentHeights.values[contentIndex];

      for (let i = 1; i < state.rowCount; i++) {
        contentIndex += 1;
        const node = LinkedList.new(
          sumRowHeight >= state.viewportHeight
            ? { rowKey: contentIndex % state.rowCount }
            : RowLayout.new(contentIndex % state.rowCount, state.contentHeights.keys[contentIndex])
        );

        lastNode.next = node;
        lastNode = node;
        sumRowHeight += state.contentHeights.values[contentIndex];
      }
      //#endregion rowLayoutNode

      state.rowLayoutNode = rowLayoutNode;
      state.rowShift = rowShift;
    },
  }
});

export type VirtualListStateActions = ReducersToActions<typeof virtualListStateSlice.reducers>;

const reducers = virtualListStateSlice.reducers;



export const sumContentHeight = (state: VirtualListState): number => {
  let sum = 0;

  for (const height of state.contentHeights.values)
    sum += height;

  return sum;
};


/**
 * コンテンツが表示範囲 (を含む) より上の行にあるか調べる
 */
const isRowFormerDisplayRange = (state: VirtualListState, contentId: number): boolean => {
  const lastContent = getLastRowNode(state);
  if (lastContent == null) return false;

  return contentId < lastContent.value.contentId!;

  // バグ修正版
  // const lastContent = state.getLastRowNode();
  // if (lastContent == null) return false;

  // const contentIndex = state.contentHeights
  //   .keys.findIndex(key => key === contentId);
  // const lastNodeIndex = state.contentHeights
  //   .keys.findIndex(key => key === lastContent.value.contentId);

  // return contentIndex < lastNodeIndex;
};

/**
 * 最後の行を取得する
 */
const getLastRowNode = (state: VirtualListState): RowLayoutNode | null => {
  for (const node of LinkedList.getIterator(state.rowLayoutNode)) {
    if (node.next?.value?.contentId == null)
      return node;
  }

  return null;
};
