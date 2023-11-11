import React, { useCallback, useMemo, useRef } from "react";
import { VirtualListState } from "./VirtualListState";
import { RowLayout } from "./RowLayout";

import "./VirtualList.css";

export type RowRender = (props: { contentId: string; }) => JSX.Element;

export const MIN_ROW_HEIGHT = 40;

export interface VirtualListProps {
  state: VirtualListState;
  rowRender: RowRender;
}

export function VirtualList(props: VirtualListProps) {
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
    <VirtualListRow
      key={node.value.rowKey}
      rowLayout={node.value}
      top={renderRowTop}
      resizeObserver={resizeObserver}
      RowRender={RowRender}
    />
  ));

  return (
    <div
      className="virtual-list"
      ref={props.state.viewportRef}
    >
      <div
        className="virtual-list-scroll"
        ref={props.state.scrollRef}
      />
      <div className="virtual-list-lineup">
        {rows}
      </div>
    </div>
  );
}


interface VirtualListRowProps {
  rowLayout: RowLayout;
  top: number;
  resizeObserver: ResizeObserver;
  RowRender: RowRender;
}

function VirtualListRow(props: VirtualListRowProps) {
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
      style={{ top }}
    >
      {
        rowLayout.contentId != null
          ? <RowRender key={rowLayout.contentId} contentId={rowLayout.contentId} />
          : undefined
      }
      {/* <VirtualListRowItem
        RowRender={RowRender}
        rowLayout={rowLayout}
      /> */}
    </div>
  );
}

/* 
 * TODO:
 *    このメモ化したコンポーネントを使うか、
 *    タイリング (複数の行を纏めて１つの div に入れてずらす) をするか
 *    考える

interface RowItemProps { rowLayout: RowLayoutAny; RowRender: RowRender; }

const VirtualListRowItem = React.memo(
  function VirtualListRowItem({ rowLayout, RowRender }: RowItemProps) {
    return (
      RowLayout.isRequire(rowLayout)
        ? <RowRender key={rowLayout.contentId} rowLayout={rowLayout} />
        : undefined
    );
  },
  arePropsEqual,
);

function arePropsEqual(oldProps: RowItemProps, newProps: RowItemProps): boolean {
  return oldProps.rowLayout.contentId === newProps.rowLayout.contentId;
}

 */
