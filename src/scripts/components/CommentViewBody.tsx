import { css } from "@emotion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LinkedList, LinkedNode, SetonlyCollection, assert } from "@lch/common";

import "./CommentView.css";





const minRowHeight = 55;

export interface RowLayout {
  /**
   * 行の内容を示すID
   */
  contentId: string;
  /**
   * 行の上からの位置
   */
  top: number;
}
function RowLayout(contentId: string, top: number): RowLayout {
  return { contentId, top };
}

export type RowRender = (key: string, id: string) => JSX.Element;

export interface CommentViewBodyProps {
  rowRender: RowRender;
  height: number;
  stateRef: { state: CommentViewBodyState; };
}

export function CommentViewBody(props: CommentViewBodyProps) {
  const state = useCommentViewBodyState(props.rowRender, props.height);
  const {
    sum,
    rows
  } = state;

  props.stateRef.state = state;

  return (
    <div
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
        css={css`
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: ${sum}px;
        `}
      />
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
    </div>
  );
}

function Lineup() {

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




export type CommentViewBodyState = ReturnType<typeof useCommentViewBodyState>;
function useCommentViewBodyState(rowRender: RowRender, height: number) {
  const [lastKey, setLastKey] = useState(0);

  const renderedRowCollection = useMemo(() => new SetonlyCollection<JSX.Element>(), []);
  const { sum, upsert, getIndexFromBottom } = useElementHeightCalculator();

  const resizeObserver = useMemo(() => new ResizeObserver(entories => {
    for (const entory of entories) {
      const row = entory.target as HTMLElement;
      const { rowKey, rowId } = row.dataset;

      assert(rowKey != null && rowId != null);
      upsert(rowId, row.clientHeight);
    }
  }), [upsert]);

  const addRowItem = useMemo(() => (id: string) => {
    if (sum < height) {
      const rowKey = `${lastKey}`;
      const row = <RowItem key={rowKey} rowKey={rowKey} id={id} resizeObserver={resizeObserver} rowRender={rowRender} />;

      renderedRowCollection.set(rowKey, row);
      setLastKey(lastKey + 1);
    }

    upsert(id, minRowHeight);
  }, [height, lastKey, renderedRowCollection, resizeObserver, rowRender, sum, upsert]);

  const onScroll = useMemo(() => (top: number) => {
    const { key, topOfBottomElement } = getIndexFromBottom(top, height);


  }, [getIndexFromBottom, height]);

  return {
    sum,
    rows: renderedRowCollection.values,
    addRowItem,
    onScroll
  };
}

interface RowItemProps {
  rowKey: string;
  id: string;
  resizeObserver: ResizeObserver;
  rowRender: RowRender;
}
function RowItem(props: RowItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const current = ref.current;
    if (current == null) return;
    props.resizeObserver.observe(current);

    return () => props.resizeObserver.unobserve(current);
  }, [props.resizeObserver, ref]);

  return (
    <div
      ref={ref}
      data-row-key={props.rowKey}
      data-row-id={props.id}
      css={css`
      min-height: ${minRowHeight}px;
      `}
    >
      {props.rowRender(props.rowKey, props.id)}
    </div>
  );
}


const initCount = 5;
// const initRowLayouts = new SetonlyCollection<RowLayout, number>(
//   reduceFromRange(0, initCount, i => ({ key: i, value: { contentId: null, top: 0 } })));
const initRowLayouts = new LinkedList<RowLayout | null>(
  null, null, null, null, null
);

