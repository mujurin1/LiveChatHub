import { css } from "@emotion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LinkedList, SetonlyCollection } from "@lch/common";

import "./CommentView.css";





const minRowHeight = 40;

export type RowLayoutExist = Required<RowLayout>;
export interface RowLayout {
  rowKey: number;
  /**
   * 行の内容を示すID
   */
  contentId?: string;
  /**
   * 行の上からの位置
   */
  top?: number;
}
export const RowLayout = {
  new: (rowKey: number, contentId?: string, top?: number): RowLayout => {
    return { rowKey, contentId, top };
  },
  isExist: (value: RowLayout): value is RowLayoutExist => {
    return value.contentId != null;
  },
  asExist: (value: RowLayout): RowLayoutExist => {
    if (RowLayout.isExist(value)) return value;

    throw new Error(`RowLayout の contentId は存在しなければなりません\n${value}`);
  },
  toNull: (rowLayout: RowLayout): RowLayout => {
    rowLayout.contentId = undefined;
    rowLayout.top = undefined;
    return rowLayout;
  }
};

export type RowRender = (rowKey: number, rowLayout: RowLayoutExist) => JSX.Element;

export interface CommentViewBodyProps {
  rowRender: RowRender;
  height: number;
  stateRef: { state: CommentViewBodyState; };
}

export function CommentViewBody(props: CommentViewBodyProps) {
  const state = useCommentViewBodyState(props);
  const {
    sumContentHeight
  } = state;

  props.stateRef.state = state;

  return (
    <div
      ref={state.viewportRef}
      css={css`
      background-color: #c1eaae;
      position: relative;
      overflow: auto;
      box-sizing: border-box;
      // height: 100%;
      height: ${props.height}px;
      `}
    >
      <div
        ref={state.scrollRef}
        css={css`
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: ${sumContentHeight}px;
        background: no-repeat url("https://img.freepik.com/free-photo/vertical-shot-old-fishing-boats-turned-upside-down-gloomy-sky_181624-39284.jpg?w=740&t=st=1699424432~exp=1699425032~hmac=a6e4f89a21aa022e1237485f87f7b3e654dc75adee71502f36da0f7f07fbba1c")
        `}
      />
      <Lineup
        state={state}
        rowRender={props.rowRender}
      />
    </div>
  );
}

interface LineupProps {
  state: CommentViewBodyState;
  rowRender: RowRender;
}
function Lineup(props: LineupProps) {
  const {
    sumContentHeight,
    scrollY,
    autoScroll,
    rowLayouts,

    addContent,
    updateHeight,
    scrollBy,
    scrollTo,
  } = props.state;

  let i = 0;
  const rows = rowLayouts.map(node =>
    RowLayout.isExist(node.value)
      ? (
        <div key={node.value.rowKey}>
          {props.rowRender(node.value.rowKey, node.value)}
        </div>
      ) : (
        <div
          css={css`
          // background-color: #96b688;
          height: ${minRowHeight}px;
          top: ${i++ * minRowHeight}px;
          `}
          key={node.value.rowKey}
        >
          {`key-${node.value.rowKey}`}
        </div>
      ));

  return (
    <div
      css={css`
      position: sticky;
      inset: 0;
      overflow: hidden;
      width: 100%;
      height: 100%;
      `}
    >
      {rows}
    </div>
  );
}




// export type CommentViewBodyState = ReturnType<typeof useCommentViewBodyState>;
// function useCommentViewBodyState(rowRender: RowRender, height: number) {
//   const [lastKey, setLastKey] = useState(0);

//   const renderedRowCollection = useMemo(() => new SetonlyCollection<JSX.Element>(), []);
//   const {
//     sumContentHeight,
//     scrollY,
//     autoScroll,
//     rowLayouts,

//     addContent,
//     updateHeight,
//     scrollBy,
//     scrollTo,
//    } = useRowLayouts(height);

//   const resizeObserver = useMemo(() => new ResizeObserver(entories => {
//     for (const entory of entories) {
//       const row = entory.target as HTMLElement;
//       const { rowKey, rowId } = row.dataset;

//       assert(rowKey != null && rowId != null);
//       upsert(rowId, row.clientHeight);
//     }
//   }), [upsert]);

