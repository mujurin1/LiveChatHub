import { RowRender, useVirtualListState } from "@lch/virtual-list";
import { useState, useMemo } from "react";
import { NCV_HeaderState, useHeaderState } from "./NCV_HeaderState";
import { NCV_CommentProps } from "./NCV_View";


export type NCV_ViewState = ReturnType<typeof useNCV_ViewState>;
export function useNCV_ViewState(height: number, width: number) {
  const [autoScroll, setAutoScroll] = useState(true);

  const virtualListState = useVirtualListState(height, autoScroll);
  const headerState = useHeaderState(width, 50);

  const rowRender = useMemo(() => createCommentViewRow(headerState), [headerState]);

  return {
    virtualListState,
    headerState,
    autoScroll,

    setAutoScroll,
    rowRender,
  };
}

function createCommentViewRow(headerState: NCV_HeaderState) {
  const steColumns = headerState.headerColumnsTemp ?? headerState.headerColumns;

  return function RowRender({ contentId }: Parameters<RowRender>[0]) {
    return (
      <div className="ncv-view-item" style={{ minHeight: 40 }}>
        {steColumns.map(state => (
          <div
            className="ncv-view-item-content"
            key={state.type}
            style={{ width: state.width }}
          >
            <NCV_Comment columnState={state} contentId={contentId} />
          </div>
        ))}
      </div>
    );
  };
}

function NCV_Comment({ columnState, contentId }: NCV_CommentProps) {
  const [x, setX] = useState("");

  return (
    <>
      {`${columnState.type}${contentId} `}
      <input type="text" style={{ width: 80 }} value={x} onChange={e => setX(e.target.value)} />
    </>
  );
}
