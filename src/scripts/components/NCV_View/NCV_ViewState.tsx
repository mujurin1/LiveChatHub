import { RowRender, useVirtualListState } from "@lch/virtual-list";
import { useState, useMemo } from "react";
import { ColumnState, NCV_HeaderState, useHeaderState } from "./NCV_HeaderState";
import { SampleSiteComment } from "../../connectors/SampleSiteConnector";
import { FeedData } from "../../connectors/FeedData";


export type NCV_ViewState = ReturnType<typeof useNCV_ViewState>;

export function useNCV_ViewState(height: number, width: number, feedDatas: FeedData[]) {
  // 後で無くすコメント欄下のエリア分引いておく
  height -= 70;

  const [autoScroll, setAutoScroll] = useState(true);

  const headerState = useHeaderState(width, 50);
  const virtualListState = useVirtualListState(height - 50, autoScroll);

  const rowRender = useMemo(() => createCommentViewRow(feedDatas, headerState), [feedDatas, headerState]);

  const addComments = (ids: number[]) => {
    virtualListState.addContents(ids);
  };

  return {
    virtualListState,
    headerState,
    autoScroll,

    setAutoScroll,
    rowRender,

    addComments,
  };
}

function createCommentViewRow(feedDatas: FeedData[], headerState: NCV_HeaderState) {
  const steColumns = headerState.headerColumnsTemp ?? headerState.headerColumns;

  return function RowRender({ contentId }: Parameters<RowRender>[0]) {
    const feedData = feedDatas[contentId];
    const comment = feedData.content;

    return (
      <div className="ncv-view-item" style={{ minHeight: 40 }}>
        {steColumns.map(state => (
          <div
            className="ncv-view-item-content"
            key={state.type}
            style={{ width: state.width }}
          >
            {
              comment == null ? "NULL" :
                state.type === "global-id" ? contentId :
                  state.type === "name" ? comment.userName :
                    state.type === "time" ? comment.time.toLocaleTimeString() :
                      state.type === "content" ? comment.message :
                        ""
            }
          </div>
        ))}
      </div>
    );
  };
}

// function NCV_Comment({ columnState, comment }: {columnState: ColumnState, comment: SampleSiteComment}) {
//   const [x, setX] = useState("");

//   return (
//     <>
//       {comment}
//       {/* {`${columnState.type}${contentId} `} */}
//       {/* <input type="text" style={{ width: 80 }} value={x} onChange={e => setX(e.target.value)} /> */}
//     </>
//   );
// }
