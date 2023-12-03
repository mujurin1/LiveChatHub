import React, { useCallback, useRef } from "react";
import { css } from "@emotion/react";
import { HEADER_COL_MIN_WIDTH, NCV_HeaderState, NCV_HeaderStateActions, getTempOrActualColumns } from "./NCV_HeaderState";

export * from "./NCV_HeaderState";

export interface NCV_HeaderProps {
  state: NCV_HeaderState;
  actions: NCV_HeaderStateActions;
}

export function NCV_Header({ state, actions }: NCV_HeaderProps) {
  const lastIndex = state.columns.length - 1;

  const columns = getTempOrActualColumns(state);

  const removeEventRef = useRef<(() => void) | null>();

  const partialMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) => {
    if (removeEventRef.current != null) removeEventRef.current();

    const onMouseMove = (e: MouseEvent) => {
      actions.resizeColumn(e.clientX);
    };

    const onMouseUp = (e: MouseEvent) => {
      actions.resizeColumn(e.clientX);

      removeEventListener();
    };

    const removeEventListener = () => {
      removeEventRef.current = null;

      actions.finishResizeColumn();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);


    actions.startResizeColumn(index, e.clientX);
    removeEventRef.current = removeEventListener;
    // actions (絶対に不変なので)
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
