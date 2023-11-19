import { AnyAction, Selector, ThunkAction, configureStore, createSelector } from "@reduxjs/toolkit";
import { useDispatch, TypedUseSelectorHook, useSelector } from "react-redux";
// import { headerReducer } from "./slices/headerSlice";

export const store = configureStore({
  reducer: {
    // header: headerReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  AnyAction
>;

export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export type TypedCreateSelector<State> = <
  SelectorsArray extends readonly Selector<State>[],
  Result,
>(
  ...args: Parameters<typeof createSelector<SelectorsArray, Result>>
) => ReturnType<typeof createSelector<SelectorsArray, Result>>;
export const createAppSelector: TypedCreateSelector<RootState> = createSelector;
// export const createDraftSafeAppSelector: TypedCreateSelector<RootState> = createDraftSafeSelector;
