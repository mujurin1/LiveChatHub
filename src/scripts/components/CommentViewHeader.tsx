
import { useState, useCallback, useEffect } from "react";
import React from "react";
import { css } from "@emotion/react";
import { useDispatch } from "react-redux";
import { ColumnState, setColumnsTemp, setWidth, setWidthAndFlexWidth } from "../slices/headerSlice";
import { useAppSelector } from "../store";

import "./CommentView.css";

const minWidth = 20;

export interface CommentViewHeaderProps {
  /**
   * ヘッダーの幅
   */
  width: number;
  /**
   * ヘッダーの高さ
   */
  height: number;
}

export function CommentViewHeader(props: CommentViewHeaderProps) {
  const columnsTemp = useAppSelector(state => state.header.columnsTemp);
  const { headerColumns, partitionMouseDown } = useCommentViewHeaderState(props.width);
  const lastIndex = headerColumns.length - 1;

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
      {(columnsTemp ?? headerColumns).map((column, i) => (
        <div
          key={column.type}
          css={css`
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          width: ${column.width}px;
          user-select: none;
          min-width: ${minWidth}px;
          `}
        >
          <div className="comment-view-header-item">{column.type}</div>
          {i === lastIndex ? undefined :
            <div
              className="comment-view-header-partition"
              onMouseDown={e => partitionMouseDown(e, i)}
            />}
        </div>
      ))}
    </div>
  );
}

function useCommentViewHeaderState(width: number) {
  const [resizeTemp, setResizeTemp] = useState<ResizeTemp | null>(null);
  const [resetedPartionEvent, setResetedPartionEvent] = useState(false);
  const [removeEventListener, setRemoveEventListener] = useState<(() => void) | null>(null);

  const columnsTemp = useAppSelector(state => state.header.columnsTemp);
  const headerColumns = useAppSelector(state => state.header.columns);
  const flexIndex = useAppSelector(state => state.header.flexIndex);
  const dispatch = useDispatch();

  // 横幅の再調整
  useEffect(() => {
    const oldWidth = headerColumns.reduce((s, v) => s - v.width, width);
    if (oldWidth === 0) return;

    const flexWidth = headerColumns[flexIndex].width + oldWidth;
    dispatch(setWidth(flexIndex, flexWidth));
  }, [dispatch, flexIndex, headerColumns, width]);

  useEffect(
    () => {
      if (!resetedPartionEvent || resizeTemp == null || columnsTemp == null) return;
      setResetedPartionEvent(false);

      const changeWidths = (clientX: number, isFinish: boolean): void => {
        /** 幅の変化量 */
        let amount = clientX - resizeTemp.startX;
        if (amount === 0) return;

        if (!resizeTemp.left) amount *= -1;

        let width = resizeTemp.startTargetWidth + amount;
        let flexWidth = resizeTemp.startFlexWidth - amount;

        const limit = width - minWidth;
        if (limit < 0) {
          width -= limit;
          flexWidth += limit;
        } else {
          const flexLimit = flexWidth - minWidth;
          if (flexLimit < 0) {
            width += flexLimit;
            flexWidth -= flexLimit;
          }
        }

        if (isFinish) {
          dispatch(setWidthAndFlexWidth(resizeTemp.index, width, flexWidth));
        } else {
          const columns = [...columnsTemp];
          columns[resizeTemp.index] = {
            ...columns[resizeTemp.index],
            width,
          };
          columns[flexIndex] = {
            ...columns[flexIndex],
            width: flexWidth,
          };
          columns[flexIndex].width = flexWidth;
          dispatch(setColumnsTemp(columns));
        }
      };

      const onMouseMove = (e: MouseEvent) => {
        changeWidths(e.clientX, false);
      };

      const onMouseUp = (e: MouseEvent) => {
        changeWidths(e.clientX, true);
        setResizeTemp(null);
        dispatch(setColumnsTemp(null));

        removeEventListener();
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);

      const removeEventListener = () => {
        setRemoveEventListener(null);

        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      setRemoveEventListener(() => removeEventListener);
    },
    [dispatch, flexIndex, resizeTemp, columnsTemp, resetedPartionEvent]
  );

  const partitionMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) => {
      removeEventListener?.();

      const left = index < flexIndex;
      if (!left) index++;

      setResizeTemp({
        index,
        startTargetWidth: headerColumns[index].width,
        startFlexWidth: headerColumns[flexIndex].width,
        startX: e.clientX,
        left,
      });
      dispatch(setColumnsTemp(headerColumns));

      setResetedPartionEvent(true);
    },
    [dispatch, flexIndex, headerColumns, removeEventListener]
  );

  return {
    headerColumns,
    partitionMouseDown,
  };
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

interface LogicTemp {
  resize: ResizeTemp;
  columns: ColumnState[];
}
