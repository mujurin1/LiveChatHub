import { virtualListStateSlice } from "@lch/virtual-list";
import { useSliceState } from "@lch/common";
import { createRoot } from "react-dom/client";
import React, { useMemo, useState } from "react";
import { Provider, useStore } from "react-redux";
import { store } from "./store";
import { LiveChatHub } from "./components/LiveChatHub";

import "../styles/index.css";

createRoot(document.getElementById("root")!)
  .render(
    <React.StrictMode>
      <Provider store={store}>
        <TestComponent />
        {/* <Test /> */}
      </Provider>
    </React.StrictMode>
  );

function Test() {
  const [state, actions] = useSliceState(virtualListStateSlice);

  return (
    <div>
      <div>autoScroll     :{`${state.autoScroll}`}</div>
      <div>contentHeights :{`${JSON.stringify(state.contentHeights)}`}</div>
      <div>rowCount       :{`${state.rowCount}`}</div>
      <div>rowLayoutNode  :{`${JSON.stringify(state.rowLayoutNode)}`}</div>
      <div>rowShift       :{`${state.rowShift}`}</div>
      <div>scrollTop      :{`${state.scrollTop}`}</div>
      <div>viewportHeight :{`${state.viewportHeight}`}</div>

      <button onClick={() => actions.addContent(1, 1)}>add</button>
      <button onClick={() => actions.addContents([2, 3], 1)}>adds</button>
      <button onClick={() => actions.updateRowHeight(1, 10)}>hoge</button>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TestComponent() {
  return (
    <LiveChatHub />
  );
}
