import { createRoot } from "react-dom/client";
import React from "react";
import { Provider } from "react-redux";
import { NCV_View } from "./components/NCV_View/NCV_View";
import { store } from "./store";
import { useWidnowSize } from "./hooks/useWidnowSize";

import "../styles/index.css";

createRoot(document.getElementById("root")!)
  .render(
    <React.StrictMode>
      <Provider store={store}>
        {/* <IndexComponent /> */}
        <TestComponent />
        {/* <XComponent /> */}
      </Provider>
    </React.StrictMode>
  );

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TestComponent() {
  const { windowWidth, windowHeight } = useWidnowSize();

  return (
    <div>
      <NCV_View
        height={windowHeight - 200}
        width={windowWidth}
      />
    </div>
  );
}
