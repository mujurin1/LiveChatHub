import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export type HeaderType = "icon" | "no" | "name" | "time" | "content" | "info";
export type HeaderLineup = { id: HeaderType; width: number; };

export interface HeaderState {
  lineup: HeaderLineup[];
  height: number;
  /** MEMO: この値は実装側の都合で index にしても良い */
  // flexColumn: HeaderType;
  flexColumn: "content";
}

export interface HeaderColumnState { }

export const headerSlice = createSlice({
  name: "header",
  initialState: {
    lineup: [
      { id: "icon", width: 100 },
      { id: "name", width: 100 },
      { id: "time", width: 100 },
      { id: "content", width: 100 },
    ],
    height: 100,
    flexColumn: "content",
  } satisfies HeaderState as HeaderState,
  reducers: {
    setLineup: (state, action: PayloadAction<HeaderLineup[]>) => {
      state.lineup = action.payload;
    },
    // MEMO: 複数の payload を引数に受取る書き方
    // https://stackoverflow.com/questions/71778940/redux-toolkit-reducer-with-multiple-parameters-redux-toolkit
    // setWidth: {
    //   prepare: (widths: [])
    // }
  }
});

export const { setLineup } = headerSlice.actions;

// export const selectCount = state => state.counter.value;

export const headerReducer = headerSlice.reducer;


