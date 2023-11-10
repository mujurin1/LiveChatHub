import { useMemo, useState } from "react";
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
          rowRender={CommentViewRow}
          stateRef={r}
        />
      </div>

      <div>
        <input type="number" id="input_text" />
        <button onClick={() => {
          r.state.addContent(`${contentId++}`, 40);
          r.state.addContent(`${contentId++}`, 40);
          r.state.addContent(`${contentId++}`, 40);
          r.state.addContent(`${contentId++}`, 40);
          r.state.addContent(`${contentId++}`, 40);
          r.state.addContent(`${contentId++}`, 40);
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

function CommentViewRow({ rowLayout }: Parameters<RowRender>[0]) {
  // const [height, setHeight] = useState(40);
  const [height, setHeight] = useState(heightMap.get(rowLayout.contentId) ?? 40);//+ rowLayout.rowKey * 3);

  return (
    <div className="comment-view-item" style={{ height }} >
      <div>{`key-${rowLayout.rowKey} / id-${rowLayout.contentId}  height:${height}`}</div>
      <input
        type="range"
        value={height}
        min={40}
        max={300}
        onChange={e => {
          console.log(rowLayout.contentId, +e.target.value);

          heightMap.set(rowLayout.contentId, +e.target.value);
          setHeight(+e.target.value);
        }} />
    </div>
  );
}