//   const addRowItem = useMemo(() => (id: string) => {
//     if (sum < height) {
//       const rowKey = `${lastKey}`;
//       const row = <RowItem key={rowKey} rowKey={rowKey} id={id} resizeObserver={resizeObserver} rowRender={rowRender} />;

//       renderedRowCollection.set(rowKey, row);
//       setLastKey(lastKey + 1);
//     }

//     upsert(id, minRowHeight);
//   }, [height, lastKey, renderedRowCollection, resizeObserver, rowRender, sum, upsert]);

//   const onScroll = useMemo(() => (top: number) => {
//     const { key, topOfBottomElement } = getIndexFromBottom(top, height);


//   }, [getIndexFromBottom, height]);

//   return {
//     sum,
//     rows: renderedRowCollection.values,
//     addRowItem,
//     onScroll
//   };
// }

// interface RowItemProps {
//   rowKey: number;
//   id: string;
//   resizeObserver: ResizeObserver;
//   rowRender: RowRender;
// }
// function RowItem(props: RowItemProps) {
//   const ref = useRef<HTMLDivElement>(null);
//   useEffect(() => {
//     const current = ref.current;
//     if (current == null) return;
//     props.resizeObserver.observe(current);

//     return () => props.resizeObserver.unobserve(current);
//   }, [props.resizeObserver, ref]);

//   return (
//     <div
//       ref={ref}
//       data-row-key={props.rowKey}
//       data-row-id={props.id}
//       css={css`
//       min-height: ${minRowHeight}px;
//       `}
//     >
//       {props.rowRender(props.rowKey, props.id)}
//     </div>
//   );
// }


// const initRowLayouts = new SetonlyCollection<RowLayout, number>(
//   reduceFromRange(0, initCount, i => ({ key: i, value: { contentId: null, top: 0 } })));
const initRowLayouts = new LinkedList<RowLayout>(
  RowLayout.new(0),
  RowLayout.new(1),
);

