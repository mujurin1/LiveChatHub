import { useLayoutEffect, useMemo, useRef } from "react";
import { VirtualListState } from "./VirtualListState";
import { RowLayout } from "./RowLayout";
import { LinkedList } from "./LinkedList";

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

  const resizeObserver = useMemo(() => new ResizeObserver(elements => {
    for (const element of elements) {
      const target = element.target as HTMLElement;
      const contentId = target.dataset.contentId;

      if (contentId == null) return;

      updateRowHeight(contentId, target.clientHeight);
    }
  }), [updateRowHeight]);

  // const rows = useMemo(
  //   () => LinkedList.map(rowLayoutNode, node => (
  //     <VirtualListRow
  //       key={node.value.rowKey}
  //       rowLayout={node.value}
  //       state={props.state}
  //       resizeObserver={resizeObserver}
  //       RowRender={RowRender}
  //     />
  //   )),
  //   // resizeObserbre, rowLayouts は再生成されない可変なオブジェクト
  //   // updatedRowLayoutVersion は rowLayouts が変化したことを通知するオブジェクト
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  //   [RowRender, updatedRowLayoutVersion]);

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
        {/* {rows} */}
        {
          LinkedList.map(rowLayoutNode, node => (
            <VirtualListRow
              key={node.value.rowKey}
              rowLayout={node.value}
              state={props.state}
              resizeObserver={resizeObserver}
              RowRender={RowRender}
            />
          ))
        }
      </div>
    </div>
  );
}


interface VirtualListRowProps {
  state: VirtualListState;
  rowLayout: RowLayout;
  resizeObserver: ResizeObserver;
  RowRender: RowRender;
}

function VirtualListRow(props: VirtualListRowProps) {
  const { rowLayout, resizeObserver, RowRender } = props;
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const target = ref.current;
    if (target == null) return;

    resizeObserver.observe(target);

    return () => resizeObserver.unobserve(target);
  }, [resizeObserver, rowLayout.contentId]);

  return (
    <div
      className="virtual-list-row"
      ref={ref}
      data-content-id={rowLayout.contentId}
    >
      {
        rowLayout.contentId != null
          ? <RowRender
            key={rowLayout.contentId}
            contentId={rowLayout.contentId}
          />
          : undefined
      }
    </div>
  );
}
