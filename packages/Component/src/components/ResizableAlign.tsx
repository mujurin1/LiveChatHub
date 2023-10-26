import { css } from "@emotion/react";
import React, { useCallback, useLayoutEffect, useMemo, useState } from "react";

export interface ResizableAlignProps {
  children: React.ReactNode[];
  defaultWidths: number[];
  /**
   * 各カラムの最小幅
   */
  minWidths: number[];
  /**
   * 他の要素によって幅が縮むカラムインデックス
   */
  flexIndex: number;
  /**
   * ヘッダーの幅
   */
  width: number;

  /**
   * CSS
   */
  cssString?: string;
  /**
   * 幅調整のバーのCSS
   */
  partitionCss?: string;

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

export function ResizableAlign(props: ResizableAlignProps) {
  const movingPartition = props.movingPartition;
  const confirmedPartition = props.confirmedPartition;

  const [widths, setWidths] = useState<number[]>(props.defaultWidths);
  const [temp, setTemp] = useState<ResizeTemp | null>(null);

  useMemo(() => {
    setWidths(props.defaultWidths);
  }, [props.defaultWidths]);

  useMemo(() => {
    let flexWidth = props.width;
    for (let i = 0; i < widths.length; i++) {
      if (i === props.flexIndex) continue;
      flexWidth -= widths[i];
    }
    if (widths[props.flexIndex] === flexWidth) return;
    widths[props.flexIndex] = flexWidth;
    setWidths([...widths]);
  }, [props.flexIndex, props.width, widths]);

  const changeWidths = useCallback(
    (clientX: number): boolean => {
      if (temp == null) return false;
      /** 幅の変化量 */
      let amount = clientX - temp.startX;
      if (amount === 0) return false;
      if (!temp.left) amount *= -1;

      widths[temp.index] = temp.startTargetWidth + amount;
      widths[props.flexIndex] = temp.startFlexWidth - amount;

      const limit = widths[temp.index] - props.minWidths[temp.index];
      if (limit < 0) {
        widths[temp.index] -= limit;
        widths[props.flexIndex] += limit;
      } else {
        const limit = widths[props.flexIndex] - props.minWidths[props.flexIndex];
        if (limit < 0) {
          widths[temp.index] += limit;
          widths[props.flexIndex] -= limit;
        }
      }

      setWidths([...widths]);

      return true;
    },
    [props.flexIndex, props.minWidths, temp, widths]
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) => {
      const left = index < props.flexIndex;
      if (!left) index++;
      setTemp({
        index,
        startTargetWidth: widths[index],
        startFlexWidth: widths[props.flexIndex],
        startX: e.clientX,
        left,
      });
    },
    [props.flexIndex, widths]
  );

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (temp == null) return;

      changeWidths(e.clientX);
      movingPartition?.(widths, temp.index);
    },
    [changeWidths, movingPartition, temp, widths]
  );

  const onMouseUp = useCallback(
    (e: MouseEvent) => {
      if (temp == null) return;

      changeWidths(e.clientX);
      confirmedPartition?.(widths, temp.index, temp != null);
      setTemp(null);
    },
    [changeWidths, confirmedPartition, temp, widths]
  );

  const childElement = useMemo<React.ReactElement[]>(
    () => {
      const lastIndex = props.children.length - 1;
      const elements: React.ReactElement[] = [];

      for (let i = 0; i < props.children.length; i++) {
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
              min-width: ${props.minWidths[i]}px;
              `}
            >
              {props.children[i]}
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
                  ${props.partitionCss}
                  `}
                  onMouseDown={(e) => onMouseDown(e, i)}
                />}
            </div>
          </React.Fragment>
        );
      }

      return elements;
    },
    [onMouseDown, props.children, props.minWidths, props.partitionCss, widths]
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
      ${props.cssString}
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
