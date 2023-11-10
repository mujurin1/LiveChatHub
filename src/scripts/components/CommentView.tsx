import { css } from "@emotion/react";
import { nanoid } from "nanoid";
import { useMemo } from "react";
import { useWidnowSize } from "../hooks/useWidnowSize";
import { useAppSelector } from "../store";
import { VirtualList, RowRender, VirtualListState } from "./VirtualList";
import { CommentViewHeader } from "./CommentViewHeader";

import "./CommentView.css";

export * from "./CommentViewHeader";

export interface CommentViewProps {
  height: number;
  width: number;
}

let contentId = 0;
export function CommentView(props: CommentViewProps) {
  const realityColumns = useAppSelector(state => state.header.columns)
    .map(x => x.width);
  const tempColumns = useAppSelector(state => state.header.columnsTemp)
    ?.map(x => x.width);

  const r = useMemo(() => ({ state: (null!) as VirtualListState }), []);

  return (
    <div>
      <div className="comment-view-body">
        <CommentViewHeader
          width={props.width}
          height={50}
        />
        <VirtualList
          height={props.height}
          rowRender={rowRender}
          stateRef={r}
        />
      </div>

      <div>
        <input type="number" id="input_text" />
        <button onClick={() => {
          r?.state?.addContent(`${contentId++}`, 40);
        }}>追加</button>
        <div>
          {Math.random()}
        </div>
      </div>

      <div style={{ fontSize: 32 }}>
        <div>realityColumns: {realityColumns.join()}</div>
        <div>tempColumns: {tempColumns?.join() ?? "null"}</div>
      </div>

    </div>
  );
}

const rowRender: RowRender = ({ rowLayout }) => (
  <div className="comment-view-item"  >
    {`key-${rowLayout.rowKey} / id-${rowLayout.contentId}`}
  </div>
);
