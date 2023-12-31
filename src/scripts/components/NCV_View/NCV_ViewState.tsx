import { RowRender, VirtualListState, virtualListStateSlice } from "@lch/virtual-list";
import { useState, useMemo } from "react";
import { LiveManager, liveManager } from "../../services/LiveManager";
import { LiveItem } from "../../Lives/LiveItem";
import { useResizeObserve } from "../../hooks/useElementSize";
import { useSliceState } from "@lch/common";
import { NCV_HeaderState, SCROLL_BAR_WIDTH, ncv_HeaderStateSlice } from "./NCV_HeaderState";


export type VirtualListStateSet = [VirtualListState, React.Dispatch<React.SetStateAction<VirtualListState>>];

export type NCV_ViewState = ReturnType<typeof useNCV_ViewState>;
export function useNCV_ViewState() {
  const {
    setRef,
    width,
    height,
  } = useResizeObserve();

  const [autoScroll, setAutoScroll] = useState(true);
  // const headerState = useHeaderState(width, 50);
  const [headerState, headerStateActions] = useSliceState(ncv_HeaderStateSlice);
  const [virtualListState, virtualListActions] = useSliceState(virtualListStateSlice);

  if (width - SCROLL_BAR_WIDTH !== headerState.width)
    headerStateActions.setHeaderWidth(width);
  if (height - 50 !== virtualListState.viewportHeight)
    virtualListActions.setViewportHeight(height - 50);
  if (autoScroll !== virtualListState.autoScroll)
    virtualListActions.setAutoScroll(autoScroll);
  // useEffect(() => {
  //   actions.setViewportHeight(height - 50);
  // }, [actions, height]);
  // useEffect(() => {
  //   actions.setAutoScroll(autoScroll);
  // }, [actions, autoScroll]);

  const rowRender = useMemo(() => createCommentViewRow(liveManager, headerState), [headerState]);

  const addLiveItems = (liveItems: LiveItem[]) => {
    virtualListActions.addContents(liveItems.map(item => item.id));
  };



  return {
    setRef,

    virtualListState,
    virtualListActions,
    headerState,
    headerStateActions,
    autoScroll,

    setAutoScroll,
    rowRender,

    addLiveItems,
  };
}

function createCommentViewRow(liveManager: LiveManager, headerState: NCV_HeaderState) {
  // const steColumns = headerState.headerColumnsTemp ?? headerState.headerColumns;
  const steColumns = headerState.columns;

  return function RowRender({ contentId }: Parameters<RowRender>[0]) {
    const item = liveManager.getLiveItem(contentId);
    const comment = item.content;

    return (
      <div className="ncv-view-item" style={{ minHeight: 40 }}>
        {steColumns.map(state => (
          <div
            className="ncv-view-item-content"
            key={state.type}
            style={{ width: state.width }}
          >
            {(
              comment == null ? "NULL" :
                state.type === "item-id" ? contentId :
                  state.type === "name" ? comment.userName :
                    state.type === "time" ? comment.time.toLocaleTimeString() :
                      state.type === "content" ?
                        `mgdId:${item.id & 0xFF}  index:${item.id >> 0x8}` : ""
            )}
          </div>
        ))}
      </div>
    );
  };
}
