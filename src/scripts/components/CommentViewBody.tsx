import { css } from "@emotion/react";
import { CommentViewBodyState, RowLayout, useCommentViewBodyState } from "./CommentViewBodyState";

export * from "./CommentViewBodyState";


export type RowRender = (props: { rowLayout: RowLayout; }) => JSX.Element;


export const MIN_ROW_HEIGHT = 40;

export interface CommentViewBodyProps {
  rowRender: RowRender;
  height: number;
  stateRef: { state: CommentViewBodyState; };
}

export function CommentViewBody(props: CommentViewBodyProps) {
  const state = useCommentViewBodyState(props.height);

  props.stateRef.state = state;

  return (
    <div
      ref={state.viewportRef}
      className="comment-view-body"
      css={css`
      height: ${props.height}px;
      `}
    >
      <div
        className="comment-view-body-scroll"
        ref={state.scrollRef}
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

    // refreshKey,

    // addContent,
    // updateHeight,
    // scrollTo,
  } = props.state;

  const RowRender = props.rowRender;

  const rows = rowLayouts.map(node => (
    <div
      key={node.value.rowKey}
      className="comment-view-body-row"
      css={css`
          top: ${rowTop}px;
          `}
    >
      {RowLayout.isRequire(node.value)
        ? <RowRender key={node.value.rowKey} rowLayout={node.value} />
        : <div key={node.value.rowKey} />}
    </div>
  ));

  return (
    <div className="comment-view-body-lineup">
      {rows}
    </div>
  );
}
