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
  const viewportScrollTopRef = useRef(0);
  const sumContentHeightRef = useRef(0);
  const rowCountRef = useRef(10);
  const renderRowTopRef = useRef(0);

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

    const viewportHeight = viewportHeightRef.current;

    let contentIndex = 0;
    let rowTop = viewportScrollTopRef.current;

    for (; contentIndex < rowHeights.length; contentIndex++) {
      const height = rowHeights.values[contentIndex];
      const newTop = rowTop - height;
      if (newTop <= 0) break;
      rowTop = newTop;
    }

    renderRowTopRef.current = -rowTop;

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

    viewportScrollTopRef.current = toY;
    viewport.scrollTop = viewportScrollTopRef.current;

    refreshRowLayout();

    refresh(x => x + 1);
  }, [refreshRowLayout]);

  const addContent = useCallback((contentId: string, height: number) => {
    rowHeights.set(contentId, height);
    sumContentHeightRef.current += height;

    const sumContentHeight = sumContentHeightRef.current;
    const viewportHeight = viewportHeightRef.current;

    scrollRef.current!.style.height = `${sumContentHeight}px`;

    const bottom = (sumContentHeight) - viewportHeight - height;

    // ここの +3 は拡大率が 100% でない時の誤差を埋めるための値
    // スクロールイベントの発生原因がプログラムだと判定できれば +3 は要らない
    const isAutoScroll = bottom <= viewportScrollTopRef.current + 3;
    if (isAutoScroll) scrollTo("bottom");

    refresh(x => x + 1);   // scrollTo が実行されたとしても必要
  }, [rowHeights, scrollTo]);


  // ビューの高さが変わった場合色々と再計算する
  useEffect(
    () => {
      const viewport = viewportRef.current!;

      const heightDiff = propHeight - viewportHeightRef.current;

      viewportHeightRef.current = propHeight;

      /** 「拡大率 百分率で小数点がある場合にズレる」のは
       * スクロール位置が画面上のピクセル位置に依存しているせいで、
       * 指定した scrollTop がピクセル上でない場合に、近くのピクセルに近似される？ため？
       * 
       * なので scrollTop は参照せずに指定するだけに留めれば良いのだが、
       * スクロールイベント発生時にそれが ユーザー or プログラム をイベントから判断することが不可能なので、
       * 実スクロール位置から、新しいスクロール位置を判定する関数 {@link scrollTo} 内部で
       * scrollTop を新しいスクロール位置に指定する必要がある
       * 
       * そのため コメント追加/ウィンドウ縦幅変更 時に
       *   → プログラムから scrollTop を設定
       *   → スクロールイベントが発生
       *   → 現在の scrollTop を元に新しいスクロール位置を設定
       *   → その値は現在の描画位置と違うため少しズレる
       * 
       * また、コメント追加時の自動スクロールでは
       * スクロール位置の計算に誤差が生まれるため、自動スクロールが反応しない場合がある
       * 
       * スクロールイベントの原因が ユーザー or プログラム か判断できれば問題は全て解決する
       */

      // 拡大率 百分率で小数点がある場合にズレる時の検証用コード
      // const oldViewEleHeight = viewport.style.height;

      viewport.style.height = `${propHeight}px`;
      // 拡大率 百分率で小数点がある場合にズレる時の検証用コード
      // const oldScrollTop = viewport.scrollTop;
      viewportScrollTopRef.current -= heightDiff;
      viewport.scrollTop = viewportScrollTopRef.current;

      // 拡大率 百分率で小数点がある場合にズレる時の検証用コード
      // console.log("rowTopRef.current", renderRowTopRef.current, "   viewport.scrollTop", viewport.scrollTop);
      // console.log(heightDiff - (oldScrollTop - viewport.scrollTop));

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
      // 出来ることならここでイベントの発生原因を ユーザー/プログラム で判定したい
      // プログラムなら何もしない
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
    renderRowTop: renderRowTopRef.current,

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
