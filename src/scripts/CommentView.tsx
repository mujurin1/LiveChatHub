import { css } from "@emotion/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState, } from "react";
import { VirtualListLayoutManager } from "./components_/VirtualListLayoutManager";
import { RowRenderProps, VirtualListView } from "./components_/VirtualList";
import { UpdateVariation } from "./definition/LiveChatNotify";
import { dep } from "./service/dep";
import { ResizableAlign } from "@lch/component";
import { Trigger, assertNotNullish } from "@lch/common";

export function CommentView() {
  const chatStore = dep.getChatStore();
  const refreshRowHeight = useMemo(() => new Trigger<[]>(), []);
  const layoutManager = useMemo(() => new VirtualListLayoutManager(20, 0), []);

  const columnsMinWidth = useMemo(() => [30, 30, 30, 53, 30], []);
  const [columnsWidth, setColumnsWidth] = useState([60, 40, 60, 60, 0]);
  const [headerWidth, setHeaderWidth] = useState(800);

  const changeColumnWidth = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (widths: number[], index: number) => {
      setColumnsWidth(widths);
      refreshRowHeight.fire();
    },
    [refreshRowHeight]
  );

  useEffect(() => {
    const handler = (variation: UpdateVariation) => {
      if (variation === "Add") {
        layoutManager.setRowCount(chatStore.comments.length);
      } else if (variation === "Delete" || variation === "Update") {
        throw new Error(
          "VirturalListView コメントの更新：コメントの「削除・更新」は未実装です"
        );
      }
    };
    chatStore.changeCommentNotice.add(handler);
    return () => chatStore.changeCommentNotice.delete(handler);
  }, [chatStore.changeCommentNotice, chatStore.comments, layoutManager]);

  const notifyRowSizes = useCallback(() => {
    setHeaderWidth(window.innerWidth);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", notifyRowSizes);
    return () => window.removeEventListener("resize", notifyRowSizes);
  }, [notifyRowSizes]);

  useLayoutEffect(() => notifyRowSizes(), [notifyRowSizes]);

  const columCss = useMemo(
    () =>
      css`
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      `,
    []
  );

  return (
    <div
      css={css`
        display: flex;
        height: 100%;
        flex-flow: column;
      `}
    >
      <ResizableAlign
        minWidths={columnsMinWidth}
        defaultWidths={columnsWidth}
        flexIndex={4}
        confirmedPartition={changeColumnWidth}
        width={headerWidth}
        cssString={`
          width: 100%;
          background-color: #c8aef2;
          flex: none;
          height: 40px;
        `}

      >
        {[
          <div key="A" css={columCss}>コメ番</div>,
          <div key="B" css={columCss}>アイコン</div>,
          <div key="C" css={columCss}>ユーザー名</div>,
          <div key="D" css={columCss}>時間</div>,
          <div key="E" css={columCss}>コメント</div>,
        ]}
      </ResizableAlign>
      <div
        css={css`
          flex: auto;
        `}
      >
        <VirtualListView
          layoutManager={layoutManager}
          rowRender={useMemo(() => Row(columnsWidth), [columnsWidth])}
          refreshRowHeight={refreshRowHeight}
        />
      </div>
    </div>
  );
}

function Row(widths: number[]) {
  const _row = ({
    rowLayout: {
      key,
      itemLayout: { index, style },
    },
  }: RowRenderProps) => {
    const chatStore = dep.getChatStore();

    const comment = chatStore.comments.at(index);
    assertNotNullish(comment);
    const content = comment.content;
    const user = chatStore.users.get(comment.userGlobalId);
    assertNotNullish(user);
    const state = user.state;
    return (
      <div key={key} className="list-view-row" style={style}>
        <div
          css={css`
            width: ${widths[0]}px;
            text-align: right;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          `}
        >
          {`inde:${index}-key:${key}` /* content.no ?? "--" */}
        </div>
        {RowIcon(widths[1], state.userIconUrl)}
        <div
          css={css`
            width: ${widths[2]}px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            text-align: left;
          `}
        >
          {state.name}
        </div>
        {RowTime(content.time, widths[3])}
        <div
          css={css`
            width: ${0 /*widths[4] スクロールバー出現時の幅をフレックスなカラムで無理やり*/}px;
            flex-grow: 1;
            height: auto;
            min-width: 55px;
          `}
        >
          {content.text}
        </div>
      </div>
    );
  };
  return _row;
}

function RowIcon(width: number, imgSrc?: string) {
  if (imgSrc == null)
    return (
      <div
        css={css`
          width: ${width}px;
          padding: 0;
        `}
      />
    );
  else
    return (
      <img
        css={css`
          width: ${width}px;
          padding: 0;
          img {
            width: 100%;
            height: auto;
          }
        `}
        src={imgSrc}
      />
    );
}

function RowTime(time: number, width: number) {
  const date = new Date(time);
  const h = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();
  return (
    <div
      css={css`
        width: ${width}px;
        text-align: center;
      `}
    >{`${h}:${m}:${s}`}</div>
  );
}
