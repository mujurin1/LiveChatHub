import { css } from "@emotion/react";
import { VirtualListState, RowLayout, useVirtualListState, RowLayoutAny } from "./VirtualListState";
import { useCallback, useMemo, useRef } from "react";

import "./VirtualList.css";

export * from "./VirtualListState";

export type RowRender = (props: { rowLayout: RowLayout; }) => JSX.Element;

export const MIN_ROW_HEIGHT = 40;
/** ビューポートの上側を超えて描画する範囲 */
export const ROW_MARGINE_TOP = 50;
/** ビューポートの下側を超えて描画する範囲 */
export const ROW_MARGINE_BOTTOM = 50;

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
    renderRowTop,

    updateRowHeight,
  } = props.state;
  const RowRender = props.rowRender;

  const resizeObserver = useMemo(() => new ResizeObserver(e => {
    if (e.length > 0) {
      const ele = e[0].target as HTMLElement;
      const contentId = ele.dataset.contentId;

      if (contentId == null) return;

      updateRowHeight(contentId, ele.clientHeight);
    }
  }), [updateRowHeight]);

  const rows = rowLayouts.map(node => (
    <LineupItem
      key={node.value.rowKey}
      rowLayout={node.value}
      top={renderRowTop}
      resizeObserver={resizeObserver}
      RowRender={RowRender}
    />
  ));

  return (
    <div className="virtual-list-lineup">
      {rows}
    </div>
  );
}

interface LineupItemProps {
  rowLayout: RowLayoutAny;
  top: number;
  resizeObserver: ResizeObserver;
  RowRender: RowRender;
}

function LineupItem(props: LineupItemProps) {
  const { rowLayout, top, resizeObserver, RowRender } = props;
  const ref = useRef<HTMLDivElement>();

  const onRefChange = useCallback((div: HTMLDivElement | null) => {
    if (div == null) return;

    if (ref.current != null)
      resizeObserver.unobserve(ref.current);

    ref.current = div;

    resizeObserver.observe(div);
  }, [resizeObserver]);

  return (
    <div
      ref={onRefChange}
      data-content-id={rowLayout.contentId}
      className="virtual-list-row"
      css={css`
      top: ${top}px;
      `}
    >
      {RowLayout.isRequire(rowLayout)
        ? <RowRender key={rowLayout.contentId} rowLayout={rowLayout} />
        : undefined}
    </div>
  );
}
