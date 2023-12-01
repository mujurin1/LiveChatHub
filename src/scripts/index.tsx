import { createRoot } from "react-dom/client";
import React, { useState } from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import { LiveChatHub } from "./components/LiveChatHub";

import "../styles/index.css";

createRoot(document.getElementById("root")!)
  .render(
    <React.StrictMode>
      <Provider store={store}>
        <TestComponent />
      </Provider>
    </React.StrictMode>
  );

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TestComponent() {
  return (
    <LiveChatHub />
  );
}
