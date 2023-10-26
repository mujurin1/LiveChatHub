import { Button } from "@mui/material";
import React, { useCallback, useState } from "react";
import { DemoLive } from "./DemoLive";

export interface DemoLiveConnectProps {
  demoLive: DemoLive;
}

export function DemoLiveConnect(props: DemoLiveConnectProps) {
  const { demoLive } = props;

  const [state, setState] = useState(0);

  const autoComment = useCallback(
    () => demoLive.switchAutoComment(),
    [demoLive]
  );

  return (
    <>
      <div>デモライブ 接続ビュー {Math.random()}</div>
      <div>state: {state}</div>
      <Button onClick={() => setState((s) => s + 1)} variant="contained">
        インクリメント
      </Button>
      <Button onClick={autoComment} variant="contained">
        自動コメント追加
      </Button>
      <Button
        onClick={async () => {
          await new Promise((resolve) => resolve({}));
          demoLive.newComments(1);
        }}
        variant="contained"
      >
        コメント追加
      </Button>
    </>
  );
}
