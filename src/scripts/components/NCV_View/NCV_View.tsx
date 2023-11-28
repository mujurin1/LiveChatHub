import { VirtualList } from "@lch/virtual-list";
import { NCV_ViewState } from "./NCV_ViewState";
import { NCV_Header } from "./NCV_Header";
import { useReceiveLiveItems } from "../../services/LiveManager";

import "./NCV_View.css";

export * from "./NCV_Header";
export * from "./NCV_ViewState";

export interface NCV_ViewProps {
  state: NCV_ViewState;
}

export function NCV_View({ state }: NCV_ViewProps) {
  // const state2 = useNCV_ViewState();
  useReceiveLiveItems((_, liveItems) => state.addLiveItems(liveItems));

  const {
    virtualListState,
    headerState,
    autoScroll,

    setRef,
    setAutoScroll,
    rowRender,
  } = state;

  const realityColumns = headerState.headerColumns.map(x => x.width);
  const tempColumns = headerState.headerColumnsTemp?.map(x => x.width);

  return (
    <>
      <div className="ncv-view-body" ref={setRef}>
        <NCV_Header
          state={headerState}
        />
        <VirtualList
          state={virtualListState}
          rowRender={rowRender}
        />
      </div>

      <div style={{ backgroundColor: "#64ffb9", flex: "0 0 70px" }}>
        <label htmlFor="autoScroll">自動スクロール</label>
        <input
          id="autoScroll"
          type="checkbox"
          checked={autoScroll}
          onChange={e => setAutoScroll(e.target.checked)}
        />

        <label htmlFor="userScroll">ユーザースクロール</label>
        <input
          id="userScroll"
          type="checkbox"
          defaultChecked={virtualListState.__dbg_user_scroll_ref.current}
          onChange={e => virtualListState.__dbg_user_scroll_ref.current = e.target.checked}
        />

        <div style={{ fontSize: 32 }}>
          <label>realityColumns: {realityColumns.join()}</label>
          {"　"}
          <label>tempColumns: {tempColumns?.join() ?? "null"}</label>
        </div>
      </div>
    </>
  );
}
