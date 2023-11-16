import { LinkedList, LinkedNode, SetonlyCollection } from "@lch/common";
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { MIN_ROW_HEIGHT } from "./VirtualList";
import { RowLayout } from "./RowLayout";


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
    updatedRowLayoutVersion, updatedRowLayout,
  ] = useCustomHook();

  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const autoScrollRef = useRef(propAutoScroll);
  const viewportHeightRef = useRef(propHeight);
  const viewportScrollTopRef = useRef(0);
  const sumContentHeightRef = useRef(0);
  const rowCountRef = useRef(10);
  const renderRowTopRef = useRef(0);
  const __dbg_user_scroll_ref = useRef(true);

  const rowLayoutNodeRef = useRef<RowLayoutNode | null>(null);
  // const rowLayoutNode = useMemo<RowLayoutNode | null>(() => null, []);
  /** { contentId: `contentId` の行の描画後の高さ }[] */
  const contentHeights = useMemo(() => new SetonlyCollection<number>(), []);

  /**
   * @param source 再計算をする原因
   */
  const refreshRowLayout = useCallback((source: "any" | "scroll") => {
    const rowLayoutNode = rowLayoutNodeRef.current;
    const rowCount = rowCountRef.current;
    const viewportHeight = viewportHeightRef.current;

    const oldTopContentId = rowLayoutNode?.value.contentId;
    let contentIndex = 0;
    let rowTop = viewportScrollTopRef.current;

    for (; contentIndex < contentHeights.length; contentIndex++) {
      const height = contentHeights.values[contentIndex];
      const newTop = rowTop - height;
      if (newTop <= 0) break;
      rowTop = newTop;
    }

    renderRowTopRef.current = -rowTop;

    // // スクロールによる再計算の場合は、一番上の行が同じなら rowLayouts は変更する必要がない
    // if (source === "scroll" && contentHeights.keys[contentIndex] === oldTopContentId) {
    //   updatedAny();
    //   return;
    // }

    rowLayoutNodeRef.current = {
      value: RowLayout.new(
        contentIndex % rowCount,
        contentHeights.keys[contentIndex]
      )
    };

    let lastNode = rowLayoutNodeRef.current;
    let sumRowHeight = -rowTop + contentHeights.values[contentIndex];

    for (let i = 1; i < rowCount; i++) {
      contentIndex += 1;
      let node: RowLayoutNode;

      if (sumRowHeight < viewportHeight) {
        node = {
          value: RowLayout.new(
            contentIndex % rowCount,
            contentHeights.keys[contentIndex]
          )
        };
      } else {
        node = { value: { rowKey: contentIndex % rowCount } };
      }

      lastNode.next = node;
      lastNode = node;
      sumRowHeight += contentHeights.values[contentIndex];
    }

    updatedRowLayout();
  }, []);

  const scrollTo = useCallback((toY: number | "bottom") => {
    const viewport = viewportRef.current!;
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

    updatedAny();
  }, []);

  const addContent = useCallback((contentId: string, height: number) => {
    const scroll = scrollRef.current!;
    const viewportHeight = viewportHeightRef.current;
    const autoScroll = autoScrollRef.current;

    contentHeights.set(contentId, height);
    sumContentHeightRef.current += height;

    scroll.style.height = `${sumContentHeightRef.current}px`;

    const bottom = (sumContentHeightRef.current) - viewportHeight - height;

    // ここの +3 は拡大率が 100% でない時の誤差を埋めるための値
    // スクロールイベントの発生原因がプログラムだと判定できれば +3 は要らない
    const isAutoScroll = bottom <= viewportScrollTopRef.current + 3;

    if (isAutoScroll && autoScroll) scrollTo("bottom");

    updatedAny();   // scrollTo が実行されたとしても必要
  }, []);

  const updateRowHeight = useCallback((contentId: string, height: number) => {
    const rowLayoutNode = rowLayoutNodeRef.current;
    if (rowLayoutNode == null) return;

    const oldValue = contentHeights.getValue(contentId);
    const diff = height - oldValue;
    if (diff === 0) return;

    const scroll = scrollRef.current!;
    const viewport = viewportRef.current!;
    const sumContentHeight = sumContentHeightRef.current;
    const viewportHeight = viewportHeightRef.current;

    contentHeights.set(contentId, height);
    sumContentHeightRef.current += diff;

    scroll.style.height = `${sumContentHeightRef.current}px`;

    //#region 変更された行が表示範囲 (を含む) より上の場合はスクロール位置を調整する
    const contentIndex = contentHeights.keyIndexes[contentId];
    const renderBottomContentId = LinkedList
      .find(rowLayoutNode, node => node.next!.value.contentId == null)!
      .value.contentId!;
    const renderBottomContentIndex = contentHeights.keyIndexes[renderBottomContentId];
    if (contentIndex < renderBottomContentIndex) {
      viewportScrollTopRef.current += diff;
      if (viewportScrollTopRef.current < 0) viewportScrollTopRef.current = 0;
      viewport.scrollTop = viewportScrollTopRef.current;
    }
    //#endregion 変更された行が表示範囲 (を含む) より上の場合はスクロール位置を調整する

    const bottom = (sumContentHeight) - viewportHeight - height;

    // ここの +3 は拡大率が 100% でない時の誤差を埋めるための値
    // スクロールイベントの発生原因がプログラムだと判定できれば +3 は要らない
    const isAutoScroll = bottom <= viewportScrollTopRef.current + 3;
    if (isAutoScroll && autoScrollRef.current) scrollTo("bottom");
    else refreshRowLayout("any");

    updatedAny();
  }, []);


  // リストビューの高さの再設定
  useEffect(() => {
    const viewport = viewportRef.current!;
    const sumContentHeight = sumContentHeightRef.current;

    let heightDiff = propHeight - viewportHeightRef.current;

    if (viewportScrollTopRef.current - heightDiff < 0)
      heightDiff = viewportScrollTopRef.current;


    viewportHeightRef.current = propHeight;

    if (propHeight > sumContentHeight) {
      viewport.style.height = `${propHeight}px`;
    } else {
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
      //
      // console.log(`${oldScrollTop} - ${viewport.scrollTop} = `, oldScrollTop - viewport.scrollTop);
      // console.log(`viewport height   :   old: ${oldViewEleHeight}   ${viewport.style.height}   dif: ${heightDiff}`);
      // console.log(`viewport scrollTop:   old: ${oldScrollTop}   ${viewport.scrollTop}`);
    }

    rowCountRef.current = Math.max(
      rowCountRef.current,
      Math.floor((propHeight) / MIN_ROW_HEIGHT) + 2
    );

    if (contentHeights.length !== 0)
      refreshRowLayout("any");

    updatedAny();
    // 引数で受け取ったビューポートの高さを元に再計算するため propsHeight を指定する
  }, [propHeight]);

  // 自動スクロールの再設定
  useEffect(() => {
    autoScrollRef.current = propAutoScroll;
    // 引数で受け取った自動スクロールを元に再計算するため propAutoScroll を指定する
  }, [propAutoScroll]);


  // スクロールイベントによる rowLayouts の更新
  useEffect(() => {
    const viewport = viewportRef.current;
    const scroll = scrollRef.current;
    if (viewport == null || scroll == null) return;

    const scrollEvent = (_e: Event) => {
      if (!__dbg_user_scroll_ref.current) return;

      // 出来ることならここでイベントの発生原因を ユーザー/プログラム で判定したい
      // プログラムなら何もしない
      scrollTo(viewport.scrollTop);
      updatedAny();
    };

    viewport.addEventListener("scroll", scrollEvent, { passive: true });
    return () => viewport.removeEventListener("scroll", scrollEvent);
  }, []);

  return {
    viewportRef,
    scrollRef,

    /** いずれかの状態が変化したことを伝えるオブジェクト */
    updatedAnyVersion,
    /** rowLayoutNode が変化したことを伝えるオブジェクト */
    updatedRowLayoutVersion,

    __dbg_user_scroll_ref,

    rowLayoutNode: rowLayoutNodeRef.current,
    renderRowTop: renderRowTopRef.current,

    addContent,
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
    setAny(x => x + 1);
  }, []);
  const updatedRowLayout = useCallback(() => {
    setRowLayout(x => x + 1);
    setAny(x => x + 1);
  }, []);

  return [
    updatedAnyVersion,
    updatedAny,
    updatedRowLayoutVersion,
    updatedRowLayout,
  ] as const;
}
