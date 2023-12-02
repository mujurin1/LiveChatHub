/* eslint-disable */

import { createRoot } from "react-dom/client";
import React, { useMemo, useState } from "react";
import { Provider, useStore } from "react-redux";
import { store } from "./store";
import { LiveChatHub } from "./components/LiveChatHub";

import "../styles/index.css";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { produce } from "immer";
import { useSliceState, virtualListStateSlice } from "@lch/virtual-list";

createRoot(document.getElementById("root")!)
  .render(
    <React.StrictMode>
      <Provider store={store}>
        {/* <TestComponent /> */}
        <Test />
      </Provider>
    </React.StrictMode>
  );

function Test() {
  const [state, actions] = useSliceState(virtualListStateSlice);

  return (
    <div>
      <div>autoScroll     :{`${state.autoScroll}`}</div>
      <div>contentHeights :{`${state.contentHeights}`}</div>
      <div>rowCount       :{`${state.rowCount}`}</div>
      <div>rowLayoutNode  :{`${state.rowLayoutNode}`}</div>
      <div>rowShift       :{`${state.rowShift}`}</div>
      <div>scrollTop      :{`${state.scrollTop}`}</div>
      <div>viewportHeight :{`${state.viewportHeight}`}</div>

      <button onClick={() => actions.scrollTo(10)}>sc</button>
      <button onClick={() => actions.scrollToBottom()}>hoge</button>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TestComponent() {
  return (
    <LiveChatHub />
  );
}
