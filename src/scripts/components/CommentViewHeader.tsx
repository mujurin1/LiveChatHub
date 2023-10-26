// import { css } from "@emotion/react";
import { ResizableAlign } from "@lch/component";
import { useState, useMemo } from "react";

import "./CommentView.css";

export interface CommentViewHeaderProps {
  /**
   * ヘッダーの幅
   */
  width: number;
  /**
   * ヘッダーの高さ
   */
  height: number;

  /**
   * パーティションがドラッグされて動いた
   * @param widths 変更後の幅
   * @param index 変更されたインデックス
   */
  movingPartition?: (widths: number[], index: number) => void;
  /**
   * パーティションがドラッグして離された
   * @param widths 変更後の幅
   * @param index 変更されたインデックス
   * @param changed パーティションの幅は変更されたか (同じ位置でドラッグ終了したら `false`)
   */
  confirmedPartition?: (widths: number[], index: number, changed: boolean) => void;
}

export function CommentViewHeader(props: CommentViewHeaderProps) {
  const [defaultWidths, _setDefaultWidths] = useState([100, 100, 100, props.width - 500]);
  const minWidths = useMemo(() => [20, 20, 20, 20], []);

  return (
    <ResizableAlign
      minWidths={minWidths}
      defaultWidths={defaultWidths}
      flexIndex={3}
      movingPartition={props.movingPartition}
      confirmedPartition={props.confirmedPartition}
      width={props.width}
      cssString={`
      background-color: #ccc;
      height: ${props.height}px;
      `}
    >
      {[
        <div key="A" className="comment-view-header-item">アイコン</div>,
        <div key="B" className="comment-view-header-item">ユーザーID</div>,
        <div key="C" className="comment-view-header-item">時間</div>,
        <div key="D" className="comment-view-header-item">コメント</div>,
      ]}
    </ResizableAlign>
  );
}
