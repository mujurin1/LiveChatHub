import { useState } from "react";
import { useAppSelector } from "../store";
import { CommentViewHeader } from "./CommentViewHeader";
import { VirtualList, RowRender, useVirtualListState } from "@lch/virtual-list";

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

  const state = useVirtualListState(props.height, true);

  return (
    <div>
      <div className="comment-view-body">
        <CommentViewHeader
          width={props.width}
          height={50}
        />
        <VirtualList
          state={state}
          rowRender={CommentViewRow}
        />
      </div>

      <div>
        <input type="number" id="input_text" />
        <button onClick={() => {
          state.addContent(`${contentId++}`, 40);
          state.addContent(`${contentId++}`, 40);
          state.addContent(`${contentId++}`, 40);
          state.addContent(`${contentId++}`, 40);
          state.addContent(`${contentId++}`, 40);
          state.addContent(`${contentId++}`, 40);
        }}>追加</button>
      </div>

      <div style={{ fontSize: 32 }}>
        <div>realityColumns: {realityColumns.join()}</div>
        <div>tempColumns: {tempColumns?.join() ?? "null"}</div>
      </div>

    </div>
  );
}

const heightMap = new Map<string, number>();

function CommentViewRow({ contentId }: Parameters<RowRender>[0]) {
  const [height, setHeight] = useState(heightMap.get(contentId) ?? 40);//+ rowKey * 3);

  return (
    <div className="comment-view-item" style={{ height }} >
      <div>{`id-${contentId}  height:${height}`}</div>
      <input
        type="range"
        value={height}
        min={40}
        max={300}
        onChange={e => {
          heightMap.set(contentId, +e.target.value);
          setHeight(+e.target.value);
        }} />
    </div>
  );
}
