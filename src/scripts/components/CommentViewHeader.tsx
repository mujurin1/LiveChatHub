import { useState, useMemo, useCallback, useLayoutEffect } from "react";
import React from "react";
import { css } from "@emotion/react";

import "./CommentView.css";


export interface CommentViewHeaderState {
  /**
   * 各列の幅
   */
  widths: number[];
  /**
   * 他の要素によって幅が縮む列のインデックス
   */
  flexIndex: number;
}


export interface CommentViewHeaderProps {
  state: CommentViewHeaderState;

  /**
   * ヘッダーの幅
   */
  width: number;
  /**
   * ヘッダーの高さ
   */
  height: number;

  /**
   * 各列の幅を変更する
   * @param newWidths 各列の幅
   * @param index 動かしたパーティションのインデックス
   * @param isLast 幅の変更は連続して行われるのでそれが今回で終わるか
   */
  setWidths: (newWidths: number[], index: number, isLast: boolean) => void;
}

const minWidths = [20, 20, 20, 20];
const headerElements = [
  <div key="A" className="comment-view-header-item">アイコン</div>,
  <div key="B" className="comment-view-header-item">ユーザーID</div>,
  <div key="C" className="comment-view-header-item">時間</div>,
  <div key="D" className="comment-view-header-item">コメント</div>,
];

export function CommentViewHeader(props: CommentViewHeaderProps) {
  const state = props.state;
  const widths = state.widths;
  const setWidths = props.setWidths;
  const [temp, setTemp] = useState<ResizeTemp | null>(null);

  useMemo(() => {
    let flexWidth = props.width;
    for (let i = 0; i < widths.length; i++) {
      if (i === state.flexIndex) continue;
      flexWidth -= widths[i];
    }
    if (widths[state.flexIndex] === flexWidth) return;
    widths[state.flexIndex] = flexWidth;
    setWidths([...widths], state.flexIndex, true);
  }, [state.flexIndex, props.width, setWidths, widths]);

  const changeWidths = useCallback(
    (clientX: number, isLast: boolean): boolean => {
      if (temp == null) return false;
      /** 幅の変化量 */
      let amount = clientX - temp.startX;
      if (amount === 0) return false;
      if (!temp.left) amount *= -1;

      widths[temp.index] = temp.startTargetWidth + amount;
      widths[state.flexIndex] = temp.startFlexWidth - amount;

      const limit = widths[temp.index] - minWidths[temp.index];
      if (limit < 0) {
        widths[temp.index] -= limit;
        widths[state.flexIndex] += limit;
      } else {
        const limit = widths[state.flexIndex] - minWidths[state.flexIndex];
        if (limit < 0) {
          widths[temp.index] += limit;
          widths[state.flexIndex] -= limit;
        }
      }

      setWidths([...widths], temp.index, isLast);

      return true;
    },
    [temp, widths, state.flexIndex, setWidths]
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) => {
      const left = index < state.flexIndex;
      if (!left) index++;
      setTemp({
        index,
        startTargetWidth: widths[index],
        startFlexWidth: widths[state.flexIndex],
        startX: e.clientX,
        left,
      });
    },
    [state.flexIndex, widths]
  );

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (temp == null) return;

      changeWidths(e.clientX, false);
    },
    [changeWidths, temp]
  );

  const onMouseUp = useCallback(
    (e: MouseEvent) => {
      if (temp == null) return;

      changeWidths(e.clientX, true);
      setTemp(null);
    },
    [changeWidths, temp]
  );

  const childElement = useMemo<React.ReactElement[]>(
    () => {
      const lastIndex = headerElements.length - 1;
      const elements: React.ReactElement[] = [];

      for (let i = 0; i < headerElements.length; i++) {
        elements.push(
          <React.Fragment key={i}>
            <div
              css={css`
              position: relative;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100%;
              width: ${widths[i]}px;
              user-select: none;
              min-width: ${minWidths[i]}px;
              `}
            >
              {headerElements[i]}
              {i === lastIndex ? undefined :
                <div
                  css={css`
                  position: absolute;
                  top: 0;
                  right: 0;
                  width: 1px;
                  height: 100%;
                  background-color: #999;
                  user-select: none;
                  cursor: col-resize;
                  ::before {
                    content: "";
                    position: absolute;
                    min-width: 15px;
                    transform: translateX(-50%);
                    z-index: 1;
                    height: 100%;
                  }
                  `}
                  onMouseDown={(e) => onMouseDown(e, i)}
                />}
            </div>
          </React.Fragment>
        );
      }

      return elements;
    },
    [onMouseDown, widths]
  );

  useLayoutEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  return (
    <div
      css={css`
      display: flex;
      align-items: center;
      text-align: center;
      background-color: #ccc;
      height: ${props.height}px;
      `}
    >
      {childElement}
    </div>
  );
}

interface ResizeTemp {
  /**
   * ターゲットのインデックス
   */
  index: number;
  /**
   * 開始時のターゲットのカラムの幅
   */
  startTargetWidth: number;
  /**
   * 開始時のフレックスカラムの幅
   */
  startFlexWidth: number;
  /**
   * 開始時のマウス座標X
   */
  startX: number;
  /**
   * フレックスカラムより左か
   */
  left: boolean;
}
