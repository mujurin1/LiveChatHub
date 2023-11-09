import { css } from "@emotion/react";
import { nanoid } from "nanoid";
import { useMemo } from "react";
import { useWidnowWidth } from "../hooks/useWidnowWidth";
import { useAppSelector } from "../store";
import { CommentViewBody, RowRender } from "./CommentViewBody";
import { CommentViewBodyState } from "./CommentViewBodyState";
import { CommentViewHeader } from "./CommentViewHeader";

import "./CommentView.css";

export * from "./CommentViewHeader";
export * from "./CommentViewBody";


export function CommentView() {
  const headerWidth = useWidnowWidth();
  const realityColumns = useAppSelector(state => state.header.columns)
    .map(x => x.width);
  const tempColumns = useAppSelector(state => state.header.columnsTemp)
    ?.map(x => x.width);

  const r = useMemo(() => ({ state: (null!) as CommentViewBodyState }), []);

  return (
    <div>
      <div
        css={css`
        display: flex;
        flex-flow: column;
        `}>
        <CommentViewHeader
          width={headerWidth}
          height={50}
        />
        <CommentViewBody
          height={450}
          rowRender={rowRender}
          stateRef={r}
        />
      </div>

      <div>
        <input type="number" id="input_text" />
        <button onClick={() => {
          r?.state?.addContent(nanoid(), 40);
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
  <div
    css={css`
    background-color: #b7e8fd;
    `}
  >
    {`key-${rowLayout.rowKey} / id-${rowLayout.contentId}`}
  </div>
);
