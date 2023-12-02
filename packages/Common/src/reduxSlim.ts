/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import { Draft, produce } from "immer";
import { useMemo, useState } from "react";

// TODO: | never でないと何故か state が型推論されない (undefined にしたいけど)

type Reducer<
  State,
  ReducerProp extends unknown[] | never
> = ReducerProp extends unknown[]
  ? (state: Draft<State>, ...args: ReducerProp) => void
  // : (state: Draft<State>, _: never) => void;
  : (state: Draft<State>) => void;

type Slice<
  State,
  Reducers extends { [K: string]: unknown[] | never; },
> = {
  create: () => State,
  reducers: {
    [K in keyof Reducers]: Reducer<State, Reducers[K]>
  };
};

export function createSlice<
  State,
  Reducers extends Record<string, unknown[] | never>
>(params: Slice<State, Reducers>) {
  return params;
}

export function useSliceState<
  State,
  Reducers extends Record<string, unknown[] | never>
>(slice: Slice<State, Reducers>) {
  const [state, setState] = useState(slice.create);

  const reducers = useMemo(() => {
    const reducers = {} as {
      [K in keyof Reducers]: Reducers[K] extends unknown[]
      ? (...params: Reducers[K]) => void
      : () => void
    };

    for (const _key in slice.reducers) {
      const key: keyof Reducers = _key;
      const action = slice.reducers[key];

      type params = Reducers[typeof key];
      type reducerFunc = params extends unknown[] ? (...params: params) => void : () => void;

      const reducerFunc = function (params: params) {
        if (params == null) {
          setState(produce<State>(draft => action(draft)));
        } else {
          // 任意個の引数を受取るためには arguments を使うしか無いので許容する
          // eslint-disable-next-line prefer-rest-params
          setState(produce<State>(draft => action(draft, ...arguments)));
        }
      };

      reducers[key] = reducerFunc as reducerFunc;
    }

    return reducers;
    // slice.reducers (絶対に不変なので)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [state, reducers] as const;
}
