import { useState } from "react";
import { TabView } from "./TabView";
import { css } from "@emotion/react";
import { liveManager, useLives } from "../services/LiveManager";

export const HEAD_AREA_HEIGHT = 100;

export function LiveChatHub() {

  return (
    <div css={css`
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    `}>
      <ConnectorView />
      <TabView />
    </div>
  );
}

interface ConnectorViewState {
}

function ConnectorView(_props: ConnectorViewState) {
  // const lives = useLives();
  const lives = useLives();
  const [connectId, setConnectId] = useState("aa?x");

  return (
    <div style={{ flex: `0 0 ${HEAD_AREA_HEIGHT}px` }}>
      <table>
        <thead>
          <tr>
            <th>サイト</th>
            <th>放送URL/ID</th>
            <th>接続/切断</th>
          </tr>
        </thead>

        <tbody>
          {
            lives.map((live, index) => (
              <tr key={index}>
                <td>サンプルサイト</td>
                <td>{live.connectId}</td>
                <td>
                  <button onClick={(() => {
                    if (live.isConnecting()) {
                      live.close();
                    } else {
                      live.reload();
                    }
                  })}>
                    {live.isConnecting() ? "切断" : "再接続"}
                  </button>
                </td>
              </tr>
            ))
          }

          <tr>
            <td>サンプルサイト</td>
            <td>
              <input type="text" value={connectId} onChange={e => setConnectId(e.target.value)} />
            </td>
            <td>
              <button onClick={(() => {
                if (liveManager.connect(connectId)) {
                  setConnectId("");
                }
              })}>{"接続"}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
