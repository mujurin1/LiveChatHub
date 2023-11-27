import { RowRender, useVirtualListState } from "@lch/virtual-list";
import { useState, useMemo } from "react";
import { NCV_HeaderState, useHeaderState } from "./NCV_HeaderState";
import { LiveManager } from "../../Lives/LiveManager";
import { LiveItem } from "../../Lives/LiveItem";


export type NCV_ViewState = ReturnType<typeof useNCV_ViewState>;

export function useNCV_ViewState(height: number, width: number, liveManager: LiveManager) {
  // 後で無くすコメント欄下のエリア分引いておく
  height -= 70;

  const [autoScroll, setAutoScroll] = useState(true);

  const headerState = useHeaderState(width, 50);
  const virtualListState = useVirtualListState(height - 50, autoScroll);

  const rowRender = useMemo(() => createCommentViewRow(liveManager, headerState), [liveManager, headerState]);

  const addLiveItems = (liveItems: LiveItem[]) => {
    virtualListState.addContents(liveItems.map(item => item.id));
  };

  return {
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