export type CommentViewBodyState = ReturnType<typeof useCommentViewBodyState>;
function useCommentViewBodyState(props: CommentViewBodyProps) {
  const [, refresh] = useState(0);

  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const viewportHeightRef = useRef(props.height);
  // const [sumContentHeight, setSumContentHeight] = useState(0);
  // const [scrollY, setScrollY] = useState(0);
  // const [autoScroll, setAutoScroll] = useState(true);
  const sumContentHeightRef = useRef(0);
  const scrollYRef = useRef(0);
  const autoScrollRef = useRef(true);

  const rowLayouts = useMemo(() => initRowLayouts, []);
  /** { contentId: `contentId` の行の描画後の高さ }[] */
  const rowHeights = useMemo(() => new SetonlyCollection<number>(), []);



  // ビューの高さが変わった場合色々と再計算する
  useEffect(() => {
    viewportHeightRef.current = props.height;

    rowLayouts.first = { value: RowLayout.new(0) };
    rowLayouts.last = rowLayouts.first;

    const rowLayoutCount = props.height / minRowHeight + 2;
    for (let rowKey = 1; rowKey < rowLayoutCount; rowKey++) {
      const oldLast = rowLayouts.last;
      rowLayouts.last = { value: RowLayout.new(rowKey), before: oldLast };
      oldLast.next = rowLayouts.last;
    }
  }, [rowLayouts, props.height]);

  // スクロールイベントによる rowLayouts の更新
  useEffect(() => {
    const scroll = scrollRef.current;
    if (scroll == null) return;

    const scrollEvent = (_e: Event) => {
      //
    };

    scroll.addEventListener("scroll", scrollEvent);
    return () => scroll.removeEventListener("scroll", scrollEvent);
  }, []);

  // コメント追加時の自動スクロール

  const autoScroll = useCallback(
    (toY: number | "bottom") => {
      const viewport = viewportRef.current;
      const scroll = scrollRef.current;
      if (viewport == null || scroll == null) return;

      if (toY === "bottom")
    
  }, []);



  const addContent = useCallback((contentId: string, height: number) => {
    rowHeights.set(contentId, height);
    // setSumContentHeight(oldSum => oldSum + height);
    sumContentHeightRef.current += height;

    if (autoScrollRef.current) {
      let last = rowLayouts.first;
      let moveLastNodes = 0;

      for (const node of rowLayouts) {
        if (!RowLayout.isExist(node.value)) break;
        // if (node.value.contentId == null) break;
        last = node.next!;

        node.value.top -= height;
        const rowHeight = rowHeights.getValue(node.value.contentId);

        // top + layout.height が 0 以下なら空にして下に移動する
        if (node.value.top + rowHeight < 0) {
          moveLastNodes += 1;
        }
      }

      // top + layout.height が 0 以下なら空にして下に移動する
      for (let i = 0; i < moveLastNodes; i++) {
        RowLayout.toNull(rowLayouts.first.value);
        rowLayouts.moveFirstToLast();
      }

      // // last.value == null は保証されている
      // last.value = { contentId, top: viewportHeightRef.current - height };
      last.value.contentId = contentId;
      last.value.top = viewportHeightRef.current - height;
    }

    refresh(x => ~x);
  }, [rowLayouts, rowHeights]);

  const updateHeight = useCallback((contentId: string, height: number) => {
    rowHeights.set(contentId, height);
    const oldValue = rowHeights.getValue(contentId);
    // setSumContentHeight(oldSum => oldSum + (height - oldValue));
    sumContentHeightRef.current += height - oldValue;

    refresh(x => ~x);
  }, [rowHeights]);

  // 仮仕様: ScrollBy では一度に１行分を超えるスクロールはないと仮定する
  //         １行分を超えるのスクロールも実装できるが、無駄な計算が多くなってしまう
  //         それなら ScrollTo を使ったほうが効率的である
  // const scrollBy = useCallback((byY: number) => {
  //   if (!RowLayout.isExist(rowLayouts.first.value) || byY === 0) return;
  //   // if (rowLayouts.first.value.contentId == null || byY === 0) return;
  //   // 一番上の行の top が 1 以上の場合は viewport を満たすほどの行が存在しないということ
  //   // つまりスクロール出来るはずがない
  //   if (rowLayouts.first.value.top > 0) return;

  //   const viewportHeight = viewportHeightRef.current;

  //   // TODO: 実際は見える範囲より少し多めに範囲を取り、その範囲内の行を実体化する

  //   // マウスホイールは下方向が PLUS なのでこうする
  //   if (byY > 0) {
  //     // スクロールバー/ホイールで下方向 (下の行が見える方向へのスクロール)
  //     const lastRowLayoutNode = rowLayouts.find(node => node.next!.value.contentId == null)!;
  //     const lastRowLayout = RowLayout.asExist(lastRowLayoutNode.value);
  //     const lastContentId = lastRowLayout.contentId;
  //     const lastContentHeight = rowHeights.getValue(lastContentId);
  //     const lastContentBottom = (lastRowLayout.top - byY) + lastContentHeight;

  //     if (lastContentBottom < viewportHeight) {
  //       // スクロールした結果新しい行を実体化する
  //       const newLastContentIndex = rowHeights.keyIndexes[lastContentId] + 1;

  //       if (newLastContentIndex < rowHeights.length) {
  //         // 新しい行を表示する
  //         const newLastContentId = rowHeights.keys[newLastContentIndex];
  //         // 本当は lastContentBottom でいいがこの後に rowLayouts の中の高さを一括で変更するのでこの値にする
  //         lastRowLayoutNode.next!.value.contentId = newLastContentId;
  //         lastRowLayoutNode.next!.value.top = lastRowLayout.top + lastContentHeight;
  //         // lastRowLayoutNode.next!.value = {
  //         //   contentId: newLastContentId,
  //         //   top: lastRowLayout.top + lastContentHeight,
  //         // };

  //         // スクロールして範囲外に出た場合
  //         const firstRowLayoutNode = rowLayouts.first;
  //         const firstRowLayout = RowLayout.asExist(firstRowLayoutNode.value);
  //         // const firstRowLayout = firstRowLayoutNode.value!;
  //         const firstContentHeight = rowHeights.getValue(firstRowLayout.contentId);

  //         if (firstRowLayout.top - byY + firstContentHeight <= 0) {
  //           // 範囲外に出た分をゴニョゴニョ
  //           RowLayout.toNull(firstRowLayoutNode.value);
  //           // firstRowLayoutNode.value = null;
  //           // firstRowLayoutNode.value.top = 0;

  //           // 下方向スクロールではみ出した場合は上のノードを下に持っていく
  //           // rowLayouts.moveFirstToLast();  // TODO: なんでコレコメントアウト？だめじゃない？
  //         }
  //       } else {
  //         // 新しく表示するコンテンツがなければスクロールも巻き戻る
  //         byY -= viewportHeight - lastContentBottom;
  //         if (byY === 0) return;
  //       }
  //     }

  //     for (const node of rowLayouts) {
  //       if (!RowLayout.isExist(node.value)) break;
  //       // if (node.value.contentId == null) break;
  //       node.value.top -= byY;
  //     }
  //   } else {
  //     // スクロールバー/ホイールで上方向 (上の行が見える方向へのスクロール)

  //     const firstRowLayoutNode = rowLayouts.first;
  //     const firstRowLayout = RowLayout.asExist(firstRowLayoutNode.value);
  //     const firstContentId = firstRowLayout.contentId;
  //     // const firstContentHeight = rowHeights.getValue(firstContentId);
  //     const firstContentTop = (firstRowLayout.top - byY);

  //     if (firstContentTop > 0) {
  //       // スクロールした結果新しい行を実体化する
  //       const newFirstContentIndex = rowHeights.keyIndexes[firstContentId] - 1;

  //       // スクロールして範囲外に出た場合
  //       const lastRowLayoutNode = rowLayouts.find(node => node.next!.value == null)!;
  //       const lastRowLayout = RowLayout.asExist(lastRowLayoutNode.value);
  //       // const lastContentId = lastRowLayout.contentId!;
  //       // const lastContentHeight = rowHeights.getValue(lastContentId);

  //       if (lastRowLayout.top - byY >= viewportHeight) {
  //         // 範囲外に出た分をゴニョゴニョ
  //         RowLayout.toNull(lastRowLayoutNode.value);
  //         // lastRowLayoutNode.value = null;
  //       }

  //       if (newFirstContentIndex !== -1) {
  //         // 新しい行を表示する
  //         const newFirstContentId = rowHeights.keys[newFirstContentIndex];
  //         const newFirstContentHeight = rowHeights.getValue(newFirstContentId);
  //         const newFirstRowLayoutNode = rowLayouts.last;
  //         // 本当は lastContentTop でいいがこの後に rowLayouts の中の高さを一括で変更するのでこの値にする
  //         newFirstRowLayoutNode.value.contentId = newFirstContentId;
  //         newFirstRowLayoutNode.value.top = firstRowLayout.top - newFirstContentHeight;
  //         // newFirstRowLayoutNode.value = {
  //         //   rowKey: newFirstRowLayoutNode.value.rowKey,
  //         //   contentId: newFirstContentId,
  //         //   top: firstRowLayout.top - newFirstContentHeight,
  //         // };

  //         // 上方向スクロールで追加する場合は下のノードを上に持ってくる
  //         rowLayouts.moveLastToFirst();
  //       } else {
  //         // 新しく表示するコンテンツがなければスクロールも巻き戻る
  //         byY = -firstContentTop;
  //         if (byY === 0) return;
  //       }
  //     }

  //     for (const node of rowLayouts) {
  //       if (!RowLayout.isExist(node.value)) break;
  //       // if (node.value == null) break;
  //       node.value.top -= byY;
  //     }
  //   }

  //   // setScrollY(oldValue => oldValue + byY);
  //   scrollYRef.current += byY;

  //   refresh(x => ~x);
  // }, [rowLayouts, rowHeights]);

  ;
  // const scrollTo = useCallback((toY: number) => {
  const scrollTo = useCallback((toY: number) => {
    const sumContentHeight = sumContentHeightRef.current;
    const viewportHeight = viewportHeightRef.current;
    if (
      rowHeights.length === 0 ||
      sumContentHeight < viewportHeight
    ) return;

    if (toY < 0) toY = 0;
    else {
      const bottomY = sumContentHeight - viewportHeight;
      if (toY > bottomY) toY = bottomY;
    }

    // 一番上のコンテンツとその top 位置を求める
    let contentIndex = 0;
    let top = toY;
    for (; contentIndex < rowHeights.length; contentIndex++) {
      top -= rowHeights.values[contentIndex];
      if (top <= 0) break;
      // const newTop = top - rowHeights.values[contentIndex];
      // if (newTop <= 0) break;
      // top = newTop;
    }

    rowLayouts.first.value.contentId = rowHeights.keys[contentIndex];
    rowLayouts.first.value.top = top;
    // rowLayouts.first = {
    //   value: {
    //     rowKey: rowLayouts.first.value.rowKey,
    //     contentId: rowHeights.keys[contentIndex],
    //     top
    //   }
    // };
    rowLayouts.last = rowLayouts.first;
    let setedLayoutCount = 1;

    // ビューポートを埋める (かコンテンツが尽きる) まで行に追加
    while (true) {
      contentIndex += 1;
      top += rowHeights.values[contentIndex];

      if (top >= viewportHeight || contentIndex >= rowHeights.length)
        break;

      setedLayoutCount += 1;
      const oldLastNode = rowLayouts.last;
      rowLayouts.last.value.contentId = rowHeights.keys[contentIndex];
      rowLayouts.last.value.top = top;
      // rowLayouts.last = {
      //   value: { contentId: rowHeights.keys[contentIndex], top },
      //   before: oldLastNode,
      // };
      oldLastNode.next = rowLayouts.last;
    }

    // 予備の空のレイアウトを入れておく
    const rowLayoutCount = Math.floor(viewportHeight / minRowHeight);
    for (let i = setedLayoutCount; i < rowLayoutCount; i++) {
      const oldLastNode = rowLayouts.last;
      RowLayout.toNull(rowLayouts.last.value);
      // rowLayouts.last = { value: null, before: oldLastNode };
      oldLastNode.next = rowLayouts.last;
    }

    // setScrollY(toY);
    scrollYRef.current = toY;

    refresh(x => ~x);
  }, [rowLayouts, rowHeights]);

  // const getIndexFromBottom = useCallback((scrollTop: number): { key: number, topOfBottomElement: number; } => {
  //   let sum = -scrollTop;
  //   let key: number = null!;
  //   for (key of heihgtCollection.keys) {
  //     const height = heihgtCollection.getValue(key);
  //     if (sum + height > viewportHeight) break;
  //     sum += height;
  //   }

  //   return { key, topOfBottomElement: sum };
  // }, [heihgtCollection]);

  return {
    viewportRef,
    scrollRef,
    sumContentHeight: sumContentHeightRef.current,
    scrollY: scrollYRef.current,
    autoScroll: autoScrollRef.current,
    rowLayouts: rowLayouts,

    addContent,
    updateHeight,
    scrollBy,
    scrollTo,
  };
}











// interface CommentViewRowProps {
//   state: CommentViewRowItem;
//   bodyState: CommentViewBodyState;
// }
// function CommentViewRow(props: CommentViewRowProps) {
//   const state = props.state;
//   const bodyState = props.bodyState;
//   const ref = useRef<HTMLDivElement>(null);

//   useLayoutEffect(() => {
//     if (ref.current == null) return;


//     bodyState.updateHeight(state.id, ref.current.clientHeight);
//   }, [bodyState, state.id]);

//   return (
//     <div
//       ref={ref}
//       css={css`
//       display: flex;
//       align-items: center;
//       text-align: center;
//       min-height: 40px;
//       `}
//     >
//       <CommentViewRowItem />
//       <CommentViewRowItem />
//       <CommentViewRowItem />
//       <CommentViewRowItem />
//       <div>{state.id} {state.text}</div>
//     </div>
//   );
// }

// function CommentViewRowItem() {
//   return (
//     <div
//       css={css`
//       position: relative;
//       display: flex;
//       justify-content: center;
//       align-items: center;
//       height: 100%;
//       width: 100px;
//       user-select: none;
//       `}
//     >
//       Item
//     </div>
//   );
// }



