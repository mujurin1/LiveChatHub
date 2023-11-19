import { useCallback, useEffect, useState } from "react";

export type ColumnType = "no" | "icon" | "name" | "time" | "content" | "info";
export type ColumnState = { type: ColumnType; width: number; };

export interface HeaderColumnState {
  columns: ColumnState[];
  columnsTemp: ColumnState[] | null;
  flexIndex: number;
}

export const HEADER_COL_MIN_WIDTH = 20;
export const SCROLL_BAR_WIDTH = 10;

const initialHeaderColumnState: HeaderColumnState = {
  columns: [
    { type: "icon", width: 100 },
    { type: "name", width: 100 },
    { type: "time", width: 100 },
    { type: "content", width: 100 },
  ],
  columnsTemp: null,
  flexIndex: 3,
};

export type HeaderState = ReturnType<typeof useHeaderState>;

export interface HeaderProps {
  /**
   * ヘッダーの幅
   */
  width: number;
  /**
   * ヘッダーの高さ
   */
  height: number;
}

export function useHeaderState(headerWidth: number, headerHeight: number) {
  const columnWidth = headerWidth - SCROLL_BAR_WIDTH;

  //#region HeaderColumnState の設定
  const [headerColumns, setHeaderColumns] = useState(initialHeaderColumnState.columns);
  const [headerColumnsTemp, setHeaderColumnsTemp] = useState(initialHeaderColumnState.columnsTemp);
  const [flexIndex] = useState(initialHeaderColumnState.flexIndex);

  const setWidth = useCallback((index: number, width: number) => {
    setHeaderColumns(oldState => {
      const newState = oldState.slice();
      newState[index].width = width;
      return newState;
    });
  }, []);

  const setWidthAndFlexWidth = useCallback((index: number, width: number, flexWidth: number) => {
    setHeaderColumns(oldState => {
      const newState = oldState.slice();
      newState[index].width = width;
      newState[flexIndex].width = flexWidth;
      return newState;
    });
  }, [flexIndex]);
  //#endregion HeaderColumnState の設定


  const [resizeTemp, setResizeTemp] = useState<ResizeTemp | null>(null);
  const [resetedPartionEvent, setResetedPartionEvent] = useState(false);
  const [removeEventListener, setRemoveEventListener] = useState<(() => void) | null>(null);

  // 横幅の再調整
  useEffect(() => {
    const oldWidth = headerColumns.reduce((s, v) => s - v.width, columnWidth);
    if (oldWidth === 0) return;

    const flexWidth = headerColumns[flexIndex].width + oldWidth;
    setWidth(flexIndex, flexWidth);
  }, [setWidth, flexIndex, headerColumns, columnWidth]);

  useEffect(() => {
    if (!resetedPartionEvent || resizeTemp == null || headerColumnsTemp == null) return;
    setResetedPartionEvent(false);

    const changeWidths = (clientX: number, isFinish: boolean): void => {
      /** 幅の変化量 */
      let amount = clientX - resizeTemp.startX;
      if (amount === 0) return;

      if (!resizeTemp.left) amount *= -1;

      let width = resizeTemp.startTargetWidth + amount;
      let flexWidth = resizeTemp.startFlexWidth - amount;

      const limit = width - HEADER_COL_MIN_WIDTH;
      if (limit < 0) {
        width -= limit;
        flexWidth += limit;
      } else {
        const flexLimit = flexWidth - HEADER_COL_MIN_WIDTH;
        if (flexLimit < 0) {
          width += flexLimit;
          flexWidth -= flexLimit;
        }
      }

      if (isFinish) {
        setWidthAndFlexWidth(resizeTemp.index, width, flexWidth);
      } else {
        const columns = [...headerColumnsTemp];
        columns[resizeTemp.index] = {
          ...columns[resizeTemp.index],
          width,
        };
        columns[flexIndex] = {
          ...columns[flexIndex],
          width: flexWidth,
        };
        columns[flexIndex].width = flexWidth;
        setHeaderColumnsTemp(columns);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      changeWidths(e.clientX, false);
    };

    const onMouseUp = (e: MouseEvent) => {
      changeWidths(e.clientX, true);
      setResizeTemp(null);
      setHeaderColumnsTemp(null);

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
  }, [setWidthAndFlexWidth, flexIndex, resizeTemp, headerColumnsTemp, resetedPartionEvent]);

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
      setHeaderColumnsTemp(headerColumns);

      setResetedPartionEvent(true);
    },
    [removeEventListener, flexIndex, headerColumns]
  );

  return {
    // width: headerWidth,
    height: headerHeight,

    headerColumns,
    headerColumnsTemp,

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
