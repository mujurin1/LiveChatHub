import { SetonlyCollection } from "@lch/common";
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { MIN_ROW_HEIGHT } from "./VirtualList";
import { RowLayout } from "./RowLayout";
import { LinkedNode, LinkedList } from "./LinkedList";


export type VirtualListState = ReturnType<typeof useVirtualListState>;

type RowLayoutNode = LinkedNode<RowLayout>;

// useVirtualListState コンポーネントでは
// ほとんどの関数は rowLayouts, rowHeights を利用しているが
// この値はキャッシュされており不変なため dependency に書く必要がないため
// eslint のルールの例外を適用する
// 
// dependency に書く必要がある場合は、コメントで必要な理由を記述する事にする
/* eslint-disable react-hooks/exhaustive-deps */

/**
 * 引数を変更すると
 * @param propHeight リストビューの高さ
 * @param propAutoScroll 自動スクロールするかどうか
 * @returns
 */
export function useVirtualListState(propHeight: number, propAutoScroll: boolean) {
  const [
    // いずれかの状態が変化したことを通知するオブジェクト
    updatedAnyVersion, updatedAny,
    // rowLayouts が変化したことを通知するオブジェクト
    updatedRowLayoutVersion,
  ] = useCustomHook();

  // スクロールイベントによる rowLayouts の更新
  const setScrollEvent = useCallback((oldViewportRef: typeof viewportRef) => {
    if (oldViewportRef.current != null) {
      oldViewportRef.current.removeEventListener("scroll", oldViewportRef.scrollEvent!);
    }

    if (viewportRef.current == null) return;

    viewportRef.scrollEvent = (_e: Event) => {
      if (!__dbg_user_scroll_ref.current) return;
      if (viewportRef.current == null) return;

      // 出来ることならここでイベントの発生原因を ユーザー/プログラム で判定したい
      // プログラムなら何もしない
      scrollTo(viewportRef.current.scrollTop);
      updatedAny();
    };

    viewportRef.current.addEventListener("scroll", viewportRef.scrollEvent, { passive: true });
  }, []);

  const viewportRef = useMemo<{ current: HTMLDivElement | null; scrollEvent?: (e: Event) => void; }>(() => ({ current: null }), []);
  const scrollRef = useMemo<{ current: HTMLDivElement | null; }>(() => ({ current: null }), []);
  const setViewportRef = useCallback((element: HTMLDivElement | null) => {
    const oldValue = { ...viewportRef };
    viewportRef.current = element;
    if (viewportRef.current != null) {
      viewportRef.current.scrollTop = viewportScrollTopRef.current;
      setScrollEvent(oldValue);
    }
  }, []);
  const setScrollRef = useCallback((element: HTMLDivElement | null) => {
    scrollRef.current = element;
    if (scrollRef.current != null)
      scrollRef.current.style.height = `${sumContentHeightRef.current}px`;
  }, []);


  const autoScrollRef = useRef(propAutoScroll);
  const viewportHeightRef = useRef(propHeight);
  const viewportScrollTopRef = useRef(0);
  const sumContentHeightRef = useRef(0);
  const rowCountRef = useRef(10);
  const rowsShiftRef = useRef(0);
  const __dbg_user_scroll_ref = useRef(true);

  const rowLayoutNodeRef = useRef<RowLayoutNode | null>(null);
  /** { contentId: `contentId` の行の描画後の高さ }[] */
  const contentHeights = useMemo(() => new SetonlyCollection<number, number>(), []);

  /**
   * @param source 再計算をする原因
   */
  const refreshRowLayout = useCallback((_source: "any" | "scroll") => {
    // 以下の TODO: 最適化の部分 関連
    // const rowLayoutNode = rowLayoutNodeRef.current;
    const rowCount = rowCountRef.current;
    const viewportHeight = viewportHeightRef.current;


    // 以下の TODO: 最適化の部分 関連
    // const oldTopContentId = rowLayoutNode?.value.contentId;
    let contentIndex = 0;
    let rowsShift = viewportScrollTopRef.current;

    for (; contentIndex < contentHeights.length; contentIndex++) {
      const height = contentHeights.values[contentIndex];
      const newTop = rowsShift - height;
      if (newTop <= 0) break;
      rowsShift = newTop;
    }

    rowsShiftRef.current = -rowsShift;

    // TODO: 最適化の部分
    //       スクロールによる無駄な再計算を無くすことが出来るコードだが、
    //       余白が見える問題があるので直す
    //       というか、分割統治法の部分と被るので後回し‥
    // // スクロールによる再計算の場合は、一番上の行が同じなら rowLayouts は変更する必要がない
    // if (source === "scroll" && contentHeights.keys[contentIndex] === oldTopContentId) {
    //   // updatedAny();
    //   return;
    // }

    rowLayoutNodeRef.current = LinkedList.new(
      RowLayout.new(
        contentIndex % rowCount,
        contentHeights.keys[contentIndex]
      )
    );

    let lastNode = rowLayoutNodeRef.current;
    let sumRowHeight = -rowsShift + contentHeights.values[contentIndex];

    for (let i = 1; i < rowCount; i++) {
      contentIndex += 1;
      const node = LinkedList.new(
        sumRowHeight >= viewportHeight
          ? { rowKey: contentIndex % rowCount }
          : RowLayout.new(contentIndex % rowCount, contentHeights.keys[contentIndex])
      );

      lastNode.next = node;
      lastNode = node;
      sumRowHeight += contentHeights.values[contentIndex];
    }

    updatedAny();
    // updatedRowLayout();
  }, []);

  const scrollTo = useCallback((toY: number | "bottom") => {
    const viewport = viewportRef.current;
    if (viewport == null) return;

    const sumContentHeight = sumContentHeightRef.current;
    const viewportHeight = viewportHeightRef.current;

    let source: Parameters<typeof refreshRowLayout>[0] = "scroll";
    if (toY === "bottom") {
      // toY が "bottom" なら「行の追加」の場合があるので、RowLayout は必ず更新してもらう
      toY = sumContentHeight - viewportHeight;
      source = "any";
    }
    if (toY < 0) toY = 0;

    viewportScrollTopRef.current = toY;
    viewport.scrollTop = viewportScrollTopRef.current;

    refreshRowLayout(source);

    // updatedAny();
  }, []);

  const addContent = useCallback((contentId: number, initialHeight: number | undefined = undefined) => {
    const viewportHeight = viewportHeightRef.current;
    const autoScroll = autoScrollRef.current;

    const bottom = (sumContentHeightRef.current) - viewportHeight;
    // ここの +3 は拡大率が 100% でない時の誤差を埋めるための値
    // スクロールイベントの発生原因がプログラムだと判定できれば +3 は要らない
    const isAutoScroll = bottom <= viewportScrollTopRef.current + 3;
    if (initialHeight == null) {
      // 行の最初の幅を体感できない程度の小さいサイズにすることで、
      // 「行が描画される → 幅が更新される → 行が再描画される」
      // によるガクガク感を無くす
      // ただし
      initialHeight = isAutoScroll ? 0.0625 : MIN_ROW_HEIGHT;
    }

    contentHeights.set(contentId, initialHeight);
    sumContentHeightRef.current += initialHeight;

    if (scrollRef.current != null)
      scrollRef.current.style.height = `${sumContentHeightRef.current}px`;

    if (isAutoScroll && autoScroll) scrollTo("bottom");
    else updatedAny();
  }, []);

  const addContents = useCallback((contentIds: number[], initialHeight: number | undefined = undefined) => {
    // initialHeight: 多量のコメントが追加された場合スクロール更新に時間がかかるので大きめに取る
    //                ただし大きすぎると途中の行が表示されない場合がある
    //                (1度も描画されずに高さが合わない)
    const viewportHeight = viewportHeightRef.current;
    const autoScroll = autoScrollRef.current;

    const bottom = (sumContentHeightRef.current) - viewportHeight;
    // ここの +3 は拡大率が 100% でない時の誤差を埋めるための値
    // スクロールイベントの発生原因がプログラムだと判定できれば +3 は要らない
    const isAutoScroll = bottom <= viewportScrollTopRef.current + 3;
    if (initialHeight == null) {
      // 行の最初の幅を体感できない程度の小さいサイズにすることで、
      // 「行が描画される → 幅が更新される → 行が再描画される」
      // によるガクガク感を無くす
      // ただし
      initialHeight = isAutoScroll ? 0.0625 : MIN_ROW_HEIGHT;
    }

    for (const contentId of contentIds)
      contentHeights.set(contentId, initialHeight);
    const sum = contentIds.length * initialHeight;

    sumContentHeightRef.current += sum;

    if (scrollRef.current != null)
      scrollRef.current.style.height = `${sumContentHeightRef.current}px`;


    if (isAutoScroll && autoScroll) scrollTo("bottom");
    else updatedAny();
  }, []);

  const updateRowHeight = useCallback((contentId: number, height: number) => {
    const rowLayoutNode = rowLayoutNodeRef.current;
    if (rowLayoutNode == null) return;

    const oldValue = contentHeights.getValue(contentId);
    const diff = height - oldValue;
    if (diff === 0) return;

    const autoScroll = autoScrollRef.current;
    const viewport = viewportRef.current!;
    const sumContentHeight = sumContentHeightRef.current;
    const viewportHeight = viewportHeightRef.current;

    contentHeights.set(contentId, height);
    sumContentHeightRef.current += diff;

    if (scrollRef.current != null)
      scrollRef.current.style.height = `${sumContentHeightRef.current}px`;

    //#region 変更された行が表示範囲 (を含む) より上の場合はスクロール位置を調整する
    const contentIndex = contentHeights.keyIndexes[contentId];
    const renderBottomContentId = LinkedList
      .find(rowLayoutNode, node => node.next?.value?.contentId == null)!
      .value.contentId!;
    const renderBottomContentIndex = contentHeights.keyIndexes[renderBottomContentId];
    if (contentIndex < renderBottomContentIndex) {
      viewportScrollTopRef.current += diff;
      if (viewportScrollTopRef.current < 0) viewportScrollTopRef.current = 0;

      if (viewport.scrollTop != null)
        viewport.scrollTop = viewportScrollTopRef.current;
    }
    //#endregion 変更された行が表示範囲 (を含む) より上の場合はスクロール位置を調整する

    const bottom = (sumContentHeight) - viewportHeight - height;

    // ここの +3 は拡大率が 100% でない時の誤差を埋めるための値
    // スクロールイベントの発生原因がプログラムだと判定できれば +3 は要らない
    const isAutoScroll = bottom <= viewportScrollTopRef.current + 3;
    if (isAutoScroll && autoScroll) scrollTo("bottom");
    else refreshRowLayout("any");
  }, []);


  // リストビューの高さの再設定
  useEffect(() => {
    const viewport = viewportRef.current!;

    let heightDiff = propHeight - viewportHeightRef.current;

    if (viewportScrollTopRef.current - heightDiff < 0)
      heightDiff = viewportScrollTopRef.current;


    viewportHeightRef.current = propHeight;

    const sumContentHeight = sumContentHeightRef.current;
    if (propHeight > sumContentHeight) {
    } else {
      viewportScrollTopRef.current -= heightDiff;

      if (viewport != null)
        viewport.scrollTop = viewportScrollTopRef.current;
    }

    rowCountRef.current = Math.floor((propHeight) / MIN_ROW_HEIGHT) + 2;

    if (contentHeights.length !== 0)
      refreshRowLayout("any");

    // updatedAny();
    // 引数で受け取ったビューポートの高さを元に再計算するため propsHeight を指定する
  }, [propHeight]);

  // 自動スクロールの再設定
  useEffect(() => {
    autoScrollRef.current = propAutoScroll;
    // 引数で受け取った自動スクロールを元に再計算するため propAutoScroll を指定する
  }, [propAutoScroll]);

  return {
    setViewportRef,
    setScrollRef,

    /** いずれかの状態が変化したことを伝えるオブジェクト */
    updatedAnyVersion,
    /** rowLayoutNode が変化したことを伝えるオブジェクト */
    updatedRowLayoutVersion,

    __dbg_user_scroll_ref,

    rowLayoutNode: rowLayoutNodeRef.current,
    renderRowTop: rowsShiftRef.current,

    addContent,
    addContents,
    updateRowHeight,
    scrollTo,
  };
}
/* eslint-enable react-hooks/exhaustive-deps */

/**
 * VirtualListState の状態が変化したことを伝えるオブジェクトを返す\
 */
function useCustomHook() {
  const [updatedAnyVersion, setAny] = useState(0);
  const [updatedRowLayoutVersion, setRowLayout] = useState(0);

  const updatedAny = useCallback(() => {
    setRowLayout(x => x + 1);
    setAny(x => x + 1);
  }, []);
  const updatedRowLayout = useCallback(() => {
    setRowLayout(x => x + 1);
  }, []);

  return [
    updatedAnyVersion,
    updatedAny,
    updatedRowLayoutVersion,
    updatedRowLayout,
  ] as const;
}
