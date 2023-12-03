import React, { useCallback, useRef } from "react";
import { css } from "@emotion/react";
import { HEADER_COL_MIN_WIDTH, NCV_HeaderState, NCV_HeaderStateActions, getTempOrActualColumns } from "./NCV_HeaderState";
import { node } from "webpack";

export * from "./NCV_HeaderState";

export interface NCV_HeaderProps {
  state: NCV_HeaderState;
  actions: NCV_HeaderStateActions;
}

export function NCV_Header({ state, actions }: NCV_HeaderProps) {
  const lastIndex = state.columns.length - 1;

  const columns = getTempOrActualColumns(state);

  const removeEventRef = useRef<() => void | null>();

  const partialMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) => {
    if (removeEventRef.current != null) removeEventRef.current();

    const onMouseMove = (e: MouseEvent) => {
      actions.resizeColumn(e.clientX);
    };

    const onMouseUp = (e: MouseEvent) => {
      actions.resizeColumn(e.clientX);
      actions.finishResizeColumn();

      removeEventListener();
    };

    const removeEventListener = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);


    actions.startResizeColumn(index, e.clientX);
    removeEventRef.current = removeEventListener;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="ncv-view-header"
      css={css`
      height: ${state.height}px;
      `}
    >
      {(columns).map((column, i) => (
        <React.Fragment key={column.type}>
          <div
            className="ncv-view-header-item"
            style={{ width: column.width }}
            css={css`
            min-width: ${HEADER_COL_MIN_WIDTH}px;
            `}
          >
            <div className="ncv-view-header-item-content">{column.type}</div>
            {i === lastIndex ? undefined :
              <div
                className="ncv-view-header-item-partition"
                onMouseDown={e => partialMouseDown(e, i)}
              />}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// function useHeaderState(width: number) {
//   const [resizeTemp, setResizeTemp] = useState<ResizeTemp | null>(null);
//   const [resetedPartionEvent, setResetedPartionEvent] = useState(false);
//   const [removeEventListener, setRemoveEventListener] = useState<(() => void) | null>(null);

//   const columnsTemp = useAppSelector(state => state.header.columnsTemp);
//   const headerColumns = useAppSelector(state => state.header.columns);
//   const flexIndex = useAppSelector(state => state.header.flexIndex);
//   const dispatch = useDispatch();

//   // 横幅の再調整
//   useEffect(() => {
//     const oldWidth = headerColumns.reduce((s, v) => s - v.width, width);
//     if (oldWidth === 0) return;

//     const flexWidth = headerColumns[flexIndex].width + oldWidth;
//     dispatch(setWidth(flexIndex, flexWidth));
//   }, [dispatch, flexIndex, headerColumns, width]);

//   useEffect(() => {
//     if (!resetedPartionEvent || resizeTemp == null || columnsTemp == null) return;
//     setResetedPartionEvent(false);

//     const changeWidths = (clientX: number, isFinish: boolean): void => {
//       /** 幅の変化量 */
//       let amount = clientX - resizeTemp.startX;
//       if (amount === 0) return;

//       if (!resizeTemp.left) amount *= -1;

//       let width = resizeTemp.startTargetWidth + amount;
//       let flexWidth = resizeTemp.startFlexWidth - amount;

//       const limit = width - HEADER_COL_MIN_WIDTH;
//       if (limit < 0) {
//         width -= limit;
//         flexWidth += limit;
//       } else {
//         const flexLimit = flexWidth - HEADER_COL_MIN_WIDTH;
//         if (flexLimit < 0) {
//           width += flexLimit;
//           flexWidth -= flexLimit;
//         }
//       }

//       if (isFinish) {
//         dispatch(setWidthAndFlexWidth(resizeTemp.index, width, flexWidth));
//       } else {
//         const columns = [...columnsTemp];
//         columns[resizeTemp.index] = {
//           ...columns[resizeTemp.index],
//           width,
//         };
//         columns[flexIndex] = {
//           ...columns[flexIndex],
//           width: flexWidth,
//         };
//         columns[flexIndex].width = flexWidth;
//         dispatch(setColumnsTemp(columns));
//       }
//     };

//     const onMouseMove = (e: MouseEvent) => {
//       changeWidths(e.clientX, false);
//     };

//     const onMouseUp = (e: MouseEvent) => {
//       changeWidths(e.clientX, true);
//       setResizeTemp(null);
//       dispatch(setColumnsTemp(null));

//       removeEventListener();
//     };

//     window.addEventListener("mousemove", onMouseMove);
//     window.addEventListener("mouseup", onMouseUp);

//     const removeEventListener = () => {
//       setRemoveEventListener(null);

//       window.removeEventListener("mousemove", onMouseMove);
//       window.removeEventListener("mouseup", onMouseUp);
//     };

//     setRemoveEventListener(() => removeEventListener);
//   }, [dispatch, flexIndex, resizeTemp, columnsTemp, resetedPartionEvent]);

//   const partitionMouseDown = useCallback(
//     (e: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) => {
//       removeEventListener?.();

//       const left = index < flexIndex;
//       if (!left) index++;

//       setResizeTemp({
//         index,
//         startTargetWidth: headerColumns[index].width,
//         startFlexWidth: headerColumns[flexIndex].width,
//         startX: e.clientX,
//         left,
//       });
//       dispatch(setColumnsTemp(headerColumns));

//       setResetedPartionEvent(true);
//     },
//     [dispatch, flexIndex, headerColumns, removeEventListener]
//   );

//   return {
//     headerColumns,
//     partitionMouseDown,
//   };
// }



// interface ResizeTemp {
//   /**
//    * ターゲットのインデックス
//    */
//   index: number;
//   /**
//    * 開始時のターゲットのカラムの幅
//    */
//   startTargetWidth: number;
//   /**
//    * 開始時のフレックスカラムの幅
//    */
//   startFlexWidth: number;
//   /**
//    * 開始時のマウス座標X
//    */
//   startX: number;
//   /**
//    * フレックスカラムより左か
//    */
//   left: boolean;
// }
