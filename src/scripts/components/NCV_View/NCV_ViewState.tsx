import { RowRender, useVirtualListState } from "@lch/virtual-list";
import { useState, useMemo, useEffect, useRef, useCallback, } from "react";
import { NCV_HeaderState, useHeaderState } from "./NCV_HeaderState";
import { LiveManager, liveManager } from "../../services/LiveManager";
import { LiveItem } from "../../Lives/LiveItem";
import { useResizeObserve } from "../../hooks/useElementSize";


export type NCV_ViewState = ReturnType<typeof useNCV_ViewState>;

export function useNCV_ViewState() {

  const {
    setRef,
    width,
    height,
  } = useResizeObserve();

  const [autoScroll, setAutoScroll] = useState(true);
  const headerState = useHeaderState(width, 50);
  const virtualListState = useVirtualListState();
  // const virtualListState = useVirtualListState(height - 50, autoScroll);

  useEffect(() => {
    virtualListState.dispatch(
      virtualListState.value.setViewportHeight(height - 50)
    );
  }, [virtualListState, height]);
  useEffect(() => {
    virtualListState.dispatch(
      virtualListState.value.setAutoScroll(autoScroll)
    );
  }, [virtualListState, autoScroll]);

  const rowRender = useMemo(() => createCommentViewRow(liveManager, headerState), [headerState]);

  const addLiveItems = (liveItems: LiveItem[]) => {
    virtualListState.dispatch(
      virtualListState.value.addContents(liveItems.map(item => item.id))
      // virtualListState.value.addContents(liveItems.map(item => item.id))
    );
  };

  return {
    setRef,

    virtualListState,
    headerState,
    autoScroll,

    setAutoScroll,
    rowRender,

    addLiveItems,
  };
}

function createCommentViewRow(liveManager: LiveManager, headerState: NCV_HeaderState) {
  const steColumns = headerState.headerColumnsTemp ?? headerState.headerColumns;

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
