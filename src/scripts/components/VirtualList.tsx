import { css } from "@emotion/react";
import { VirtualListState, RowLayout, useVirtualListState } from "./VirtualListState";

import "./VirtualList.css";

export * from "./VirtualListState";

export type RowRender = (props: { rowLayout: RowLayout; }) => JSX.Element;

export const MIN_ROW_HEIGHT = 40;

export interface VirtualListProps {
  rowRender: RowRender;
  height: number;
  stateRef: { state: VirtualListState; };
}

export function VirtualList(props: VirtualListProps) {
  const state = useVirtualListState(props.height);

  props.stateRef.state = state;

  return (
    <div
      className="virtual-list"
      ref={state.viewportRef}
    >
      <div
        className="virtual-list-scroll"
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
  state: VirtualListState;
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
      className="virtual-list-row"
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
    <div className="virtual-list-lineup">
      {rows}
    </div>
  );
}
