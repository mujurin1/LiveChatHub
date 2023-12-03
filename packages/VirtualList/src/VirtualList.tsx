import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { VirtualListState, sumContentHeight, VirtualListStateActions } from "./VirtualListState";
import { RowLayout } from "./RowLayout";
import { LinkedList } from "./LinkedList";

import "./VirtualList.css";

export type RowRender = (props: { contentId: number; }) => JSX.Element;

export const MIN_ROW_HEIGHT = 40;

export interface VirtualListProps {
  state: VirtualListState;
  actions: VirtualListStateActions;
  rowRender: RowRender;
}

export function VirtualList(props: VirtualListProps) {
  // const {
  //   rowLayoutNode,
  //   scrollTop, // renderRowTop,

  //   updateRowHeight,    // updateRowHeight,
  // } = props.state;
  const { state, actions } = props;
  const RowRender = props.rowRender;

  const resizeObserver = useMemo(() => new ResizeObserver(elements => {
    if (elements.length === 0) return;

    for (const element of elements) {
      const target = element.target as HTMLElement;
      const contentId = parseInt(target.dataset.contentId!);

      if (isNaN(contentId)) continue;

      actions.updateRowHeight(contentId, target.clientHeight);
    }

  }), [actions]);


  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const __height = sumContentHeight(state);
  if (scrollRef.current != null)
    scrollRef.current.style.height = `${__height}px`;
  // const __s = scrollRef.current;
  // useEffect(() => {
  //   if (__s == null) return;

  //   __s.style.height = `${__height}px`;
  // }, [__height, __s]);

  if (viewportRef.current != null)
    viewportRef.current.scrollTop = state.scrollTop;
  const __v = viewportRef.current;
  // useEffect(() => {
  //   if (__v == null) return;

  //   __v.scrollTop = state.scrollTop;
  // }, [state.scrollTop, __v]);

  useEffect(() => {
    if (__v == null) return;

    const fn = (_e: Event) => {
      if (__v == null) return;
      // if (!VirtualListState.__dbg_user_scroll_ref.current) return;

      // 出来ることならここでイベントの発生原因を ユーザー/プログラム で判定したい
      // プログラムなら何もしない
      // state[1](state.scrollTo(__v.scrollTop));
      actions.scrollTo(__v.scrollTop);
    };

    __v.addEventListener("scroll", fn, { passive: true });

    return () => __v.removeEventListener("scroll", fn);
  }, [actions, __v]);



  return (
    <div
      className="virtual-list"
      ref={viewportRef}
    >
      <div
        className="virtual-list-scroll"
        ref={scrollRef}
      />
      <div
        className="virtual-list-lineup"
        style={{ top: state.rowShift }}
      // style={{ top: renderRowTop }}
      >
        {/* {rows} */}
        {
          LinkedList.map(state.rowLayoutNode, node => (
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
