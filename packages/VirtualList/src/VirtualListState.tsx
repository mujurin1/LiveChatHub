import { useMemo, useState } from "react";
import { SetonlyCollection } from "@lch/common";
import { LinkedList, LinkedNode } from "./LinkedList";
import { RowLayout } from "./RowLayout";
import { MIN_ROW_HEIGHT } from "./VirtualList";


type RowLayoutNode = LinkedNode<RowLayout>;


export class _VirtualListState {
  static readonly __dbg_user_scroll_ref: {
    current: boolean;
  } = { current: true };

  constructor(
    readonly contentHeights: SetonlyCollection<number, number>,
    readonly rowLayoutNode: RowLayoutNode | null,

    readonly rowCount: number,
    readonly rowShift: number,
    readonly viewportHeight: number,
    readonly scrollTop: number,
    readonly autoScroll: boolean,
  ) { }

  static create(): _VirtualListState {
    return new _VirtualListState(
      new SetonlyCollection<number, number>(),
      null,

      0,
      0,
      0,
      0,
      true,
    );
  }

  scrollTo(scrollTop: number): _VirtualListState {
    if (scrollTop < 0) scrollTop = 0;

    const newState = new _VirtualListState(
      this.contentHeights,
      this.rowLayoutNode,
      this.rowCount,
      this.rowShift,
      this.viewportHeight,
      scrollTop,
      this.autoScroll,
    );

    return newState.refreshRowLayout();
  }

  scrollToBottom(): _VirtualListState {
    const top = this.getSumContentHeight() - this.viewportHeight;
    return this.scrollTo(top);
  }

  addContent(contentId: number, initialHeight?: number): _VirtualListState {
    const bottom = this.getSumContentHeight() - this.viewportHeight;
    const isAutoScroll = this.autoScroll && bottom <= this.scrollTop + 3;

    if (initialHeight == null) {
      initialHeight = isAutoScroll ? 0.0625 : MIN_ROW_HEIGHT;
    }

    const contentHeights = this.contentHeights.clone();
    contentHeights.set(contentId, initialHeight);

    const newState = new _VirtualListState(
      contentHeights,
      this.rowLayoutNode,
      this.rowCount,
      this.rowShift,
      this.viewportHeight,
      this.scrollTop,
      this.autoScroll,
    );

    if (isAutoScroll) return newState.scrollToBottom();
    return newState;
  }

  addContents(contentIds: number[], initialHeight?: number): _VirtualListState {
    let newState: _VirtualListState = this;
    for (const contentId of contentIds)
      newState = newState.addContent(contentId, initialHeight);

    return newState;
  }

  updateRowHeight(contentId: number, height: number): _VirtualListState {
    if (this.rowLayoutNode == null) return this;

    const oldValue = this.contentHeights.getValue(contentId);
    if (height === oldValue) return this;

    const contentHeights = this.contentHeights.clone();
    contentHeights.set(contentId, height);

    // スクロール位置がずれないように調整する
    let scrollTop = this.scrollTop;
    if (this.isRowFormerDisplayRange(contentId)) {
      scrollTop += height - oldValue;
    }

    const newState = new _VirtualListState(
      contentHeights,
      this.rowLayoutNode,
      this.rowCount,
      this.rowShift,
      this.viewportHeight,
      scrollTop,
      this.autoScroll,
    );

    // TODO: -height の意味は？ -height がいらないなら addContent と同じなので関数に出来る
    const bottom = this.getSumContentHeight() - this.viewportHeight - height;
    // ここの3はスクロールが完全に下でない場合でも許容するため
    if (this.autoScroll && bottom <= scrollTop + 3) {
      return newState.scrollToBottom();
    }

    return newState.refreshRowLayout();
  }

