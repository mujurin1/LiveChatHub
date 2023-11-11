import { createRoot } from "react-dom/client";
import { Button, Dialog, css } from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Provider } from "react-redux";
import { CommentView } from "./components/CommentView";
import { Connection } from "./components_/Connection";
import { LiveError } from "./definition/model/LiveError";
import { dep } from "./service/dep";
import { store } from "./store";
import { useWidnowSize } from "./hooks/useWidnowSize";

import "../styles/index.css";

createRoot(document.getElementById("root")!)
  .render(
    <React.StrictMode>
      <Provider store={store}>
        {/* <IndexComponent /> */}
        <TestComponent />
        {/* <XComponent /> */}
      </Provider>
    </React.StrictMode>
  );


const viewportHeight = 400;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function XComponent() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollObjRef = useRef<HTMLImageElement>(null);
  const [scrObjHeight, setScrObjHeight] = useState(500);
  const [isAddComment, setIsAddComment] = useState(false);

  useEffect(() => {
    const target = scrollRef.current;
    if (target == null) return;

    const scrollEvent = (e: Event) => {
      // console.log("                        スクロールイベント");
    };
    target.addEventListener("scroll", scrollEvent);

    const wheelEvent = (e: WheelEvent) => {
      // console.log(`スクロール: WHEEL    ${scrollRef.current?.scrollTop}`);
    };
    target.addEventListener("wheel", wheelEvent);
    return () => {
      target.removeEventListener("wheel", wheelEvent);
      target.removeEventListener("scroll", scrollEvent);
    };
  }, [scrObjHeight]);

  useEffect(() => {
    if (!isAddComment) return;

    const add = () => {

      const scroll = scrollRef.current;
      const scrollObj = scrollObjRef.current;
      if (scroll == null || scrollObj == null) return;

      const add = 10;
      setScrObjHeight(scrObjHeight + add);
      // ======= ここで要素の高さを直接変更する必要がある =======
      scrollObj.style.height = `${scrObjHeight + add}px`;


      const bottom = (scrObjHeight) - viewportHeight;
      // console.log(`(scrObjHeight) - viewportHeight = bottom`);
      // console.log(`(${scrObjHeight}) - ${viewportHeight} = ${bottom}`);
      // console.log("scroll.scrollTop", scroll.scrollTop);


      const isAutoScroll = bottom === scroll.scrollTop;

      if (!isAutoScroll) return;

      // console.log("スクロール:        AUTO");
      scroll.scrollTop = bottom + add;
    };
    // const clear = setInterval(add, 300);
    const clear = setInterval(add, 1);

    return () => clearInterval(clear);
  }, [isAddComment, scrObjHeight]);

  const scrollTo = useCallback((y: number) => {
    const target = scrollRef.current;
    if (target == null) return;

    // target.scrollTo(0, y);
    target.scrollTop = target.scrollHeight;
  }, []);

  return (
    <>
      <div
        ref={scrollRef}
        css={css`
        height: ${viewportHeight}px;
        overflow: auto;
        `}
      >
        <div
          ref={scrollObjRef}
          css={css`
          height: ${scrObjHeight}px;
          width: 200px;
          `}
        />

        {/* <img
          ref={scrollObjRef}
          css={css`
          height: ${scrObjHeight}px;
          width: 200px;
          `}
          src="https://img.freepik.com/free-photo/vertical-shot-old-fishing-boats-turned-upside-down-gloomy-sky_181624-39284.jpg?w=740&t=st=1699424432~exp=1699425032~hmac=a6e4f89a21aa022e1237485f87f7b3e654dc75adee71502f36da0f7f07fbba1c"
        /> */}
      </div>

      <button onClick={() => scrollTo(0)}>Top</button><br />
      <button onClick={() => scrollTo(398 / 2)}>center</button><br />
      <button onClick={() => scrollTo(398)}>center</button><br />
      <button onClick={() => setIsAddComment(x => !x)}>コメント自動追加 {isAddComment ? "TRUE" : "FALSE"}</button>
    </>
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
  const { windowWidth, windowHeight } = useWidnowSize();

  return (
    <div>
      <CommentView
        height={windowHeight - 200}
        width={windowWidth}
      />
    </div>
  );
}
