import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

export type ColumnType = "icon" | "no" | "name" | "time" | "content" | "info";
export type ColumnState = { type: ColumnType; width: number; };

export interface HeaderState {
  columns: ColumnState[];
  columnsTemp: ColumnState[] | null;
  /** MEMO: この値は実装側の都合で index にしても良い */
  // flexColumn: HeaderType;
  flexIndex: number;
}

export const headerSlice = createSlice({
  name: "header",
  initialState: {
    columns: [
      { type: "icon", width: 100 },
      { type: "name", width: 100 },
      { type: "time", width: 100 },
      { type: "content", width: 100 },
    ],
    columnsTemp: null,
    flexIndex: 3,
  } satisfies HeaderState as HeaderState,
  reducers: {
    setLineup: (state, action: PayloadAction<ColumnState[]>) => {
      state.columns = action.payload;
    },
    setColumnsTemp: (state, action: PayloadAction<ColumnState[] | null>) => {
      state.columnsTemp = action.payload;
    },
    setWidth: {
      prepare: (...payload: [number, number]) => ({ payload }),
      reducer: (state, action: PayloadAction<[number, number]>) => {
        const [index, width] = action.payload;
        state.columns[index].width = width;
      },
    },
    setWidthAndFlexWidth: {
      prepare: (...payload: [number, number, number]) => ({ payload }),
      reducer: (state, action: PayloadAction<[number, number, number]>) => {
        const [index, width, fluxWidth] = action.payload;
        state.columns[index].width = width;
        state.columns[state.flexIndex].width = fluxWidth;
      },
    },
  }
});

export const { setLineup, setColumnsTemp, setWidth, setWidthAndFlexWidth } = headerSlice.actions;

export const selectColumnTypes = (state: RootState) => state.header.columns.map(column => column.width);
export const selectColumns = (state: RootState) => state.header.columns;
export const selectGhostColumns = (state: RootState) => state.header.columnsTemp ?? state.header.columns;
// export const selectGhostColumns = createAppSelector(
//   [
//     state => state.header.tempColumns,
//     state => state.header.columns,
//   ],
//   (temp, reality) => temp ?? reality,
// );

// /**
//  * Column より左か調べる関数を返すセレクタ
//  */
// export const selectTypeIndex = createAppSelector(
//   [
//     state => state.header.columns,
//     (state, type: ColumnType) => ,
//     state => state.header.flexIndex
//   ],
//   (columns, flexColumn) => value1 + value2,

// );

export const headerReducer = headerSlice.reducer;


