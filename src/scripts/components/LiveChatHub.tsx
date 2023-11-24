import { useState } from "react";
import { useWidnowSize } from "../hooks/useWidnowSize";
import { NCV_View, useNCV_ViewState } from "./NCV_View/NCV_View";

let contentId = 1;

export function LiveChatHub() {
  const { windowWidth, windowHeight } = useWidnowSize();

  const ncvViewState = useNCV_ViewState(windowHeight - 200, windowWidth);
  const {
    virtualListState,
  } = ncvViewState;

  const [range, setRange] = useState(5);

  return (
    <>
      <NCV_View state={ncvViewState} />

      <div>
        <input type="range" min={1 * 1} max={10 * 1} step={1 * 1} defaultValue={5 * 1} id="input_text" onChange={e => setRange(+e.target.value)} />

        <button onClick={() => {
          const ary: string[] = [];
          for (let i = 0; i < range; i++)
            ary.push(contentId++ + "");
          virtualListState.addContents(ary);
        }}>追加x{range}</button>
        {"　　　　　"}
        <button onClick={() => virtualListState.addContent(`${contentId++}`)}>追加 1</button>
      </div>
    </>
  );
}
