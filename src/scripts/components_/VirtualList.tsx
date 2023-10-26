import React, { useState, useLayoutEffect, useRef, useCallback, useEffect, useMemo } from "react";
import { RowLayout, VirtualListLayoutManager } from "./VirtualListLayoutManager";
import { Fn, SetOnlyTrigger } from "@lch/common";

import "./style.css";

export interface RowRenderProps {
  /**
   * 表示する行のレイアウト
   */
  rowLayout: RowLayout;
}

export interface VirtualListViewProps {
  layoutManager: VirtualListLayoutManager;
  rowRender: Fn<[RowRenderProps], JSX.Element>;
  /**
   * 行の高さを再計算したい時に呼び出す
   */
  refreshRowHeight: SetOnlyTrigger<[]>;
}

export function VirtualListView(props: VirtualListViewProps) {
  const layoutManager = useMemo(
    () => props.layoutManager,
    [props.layoutManager]
  );

  const [layout, setLayout] = useState(layoutManager.listViewLayout);

  useEffect(() => {
    const onWindowResize = () => {
      const viewport = viewportRef.current;
      if (viewport === null) return;

      layoutManager.setViewportHeight(viewport.clientHeight);
    };
    const onRecomputedLayout = () => setLayout(layoutManager.listViewLayout);

    layoutManager.onRecomputedLayout.add(onRecomputedLayout);
    window.addEventListener("resize", onWindowResize);

    return () => {
      layoutManager.onRecomputedLayout.delete(onRecomputedLayout);
      window.removeEventListener("resize", onWindowResize);
    };
  }, [layoutManager]);
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (viewport === null) return;

    layoutManager.setViewportHeight(viewport.clientHeight);
  });

  const viewportRef = useRef<HTMLDivElement | null>(null);

  // レイアウトからのスクロール位置更新
  useEffect(() => {
    const handler = (top: number) => {
      const viewport = viewportRef.current;
      if (viewport === null) return;
      viewport.scrollTop = top;
    };

    layoutManager.onScroll.add(handler);
    return () => layoutManager.onScroll.delete(handler);
  }, [layoutManager.onScroll, viewportRef]);

  const onScroll = useCallback(() => {
    const viewport = viewportRef.current;
    if (viewport === null || viewport.scrollTop === layoutManager.scrollTop)
      return;
    layoutManager.setScrollPosition(viewport.scrollTop);
  }, [layoutManager, viewportRef]);

  return (
    <div ref={viewportRef} className="list-view" onScroll={onScroll}>
      <div
        className="list-view-scroll"
        style={{ height: layout.scrollHeight }}
      />
      <Lineup
        layoutManager={layoutManager}
        rowLayouts={layout.rowLayouts}
        rowRender={props.rowRender}
        refreshRowHeight={props.refreshRowHeight}
      />
    </div>
  );
}

interface LineupProps {
  layoutManager: VirtualListLayoutManager;
  rowLayouts: RowLayout[];
  rowRender: Fn<[RowRenderProps], JSX.Element>;
  /**
   * 行の高さを再計算したい時に呼び出す
   */
  refreshRowHeight: SetOnlyTrigger<[]>;
}

function _Lineup(props: LineupProps) {
  const layoutManager = props.layoutManager;
  const linenupRef = useRef<HTMLDivElement | null>(null);

  const notifyRowSizes = useCallback(() => {
    const lineup = linenupRef.current;
    if (lineup === null || layoutManager.listViewLayout.visibleRowCount === 0)
      return;

    const newValues: [number, number][] = [];
    // for (let i = 0; i < layoutManager.listViewLayout.visibleRowCount; i++) {
    for (let i = 0; i < layoutManager.listViewLayout.visibleRowCount; i++) {
      const child = lineup.children[i] as HTMLElement;
      if (child == null) continue;
      const originalMinHeight = child.style.minHeight;
      child.style.minHeight = "";
      newValues.push([
        layoutManager.listViewLayout.rowLayouts[0].itemLayout.index + i,
        child.clientHeight,
      ]);
      child.style.minHeight = originalMinHeight;
    }
    layoutManager.changeRowHeight(newValues);
  }, [layoutManager, linenupRef]);

  useEffect(() => {
    props.refreshRowHeight.add(notifyRowSizes);
    window.addEventListener("resize", notifyRowSizes);
    return () => {
      window.removeEventListener("resize", notifyRowSizes);
      props.refreshRowHeight.delete(notifyRowSizes);
    };
  }, [notifyRowSizes, props.refreshRowHeight]);
  useLayoutEffect(() => {
    notifyRowSizes();
  }, [linenupRef, notifyRowSizes, props.rowLayouts]);

  return (
    <div ref={linenupRef} className="list-view-lineup">
      {props.rowLayouts.map((rowLayout) => {
        if (rowLayout.itemLayout.index === -1)
          return <div key={rowLayout.key} className="list-view-row-hidden" />;
        else return props.rowRender({ rowLayout });
      })}
    </div>
  );
}
const Lineup = React.memo(_Lineup) as typeof _Lineup;

// export function Linenup<TItem>({ layout, items }: LinenupProps<TItem>) {
//   return (
//     <>
//       {layout.rows.map(
//         ({ key, itemLayout: { height, index: itemIndex, top } }) => {
//           if (itemIndex === -1) {
//             return (
//               <div
//                 key={key}
//                 // className="list-view-row-hidden"
//                 // style={{
//                 //   background: itemIndex % 2 === 1 ? "#f0f0f0" : "#ffffff",
//                 //   top,
//                 //   height,
//                 // }}
//               />
//             );
//           } else {
//             return (
//               <div
//                 key={key}
//                 className="list-view-row"
//                 style={{
//                   top,
//                   height,
//                   background: itemIndex % 2 === 1 ? "#f0f0f0" : "#ffffff",
//                 }}
//               >
//                 {items[itemIndex]}, DOM-{key}
//               </div>
//             );
//           }
//         }
//       )}
//     </>
//   );
// }
