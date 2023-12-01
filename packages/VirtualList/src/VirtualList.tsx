import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { VirtualListState, _VirtualListState } from "./VirtualListState";
import { RowLayout } from "./RowLayout";
import { LinkedList } from "./LinkedList";

import "./VirtualList.css";

export type RowRender = (props: { contentId: number; }) => JSX.Element;

export const MIN_ROW_HEIGHT = 40;

export interface VirtualListProps {
  state: VirtualListState;
  rowRender: RowRender;
}

export function VirtualList(props: VirtualListProps) {
  // const {
  //   rowLayoutNode,
  //   scrollTop, // renderRowTop,

  //   updateRowHeight,    // updateRowHeight,
  // } = props.state;
  const state = props.state;
  const RowRender = props.rowRender;

  const resizeObserver = useMemo(() => new ResizeObserver(elements => {
    if (elements.length === 0) return;

    let newState = state.value;

    for (const element of elements) {
      const target = element.target as HTMLElement;
      const contentId = parseInt(target.dataset.contentId!);

      if (isNaN(contentId)) continue;

      // state.dispatch(old => old.updateRowHeight(contentId, target.clientHeight));
      newState = newState.updateRowHeight(contentId, target.clientHeight);
    }

    state.dispatch(newState);
  }), [state]);

  // console.log();
  // for (const x of LinkedList.getIterator(state.value.rowLayoutNode)) {
  //   console.log(x.value.contentId);
  // }


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

  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const __height = state.value.getSumContentHeight();
  const __s = scrollRef.current;
  useEffect(() => {
    if (__s == null) return;

    __s.style.height = `${__height}px`;
  }, [__height, __s]);

  const __v = viewportRef.current;
  useEffect(() => {
    if (__v == null) return;

    __v.scrollTop = state.value.scrollTop;
  }, [state.value.scrollTop, __v]);

  useEffect(() => {
    if (__v == null) return;

    const fn = (_e: Event) => {
      if (__v == null) return;
      if (!_VirtualListState.__dbg_user_scroll_ref.current) return;

      // 出来ることならここでイベントの発生原因を ユーザー/プログラム で判定したい
      // プログラムなら何もしない
      // state.dispatch(state.value.scrollTo(__v.scrollTop));
      state.dispatch(state.value.scrollTo(__v.scrollTop));
    };

    __v.addEventListener("scroll", fn, { passive: true });

    return () => __v.removeEventListener("scroll", fn);
  }, [state.value, __v, state]);

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
        style={{ top: state.value.rowShift }}
      // style={{ top: renderRowTop }}
      >
        {/* {rows} */}
        {
          LinkedList.map(state.value.rowLayoutNode, node => (
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
