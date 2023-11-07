import { createRoot } from "react-dom/client";
import { Button, Dialog, css } from "@mui/material";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Provider } from "react-redux";
import { CommentView } from "./CommentView";
import { Connection } from "./components_/Connection";
import { LiveError } from "./definition/model/LiveError";
import { dep } from "./service/dep";
import { CommentViewHeader } from "./components/CommentViewHeader";
import { CommentViewBody, CommentViewBodyState, RowRender } from "./components/CommentViewBody";
import { useWidnowWidth } from "./hooks/useWidnowWidth";
import { store, useAppSelector } from "./store";

import "../styles/index.css";
import { nanoid } from "@reduxjs/toolkit";

createRoot(document.getElementById("root")!)
  .render(
    <React.StrictMode>
      <Provider store={store}>
        {/* <IndexComponent /> */}
        {/* <TestComponent /> */}
        <XComponent />
      </Provider>
    </React.StrictMode>
  );


function XComponent() {
  const [value, setValue] = useState(10);
  const ref = useRef(value);

  return (
    <div>
      {ref.current}
      <button onClick={() => setValue(x => x + 1)}>クリック: {value}</button>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function IndexComponent() {
  const liveStore = dep.getLiveStore();
  const [errors, setErrors] = useState<LiveError[]>([]);

  useEffect(() => {
    const fn = (error: LiveError) => setErrors([...errors, error]);
    liveStore.onError.add(fn);
    return () => liveStore.onError.delete(fn);
  }, [liveStore, errors]);

  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);

  return (
    <div
      css={css`
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      `}
    >
      <div
        css={css`
        background: cyan;
        flex: 0 0 60px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 0 32px;
        `}
      >
        <div>
          ヘッダービュー
          <br />
          {`${errors.at(-1)?.livePlatformId ?? "(undefined)"}\n${errors.at(-1)?.errorMessage ?? "(undefined)"}`}
        </div>
        <Button onClick={() => setIsConnectionDialogOpen(true)} variant="contained">接続</Button>
      </div>
      <div
        css={css`
        background-color: chocolate;
        width: 100%;
        flex: 1 1 0;
        `}
      >
        <CommentView />
      </div>
      <div
        css={css`
        background-color: orange;
        width: 100%;
        flex: 0 0 100px;
        `}
      >
        {/* <SendComment /> */}
        <div>コメント送信</div>
      </div>
      <Dialog open={isConnectionDialogOpen} onClose={() => setIsConnectionDialogOpen(false)}>
        <Connection />
      </Dialog>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TestComponent() {
  const headerWidth = useWidnowWidth();
  const realityColumns = useAppSelector(state => state.header.columns)
    .map(x => x.width);
  const tempColumns = useAppSelector(state => state.header.columnsTemp)
    ?.map(x => x.width);

  const r = useMemo(() => ({ state: (null!) as CommentViewBodyState }), []);

  const [, set] = useState(0);

  return (
    <div>
      <div
        css={css`
        display: flex;
        flex-flow: column;
        height: 450px;
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
        <input type="text" id="input_text" />
        <button onClick={() => {
          r?.state?.addRowItem(nanoid());
          set(x => ~x);
        }}>追加</button>
        <div>
          全体の高さ: {r?.state?.sum}
        </div>
      </div>

      <div style={{ fontSize: 32 }}>
        <div>realityColumns: {realityColumns.join()}</div>
        <div>tempColumns: {tempColumns?.join() ?? "null"}</div>
      </div>

    </div>
  );
}

const rowRender: RowRender = (key, id) => <div>{`${key} - ${id}`}</div>;
