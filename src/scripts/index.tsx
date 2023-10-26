import { createRoot } from "react-dom/client";
import { Button, Dialog, css } from "@mui/material";
import React, { useEffect, useState } from "react";
import { CommentView } from "./CommentView";
import { Connection } from "./components_/Connection";
import { LiveError } from "./definition/model/LiveError";
import { dep } from "./service/dep";
import { useWidnowWidth } from "@lch/component";
import { CommentViewHeader } from "./components/CommentViewHeader";
import { CommentViewBody } from "./components/CommentViewBody";

createRoot(document.getElementById("root")!)
  .render(
    <React.StrictMode>
      {/* <IndexComponent /> */}
      <TestComponent />
    </React.StrictMode>
  );

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
  // const headerWidth = useWidnowWidth();
  const headerWidth = useWidnowWidth();

  return (
    <div>
      <CommentViewHeader
        width={headerWidth}
        height={50}
      />
      <CommentViewBody />
    </div>
  );
}





