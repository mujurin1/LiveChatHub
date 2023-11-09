import { LinkedList, SetonlyCollection } from "@lch/common";
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { MIN_ROW_HEIGHT } from "./VirtualList";

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



export type VirtualListState = ReturnType<typeof useVirtualListState>;

export function useVirtualListState(propHeight: number) {
  const [refreshKey, refresh] = useState(0);

  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const viewportHeightRef = useRef(propHeight);
  const sumContentHeightRef = useRef(0);
  const rowCountRef = useRef(10);
  const rowTopRef = useRef(0);

  const rowLayouts = useMemo<LinkedList<RowLayoutAny>>(createRowLayouts, []);
  /** { contentId: `contentId` の行の描画後の高さ }[] */
  const rowHeights = useMemo(() => new SetonlyCollection<number>(), []);

  const updateHeight = useCallback((contentId: string, height: number) => {
    rowHeights.set(contentId, height);
    const oldValue = rowHeights.getValue(contentId);
    sumContentHeightRef.current += height - oldValue;

    refresh(x => x + 1);
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

    rowTop += viewportHeight;
    for (const node of rowLayouts) {
      const rowKey = contentIndex % rowCountRef.current;

      node.value.rowKey = rowKey;

      if (rowTop > 0) {
        node.value.contentId = rowHeights.keys[contentIndex];
        rowTop -= rowHeights.values[contentIndex];
      } else {
        RowLayout.toNull(node.value);
      }

      contentIndex += 1;
    }

    refresh(x => x + 1);
  }, [rowLayouts, rowHeights]);

  const scrollTo = useCallback((toY: number | "bottom") => {
    const viewport = viewportRef.current!;
    const sumContentHeight = sumContentHeightRef.current;
    const viewportHeight = viewportHeightRef.current;

    if (toY === "bottom") toY = sumContentHeight - viewportHeight;
    if (toY < 0) toY = 0;

    viewport.scrollTop = toY;

    refreshRowLayout();

    refresh(x => x + 1);
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

    refresh(x => x + 1);   // scrollTo が実行されたとしても必要
  }, [rowHeights, scrollTo]);


  // ビューの高さが変わった場合色々と再計算する
  useEffect(
    () => {
      const viewport = viewportRef.current!;

      let heightDiff = propHeight - viewportHeightRef.current;

      /*
       * 実際の HTML Element の値を変える順序が大切
       * 今回は「ビューポートの高さ > スクロール位置」の順で変更する
       * そのため以下の場合にズレるので、ズレる差分だけ調整する必要がある
       */

      if (heightDiff > 0) {
        const XXX = (viewport.scrollTop + propHeight) - sumContentHeightRef.current;
        if (XXX > 0) {
          heightDiff -= XXX;
        }
      }


      viewportHeightRef.current = propHeight;
      rowTopRef.current += heightDiff;

      // 拡大率 百分率で小数点がある場合にズレる時の検証用コード
      // const oldViewEleHeight = viewport.style.height;

      viewport.style.height = `${propHeight}px`;
      // 拡大率 百分率で小数点がある場合にズレる時の検証用コード
      // const oldScrollTop = viewport.scrollTop;
      viewport.scrollTop -= heightDiff;


      // 拡大率 百分率で小数点がある場合にズレる時の検証用コード
      // console.log(`${oldScrollTop} - ${viewport.scrollTop} = `, oldScrollTop - viewport.scrollTop);
      // console.log(`viewport height   :   old: ${oldViewEleHeight}   ${viewport.style.height}   dif: ${heightDiff}`);
      // console.log(`viewport scrollTop:   old: ${oldScrollTop}   ${viewport.scrollTop}`);

      rowLayouts.first = { value: RowLayout.new(0) };
      rowLayouts.last = rowLayouts.first;

      const rowLayoutCount = Math.floor(propHeight / MIN_ROW_HEIGHT) + 2;
      if (rowLayoutCount > rowCountRef.current) {
        rowCountRef.current = rowLayoutCount;
      }

      for (let rowKey = 1; rowKey < rowCountRef.current; rowKey++) {
        const oldLast = rowLayouts.last;
        rowLayouts.last = { value: RowLayout.new(rowKey), before: oldLast };
        oldLast.next = rowLayouts.last;
      }

      refreshRowLayout();
      refresh(x => x + 1);
    },
    // ここは propHeight でないとダメ
    [rowLayouts, refreshRowLayout, propHeight]);

  // スクロールイベントによる rowLayouts の更新
  useEffect(() => {
    const viewport = viewportRef.current;
    const scroll = scrollRef.current;
    if (viewport == null || scroll == null) return;

    const scrollEvent = (_e: Event) => {
      scrollTo(viewport.scrollTop);
      refresh(x => x + 1);
    };

    viewport.addEventListener("scroll", scrollEvent, { passive: true });
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