  setViewportHeight(height: number): _VirtualListState {
    if (height === this.viewportHeight) return this;

    let diff = height - this.viewportHeight;

    if (this.scrollTop - diff < 0)
      diff = this.scrollTop;

    let scrollTop = this.scrollTop - diff;
    if (scrollTop < 0) scrollTop = 0;
    else {
      const sum = this.getSumContentHeight();
      const maxTop = sum - height;
      if (maxTop < scrollTop) scrollTop = maxTop;
    }

    const rowCount = Math.floor(height / MIN_ROW_HEIGHT) + 2;

    const newState = new _VirtualListState(
      this.contentHeights,
      this.rowLayoutNode,
      rowCount,
      this.rowShift,
      height,
      scrollTop,
      this.autoScroll,
    );

    if (this.contentHeights.length === 0)
      return newState;

    return newState.refreshRowLayout();
  }

  setAutoScroll(autoScroll: boolean): _VirtualListState {
    if (autoScroll === this.autoScroll) return this;

    return new _VirtualListState(
      this.contentHeights,
      this.rowLayoutNode,
      this.rowCount,
      this.rowShift,
      this.viewportHeight,
      this.scrollTop,
      autoScroll,
    );
  }

  /**
   * こレで求めているものは計算で求まるので‥あとで‥
   */
  refreshRowLayout(): _VirtualListState {
    let contentIndex = 0;
    let rowsShift = this.scrollTop;

    for (; contentIndex < this.contentHeights.length; contentIndex++) {
      const height = this.contentHeights.values[contentIndex];
      const newTop = rowsShift - height;
      if (newTop <= 0) break;
      rowsShift = newTop;
    }

    rowsShift = -rowsShift;

    //#region rowLayoutNode
    const rowLayoutNode = RowLayout.newNode(
      contentIndex % this.rowCount,
      this.contentHeights.keys[contentIndex]
    );

    let lastNode = rowLayoutNode;
    let sumRowHeight = rowsShift + this.contentHeights.values[contentIndex];

    for (let i = 1; i < this.rowCount; i++) {
      contentIndex += 1;
      const node = LinkedList.new(
        sumRowHeight >= this.viewportHeight
          ? { rowKey: contentIndex % this.rowCount }
          : RowLayout.new(contentIndex % this.rowCount, this.contentHeights.keys[contentIndex])
      );

      lastNode.next = node;
      lastNode = node;
      sumRowHeight += this.contentHeights.values[contentIndex];
    }
    //#endregion rowLayoutNode

    return new _VirtualListState(
      this.contentHeights,
      rowLayoutNode,
      this.rowCount,
      rowsShift,
      this.viewportHeight,
      this.scrollTop,
      this.autoScroll,
    );
  }


  getSumContentHeight(): number {
    let sum = 0;

    for (const height of this.contentHeights.values)
      sum += height;

    return sum;
  }


  /**
   * コンテンツが表示範囲 (を含む) より上の行にあるか調べる
   */
  isRowFormerDisplayRange(contentId: number): boolean {
    const lastContent = this.getLastRowNode();
    if (lastContent == null) return false;

    return contentId < lastContent.value.contentId!;

    // バグ修正版
    // const lastContent = this.getLastRowNode();
    // if (lastContent == null) return false;

    // const contentIndex = this.contentHeights
    //   .keys.findIndex(key => key === contentId);
    // const lastNodeIndex = this.contentHeights
    //   .keys.findIndex(key => key === lastContent.value.contentId);

    // return contentIndex < lastNodeIndex;
  }

  /**
   * 最後の行を取得する
   */
  getLastRowNode(): RowLayoutNode | null {
    for (const node of LinkedList.getIterator(this.rowLayoutNode)) {
      if (node.next?.value?.contentId == null)
        return node;
    }

    return null;
  }
}

export type VirtualListState = ReturnType<typeof useVirtualListState>;
export function useVirtualListState() {
  const [virtualListState, setVirtualListState] = useState(
    () => _VirtualListState.create()
  );

  const res = useMemo(() => ({
    value: virtualListState,
    dispatch: setVirtualListState
  }), [virtualListState]);

  return res;
}
