import { LinkedList, SetonlyCollection } from "@lch/common";
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { MIN_ROW_HEIGHT } from "./CommentViewBody";


export type RowLayout = Required<RowLayoutAny>;
export interface RowLayoutAny {
  rowKey: number;
  /**
   * 行の内容を示すID
   */
  contentId?: string;
}

export const RowLayout = {
  new: (rowKey: number, contentId?: string): RowLayoutAny => {
    return { rowKey, contentId };
  },
  isRequire: (value: RowLayoutAny): value is RowLayout => {
    return value.contentId != null;
  },
  asRequire: (value: RowLayoutAny): RowLayout => {
    if (RowLayout.isRequire(value)) return value;

    throw new Error(`RowLayout の contentId は存在しなければなりません\n${value}`);
  },
  toNull: (rowLayout: RowLayoutAny): RowLayoutAny => {
    rowLayout.contentId = undefined;
    return rowLayout;
  }
};



export type CommentViewBodyState = ReturnType<typeof useCommentViewBodyState>;

export function useCommentViewBodyState(propHeight: number) {
  const [refreshKey, refresh] = useState(0);

  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const viewportHeightRef = useRef(propHeight);
  const sumContentHeightRef = useRef(0);
  const rowTopRef = useRef(0);

  const rowLayouts = useMemo(createRowLayouts, []);
  /** { contentId: `contentId` の行の描画後の高さ }[] */
  const rowHeights = useMemo(() => new SetonlyCollection<number>(), []);

  // ビューの高さが変わった場合色々と再計算する
  useEffect(() => {
    viewportHeightRef.current = propHeight;

    rowLayouts.first = { value: RowLayout.new(0) };
    rowLayouts.last = rowLayouts.first;

    const rowLayoutCount = Math.floor(propHeight / MIN_ROW_HEIGHT) + 2;
    for (let rowKey = 1; rowKey < rowLayoutCount; rowKey++) {
      const oldLast = rowLayouts.last;
      rowLayouts.last = { value: RowLayout.new(rowKey), before: oldLast };
      oldLast.next = rowLayouts.last;
    }
    // ここは propHeight でないとダメ
  }, [rowLayouts, propHeight]);


  const updateHeight = useCallback((contentId: string, height: number) => {
    rowHeights.set(contentId, height);
    const oldValue = rowHeights.getValue(contentId);
    sumContentHeightRef.current += height - oldValue;

    refresh(x => ~x);
  }, [rowHeights]);

  const refreshRowLayout = useCallback(() => {
    if (rowHeights.length === 0) return;

    const viewport = viewportRef.current!;
    const viewportHeight = viewportHeightRef.current;

    let contentIndex = 0;
    let rowTop = viewport.scrollTop;
    for (; contentIndex < rowHeights.length; contentIndex++) {
      const height = rowHeights.values[contentIndex];
      const newTop = rowTop - height;
      if (newTop <= 0) break;
      rowTop = newTop;
    }

    rowTopRef.current = -rowTop;

    const rowLayoutCount = Math.floor(viewportHeight / MIN_ROW_HEIGHT) + 2;

    rowTop += viewportHeight;
    for (const node of rowLayouts) {
      const rowKey = contentIndex % rowLayoutCount;

      node.value.rowKey = rowKey;

      if (rowTop > 0) {
        node.value.contentId = rowHeights.keys[contentIndex];
        rowTop -= rowHeights.values[contentIndex];
      } else {
        RowLayout.toNull(node.value);
      }

      contentIndex += 1;
    }

    refresh(x => ~x);
  }, [rowLayouts, rowHeights]);

  const scrollTo = useCallback((toY: number | "bottom") => {
    const viewport = viewportRef.current!;
    const sumContentHeight = sumContentHeightRef.current;
    const viewportHeight = viewportHeightRef.current;

    if (toY === "bottom") toY = sumContentHeight - viewportHeight;
    if (toY < 0) toY = 0;

    viewport.scrollTop = toY;

    refreshRowLayout();

    refresh(x => ~x);
  }, [refreshRowLayout]);

  const addContent = useCallback((contentId: string, height: number) => {
    rowHeights.set(contentId, height);
    sumContentHeightRef.current += height;

    const sumContentHeight = sumContentHeightRef.current;
    const viewportHeight = viewportHeightRef.current;
    const viewport = viewportRef.current!;

    scrollRef.current!.style.height = `${sumContentHeight}px`;

    const bottom = (sumContentHeight) - viewportHeight - height;

    const isAutoScroll = bottom <= viewport.scrollTop;
    if (isAutoScroll) scrollTo("bottom");

    refresh(x => ~x);   // scrollTo が実行されたとしても必要
  }, [rowHeights, scrollTo]);


  // スクロールイベントによる rowLayouts の更新
  useEffect(() => {
    const viewport = viewportRef.current;
    const scroll = scrollRef.current;
    if (viewport == null || scroll == null) return;

    const scrollEvent = (_e: Event) => {
      console.log("scroll", viewport.scrollTop);

      scrollTo(viewport.scrollTop);
      refresh(x => ~x);
    };

    viewport.addEventListener("scroll", scrollEvent);
    return () => viewport.removeEventListener("scroll", scrollEvent);
  }, [scrollTo]);

  return {
    viewportRef,
    scrollRef,

    rowLayouts,
    rowTop: rowTopRef.current,

    refreshKey,

    addContent,
    updateHeight,
    scrollTo,
  };
}

const createRowLayouts = () => new LinkedList<RowLayoutAny>(
  RowLayout.new(0),
  RowLayout.new(1),
);
