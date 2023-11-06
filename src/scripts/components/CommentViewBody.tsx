import { css } from "@emotion/react";
import "./CommentView.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SetonlyCollection, assert } from "@lch/common";


export type RowRender = (key: string, id: string) => JSX.Element;

const minRowHeight = 55;

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


function useElementHeightCalculator() {
  const [sum, setSum] = useState(0);
  const heihgtCollection = useMemo(() => new SetonlyCollection<number>(), []);

  const upsert = useCallback((id: string, value: number): void => {
    const oldValue = heihgtCollection.getValue(id);
    if (oldValue != null) setSum(oldSum => oldSum + (value - oldValue));
    else setSum(oldSum => oldSum + value);
    heihgtCollection.set(id, value);
  }, [heihgtCollection]);

  const getIndexFromBottom = useCallback((scrollTop: number, viewportHeight: number): { key: string, topOfBottomElement: number; } => {
    let sum = -scrollTop;
    let key: string = null!;
    for (key of heihgtCollection.keys) {
      const height = heihgtCollection.getValue(key);
      if (sum + height > viewportHeight) break;
      sum += height;
    }

    return { key, topOfBottomElement: sum };
  }, [heihgtCollection]);

  return {
    sum,
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



