import { useMemo, useState } from "react";
import { Header } from "./Header";
import { VirtualList, RowRender, useVirtualListState } from "@lch/virtual-list";
import { ColumnState, useHeaderState } from "./HeaderState";

import "./NCV_View.css";

export * from "./Header";

export interface NCV_ViewProps {
  height: number;
  width: number;
}

let contentId = 0;
export function NCV_View(props: NCV_ViewProps) {
  const [autoScroll, setAutoScroll] = useState(true);

  const state = useVirtualListState(props.height, autoScroll);
  const headerState = useHeaderState(props.width, 50);
  const realityColumns = headerState.headerColumns.map(x => x.width);
  const tempColumns = headerState.headerColumnsTemp?.map(x => x.width);

  const RowRender = useMemo(() => {
    return createCommentViewRow(headerState.headerColumns, headerState.headerColumnsTemp);
  }, [headerState.headerColumns, headerState.headerColumnsTemp]);


  return (
    <div>
      <div className="ncv-view-body">
        <Header
          state={headerState}
        />
        <VirtualList
          state={state}
          rowRender={RowRender}
        />
      </div>

      <div>
        <input type="number" id="input_text" />
        <button onClick={() => {
          state.addContent(`${contentId++}`);
        }}>追加</button>

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
          defaultChecked={state.__dbg_user_scroll_ref.current}
          onChange={e => state.__dbg_user_scroll_ref.current = e.target.checked}
        />
      </div>

      <div style={{ fontSize: 32 }}>
        <div>realityColumns: {realityColumns.join()}</div>
        <div>tempColumns: {tempColumns?.join() ?? "null"}</div>
      </div>

    </div>
  );
}

function createCommentViewRow(columns: ColumnState[], columnsTemp: ColumnState[] | null) {
  return function CommentViewRow({ contentId }: Parameters<RowRender>[0]) {
    const steColumn = columnsTemp ?? columns;

    return (
      <div className="ncv-view-item">
        {steColumn.map(state => (
          <div
            className="ncv-view-item-content"
            key={state.type}
            style={{ width: state.width }}
          >
            {`${state.type}${contentId} `}
          </div>
        ))}
      </div>
    );
  };
}