function useRowLayouts(viewportHeight_: number) {
  const [, refresh] = useState(0);

  const viewportHeightRef = useRef(viewportHeight_);
  // const [sumContentHeight, setSumContentHeight] = useState(0);
  // const [scrollY, setScrollY] = useState(0);
  // const [autoScroll, setAutoScroll] = useState(true);
  const sumContentHeightRef = useRef(0);
  const scrollYRef = useRef(0);
  const autoScrollRef = useRef(true);

  // const [nextRowKey, setNextRowKey] = useState(initCount);
  const rowLayouts = useMemo(() => initRowLayouts, []);
  /** { contentId: `contentId` の行の描画後の高さ }[] */
  const rowHeights = useMemo(() => new SetonlyCollection<number>(), []);

  // ビューの高さが変わった場合色々と再計算する
  useEffect(() => {
    viewportHeightRef.current = viewportHeight_;

  }, [viewportHeight_]);

  const addContent = useCallback((contentId: string, height: number) => {
    rowHeights.set(contentId, height);
    // setSumContentHeight(oldSum => oldSum + height);
    sumContentHeightRef.current += height;

    if (autoScrollRef.current) {
      let last = rowLayouts.first;

      for (const node of rowLayouts) {
        if (node.value == null) break;
        last = node;

        last.value!.top -= height;
        // TODO: top + layout.height が 0 以下なら空にして下に移動する
      }

      // last.value == null は保証されている
      last.value = { contentId, top: viewportHeightRef.current - height };
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
  const scrollBy = useCallback((byY: number) => {
    if (rowLayouts.first.value == null || byY === 0) return;
    // 一番上の行の top が 1 以上の場合は viewport を満たすほどの行が存在しないということ
    // つまりスクロール出来るはずがない
    if (rowLayouts.first.value.top > 0) return;

    const viewportHeight = viewportHeightRef.current;

    // TODO: 実際は見える範囲より少し多めに範囲を取り、その範囲内の行を実体化する

    // マウスホイールは下方向が PLUS なのでこうする
    if (byY > 0) {
      // スクロールバー/ホイールで下方向 (下の行が見える方向へのスクロール)
      // この行以降の `(undefined?)!` の部分は絶対に問題ないと保証されている
      const lastRowLayoutNode = rowLayouts.find(node => node.next!.value == null)!;
      const lastRowLayout = lastRowLayoutNode.value!;
      const lastContentId = lastRowLayout.contentId;
      const lastContentHeight = rowHeights.getValue(lastContentId);
      const lastContentBottom = (lastRowLayout.top - byY) + lastContentHeight;

      if (lastContentBottom < viewportHeight) {
        // スクロールした結果新しい行を実体化する
        const newLastContentIndex = rowHeights.keyIndexes[lastContentId] + 1;

        if (newLastContentIndex < rowHeights.length) {
          // 新しい行を表示する
          const newLastContentId = rowHeights.keys[newLastContentIndex];
          // 本当は lastContentBottom でいいがこの後に rowLayouts の中の高さを一括で変更するのでこの値にする
          lastRowLayoutNode.next!.value = {
            contentId: newLastContentId,
            top: lastRowLayout.top + lastContentHeight,
          };

          // スクロールして範囲外に出た場合
          const firstRowLayoutNode = rowLayouts.first;
          const firstRowLayout = firstRowLayoutNode.value!;
          const firstContentHeight = rowHeights.getValue(firstRowLayout.contentId);

          if (firstRowLayout.top - byY + firstContentHeight <= 0) {
            // 範囲外に出た分をゴニョゴニョ
            firstRowLayoutNode.value = null;
            // firstRowLayoutNode.value.top = 0;

            // 下方向スクロールではみ出した場合は上のノードを下に持っていく
            // rowLayouts.moveFirstToLast();  // TODO: なんでコレコメントアウト？だめじゃない？
          }
        } else {
          // 新しく表示するコンテンツがなければスクロールも巻き戻る
          byY -= viewportHeight - lastContentBottom;
          if (byY === 0) return;
        }
      }

      for (const node of rowLayouts) {
        if (node.value == null) break;
        node.value.top -= byY;
      }
    } else {
      // スクロールバー/ホイールで上方向 (上の行が見える方向へのスクロール)

      // この行以降の `(undefined?)!` の部分は絶対に問題ないと保証されている
      const firstRowLayoutNode = rowLayouts.first;
      const firstRowLayout = firstRowLayoutNode.value!;
      const firstContentId = firstRowLayout.contentId;
      // const firstContentHeight = rowHeights.getValue(firstContentId);
      const firstContentTop = (firstRowLayout.top - byY);

      if (firstContentTop > 0) {
        // スクロールした結果新しい行を実体化する
        const newFirstContentIndex = rowHeights.keyIndexes[firstContentId] - 1;

        // スクロールして範囲外に出た場合
        const lastRowLayoutNode = rowLayouts.find(node => node.next!.value == null)!;
        const lastRowLayout = lastRowLayoutNode.value!;
        // const lastContentId = lastRowLayout.contentId!;
        // const lastContentHeight = rowHeights.getValue(lastContentId);

        if (lastRowLayout.top - byY >= viewportHeight) {
          // 範囲外に出た分をゴニョゴニョ
          lastRowLayoutNode.value = null;
        }

        if (newFirstContentIndex !== -1) {
          // 新しい行を表示する
          const newFirstContentId = rowHeights.keys[newFirstContentIndex];
          const newFirstContentHeight = rowHeights.getValue(newFirstContentId);
          const newFirstRowLayoutNode = rowLayouts.last;
          // 本当は lastContentTop でいいがこの後に rowLayouts の中の高さを一括で変更するのでこの値にする
          newFirstRowLayoutNode.value = {
            contentId: newFirstContentId,
            top: firstRowLayout.top - newFirstContentHeight,
          };

          // 上方向スクロールで追加する場合は下のノードを上に持ってくる
          rowLayouts.moveLastToFirst();
        } else {
          // 新しく表示するコンテンツがなければスクロールも巻き戻る
          byY = -firstContentTop;
          if (byY === 0) return;
        }
      }

      for (const node of rowLayouts) {
        if (node.value == null) break;
        node.value.top -= byY;
      }
    }

    // setScrollY(oldValue => oldValue + byY);
    scrollYRef.current += byY;

    refresh(x => ~x);
  }, [rowLayouts, rowHeights]);

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

    rowLayouts.first = {
      value: { contentId: rowHeights.keys[contentIndex], top }
    };
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
      rowLayouts.last = {
        value: { contentId: rowHeights.keys[contentIndex], top },
        before: oldLastNode,
      };
      oldLastNode.next = rowLayouts.last;
    }

    // 予備の空のレイアウトを入れておく
    const rowLayoutCount = Math.floor(viewportHeight / minRowHeight);
    for (let i = setedLayoutCount; i < rowLayoutCount; i++) {
      const oldLastNode = rowLayouts.last;
      rowLayouts.last = { value: null, before: oldLastNode };
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
    sum: sumContentHeight,
    upsert,
    getIndexFromBottom
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



