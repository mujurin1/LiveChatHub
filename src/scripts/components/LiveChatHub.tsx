import { useState } from "react";
import { LiveManager, useLiveManager } from "../Lives/LiveManager";
import { TabView } from "./TabView";
import { css } from "@emotion/react";

export const HEAD_AREA_HEIGHT = 100;

export function LiveChatHub() {
  const liveManager = useLiveManager();

  return (
    <div css={css`
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    `}>
      <ConnectorView liveManager={liveManager} />
      <TabView liveManager={liveManager} />
    </div>
  );
}

interface ConnectorViewState {
  liveManager: LiveManager;
}

function ConnectorView({ liveManager }: ConnectorViewState) {
  const [liveIds, setLiveIds] = useState(["aa?x", "bb?x"]);

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
            liveIds.map((liveId, index) => (
              <tr key={index}>
                <td>サンプルサイト</td>
                <td>
                  <input
                    type="text"
                    value={liveId}
                    onChange={e => setLiveIds(oldValue => {
                      const newValue = [...oldValue];
                      newValue[index] = e.target.value;
                      return newValue;
                    })}
                    readOnly={liveManager.isConnect(liveId)}
                  />
                </td>
                <td>
                  <button onClick={(() => {
                    if (liveManager.isConnect(liveId)) {
                      liveManager.disconnect(liveId);
                    } else {
                      const live = liveManager.connect(liveId);
                      if (live == null) return;

                      setLiveIds(oldValue => {
                        const newValue = [...oldValue];
                        newValue[index] = live.connectId;
                        return newValue;
                      });
                    }
                  })}>{liveManager.isConnect(liveId) ? "切断" : "接続"}</button>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}
