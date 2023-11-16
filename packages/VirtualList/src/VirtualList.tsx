import React, { useCallback, useMemo, useRef } from "react";
import { VirtualListState } from "./VirtualListState";
import { RowLayout } from "./RowLayout";
import { LinkedList } from "@lch/common";

import "./VirtualList.css";

export type RowRender = (props: { contentId: string; }) => JSX.Element;

export const MIN_ROW_HEIGHT = 40;

export interface VirtualListProps {
  state: VirtualListState;
  rowRender: RowRender;
}

export function VirtualList(props: VirtualListProps) {
  const {
    rowLayoutNode,
    renderRowTop,

    updatedRowLayoutVersion,

    updateRowHeight,
  } = props.state;
  const RowRender = props.rowRender;

  const resizeObserver = useMemo(() => new ResizeObserver(e => {
    for (const element of e) {
      const target = element.target as HTMLElement;
      const contentId = target.dataset.contentId;

      if (contentId == null) return;

      updateRowHeight(contentId, target.clientHeight);
    }
  }), [updateRowHeight]);

  const rows = useMemo(
    () => LinkedList.map(rowLayoutNode, node => (
      <VirtualListRow
        key={node.value.rowKey}
        rowLayout={node.value}
        resizeObserver={resizeObserver}
        RowRender={RowRender}
      />
    )),
    // resizeObserbre, rowLayouts は再生成されない可変なオブジェクト
    // updatedRowLayoutVersion は rowLayouts が変化したことを通知するオブジェクト
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [RowRender, updatedRowLayoutVersion]);

  return (
    <div
      className="virtual-list"
      ref={props.state.viewportRef}
    >
      <div
        className="virtual-list-scroll"
        ref={props.state.scrollRef}
      />
      <div
        className="virtual-list-lineup"
        style={{ top: renderRowTop }}
      >
        {rows}
      </div>
    </div>
  );
}


interface VirtualListRowProps {
  rowLayout: RowLayout;
  resizeObserver: ResizeObserver;
  RowRender: RowRender;
}

function VirtualListRow(props: VirtualListRowProps) {
  const { rowLayout, resizeObserver, RowRender } = props;
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
      className="virtual-list-row"
      ref={onRefChange}
      data-content-id={rowLayout.contentId}
    >
      {
        rowLayout.contentId != null
          ? <RowRender key={rowLayout.contentId} contentId={rowLayout.contentId} />
          : undefined
      }
    </div>
  );
}
