import React from "react";
import { DemoLive } from "./DemoLive";

export interface DemoLiveSendCommentProps {
  demoLive: DemoLive;
}

// 将来使うかもなので
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DemoLiveSendComment(props: DemoLiveSendCommentProps) {
  return (
    <>
      <div>デモライブ コメント送信ビュー {Math.random()}</div>
    </>
  );
}
