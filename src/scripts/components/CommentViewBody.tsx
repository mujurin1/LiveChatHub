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
}
export const RowLayout = {
  new: (rowKey: number, contentId?: string): RowLayout => {
    return { rowKey, contentId };
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
    return rowLayout;
  }
};

export interface RowRenderProps {
  rowLayout: RowLayoutExist;
}
export type RowRender = (props: RowRenderProps) => JSX.Element;

export interface CommentViewBodyProps {
  rowRender: RowRender;
  height: number;
  stateRef: { state: CommentViewBodyState; };
}

export function CommentViewBody(props: CommentViewBodyProps) {
  const state = useCommentViewBodyState(props);

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
        // height: {sumContentHeight}px;
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
    rowLayouts,
    rowTop,
    refreshKey,

    addContent,
    updateHeight,
    scrollTo,
  } = props.state;

  const RowRender = props.rowRender;

  const rows = rowLayouts.map(node =>
    RowLayout.isExist(node.value)
      ? (
        <div
          key={node.value.rowKey}
          css={css`
          background-color: #b7e8fd;
          height: 40px;
          top: ${rowTop}px;
          position: relative;
          `}
        >
          <RowRender
            key={node.value.rowKey}
            rowLayout={node.value}
          />
        </div>
      ) : (
        <div
          key={node.value.rowKey}
          css={css`
          height: ${minRowHeight}px;
          position: relative;
          `}
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


const initRowLayouts = new LinkedList<RowLayout>(
  RowLayout.new(0),
  RowLayout.new(1),
);

export type CommentViewBodyState = ReturnType<typeof useCommentViewBodyState>;
function useCommentViewBodyState(props: CommentViewBodyProps) {

  const [refreshKey, refresh] = useState(0);

  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const viewportHeightRef = useRef(props.height);
  const sumContentHeightRef = useRef(0);
  const rowTopRef = useRef(0);

  const rowLayouts = useMemo(() => initRowLayouts, []);
  /** { contentId: `contentId` の行の描画後の高さ }[] */
  const rowHeights = useMemo(() => new SetonlyCollection<number>(), []);

  // ビューの高さが変わった場合色々と再計算する
  useEffect(() => {
    viewportHeightRef.current = props.height;

    rowLayouts.first = { value: RowLayout.new(0) };
    rowLayouts.last = rowLayouts.first;

    const rowLayoutCount = Math.floor(props.height / minRowHeight) + 2;
    for (let rowKey = 1; rowKey < rowLayoutCount; rowKey++) {
      const oldLast = rowLayouts.last;
      rowLayouts.last = { value: RowLayout.new(rowKey), before: oldLast };
      oldLast.next = rowLayouts.last;
    }
    // ここは props.height でないとダメ
  }, [rowLayouts, props.height]);


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

    const rowLayoutCount = Math.floor(viewportHeight / minRowHeight) + 2;

    rowTop += viewportHeight;
    for (const node of rowLayouts) {
      const rowKey = contentIndex % rowLayoutCount;

      node.value.rowKey = rowKey;

      if (rowTop > 0) {
        node.value.contentId = rowHeights.keys[contentIndex];
        rowTop -= rowHeights.values[contentIndex];
      } else {
        node.value.contentId = undefined;
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
