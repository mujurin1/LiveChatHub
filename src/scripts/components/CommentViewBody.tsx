import { css } from "@emotion/react";
import "./CommentView.css";

export function CommentViewBody() {
  const rows = [
    <CommentViewRow key="A" />,
    <CommentViewRow key="B" />,
  ];

  return (
    <div>
      {rows}
    </div>
  );
}

function CommentViewRow() {


  return (
    <div
      css={css`
      display: flex;
      align-items: center;
      text-align: center;
      height: 40px;
      `}
    >
      <CommentViewRowItem key="A" />
      <CommentViewRowItem key="B" />
      <CommentViewRowItem key="C" />
      <CommentViewRowItem key="D" />
    </div>
  );
}

function CommentViewRowItem() {
  return (
    <div
      css={css`
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      width: 100px;
      user-select: none;
      `}
    >
      Item
    </div>
  );
}