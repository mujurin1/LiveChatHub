import { ReducersToActions, assert, assertNotNullish, createSlice } from "@lch/common";



export const HEADER_COL_MIN_WIDTH = 20;
export const SCROLL_BAR_WIDTH = 10;

export type ColumnType = "item-id" | "no" | "icon" | "name" | "time" | "content" | "info";
export type ColumnState = { type: ColumnType; width: number; };

export interface NCV_HeaderState {
  width: number;
  height: number;
  flexIndex: number;
  columns: ColumnState[];

  resizeTemp: ResizeTemp | null;
}

export const ncv_HeaderStateSlice = createSlice({
  create: (): NCV_HeaderState => ({
    width: 100 * 3 + 100,
    height: 50,
    flexIndex: 3,
    columns: [
      { type: "item-id", width: 100 },
      { type: "name", width: 100 },
      { type: "time", width: 100 },
      { type: "content", width: 100 },
    ],
    resizeTemp: null
  }),
  reducers: {
    setHeaderHeight: (state, height: number) => {
      state.height = height;
    },
    setHeaderWidth: (state, width: number) => {
      const diffWidth = width - state.width;
      state.width = width - SCROLL_BAR_WIDTH;
      state.columns[state.flexIndex].width += diffWidth;
    },
    // setWidth: (state, index: number, width: number) => {
    //   width = Math.min(width, HEADER_COL_MIN_WIDTH);
    //   const diff = width - state.columns[index].width;
    //   if (diff === 0) return;

    //   state.columns[index].width = width;
    //   state.columns[state.flexIndex].width += diff;
    // },

    startResizeColumn: (state, index: number, mouseX: number) => {
      const right = index >= state.flexIndex;
      if (right) index++;

      state.resizeTemp = {
        targetIndex: index,
        amount: 0,
        startX: mouseX,
        right,
      };
    },
    resizeColumn: (state, mouseX: number) => {
      assertNotNullish(state.resizeTemp);

      // targetWidth を増やす値
      let amount = state.resizeTemp.right
        ? state.resizeTemp.startX - mouseX
        : mouseX - state.resizeTemp.startX;

      if (amount < 0) {
        const newWidth = state.columns[state.resizeTemp.targetIndex].width + amount;
        if (newWidth < HEADER_COL_MIN_WIDTH)
          amount = HEADER_COL_MIN_WIDTH - newWidth;
      } else {
        const newFlexWidth = state.columns[state.flexIndex].width - amount;
        if (newFlexWidth < HEADER_COL_MIN_WIDTH)
          amount = HEADER_COL_MIN_WIDTH - newFlexWidth;
      }

      if (amount === 0) return;

      state.resizeTemp.amount = amount;
    },
    finishResizeColumn: (state) => {
      assertNotNullish(state.resizeTemp);

      state.columns[state.resizeTemp.targetIndex].width += state.resizeTemp.amount;
      state.columns[state.flexIndex].width -= state.resizeTemp.amount;

      state.resizeTemp = null;
    }
  }
});

export type NCV_HeaderStateActions = ReducersToActions<typeof ncv_HeaderStateSlice.reducers>;

const reducers = ncv_HeaderStateSlice.reducers;

export const getTempOrActualColumns = (state: NCV_HeaderState): ColumnState[] => {
  if (state.resizeTemp == null) return state.columns;

  const columns: ColumnState[] = [];

  for (let i = 0; i < state.columns.length; i++) {
    columns[i] = { ...state.columns[i] };
  }

  columns[state.resizeTemp.targetIndex].width += state.resizeTemp.amount;
  columns[state.flexIndex].width -= state.resizeTemp.amount;

  return columns;
};



export interface ResizeTemp {
  /** ターゲットのインデックス */
  readonly targetIndex: number;
  /** 最後にターゲット幅を増やす値 */
  amount: number;

  /** 開始時のマウス座標X */
  readonly startX: number;
  /** フレックスカラムより右か */
  readonly right: boolean;
}
