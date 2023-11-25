import { useEffect, useMemo, useState } from "react";
import { useWidnowSize } from "../hooks/useWidnowSize";
import { NCV_View, useNCV_ViewState } from "./NCV_View/NCV_View";
import { ConnectorManager, useConnectorManager } from "../connectors/ConnectorManager";
import { SampleSiteComment } from "../connectors/SampleSiteConnector";

const HEAD_AREA_HEIGHT = 100;

export function LiveChatHub() {
  const { windowWidth, windowHeight } = useWidnowSize();

  const connectorManager = useConnectorManager();
  const [comments, setComments] = useState<SampleSiteComment[]>([]);

  const ncvViewState = useNCV_ViewState(windowHeight - HEAD_AREA_HEIGHT, windowWidth, comments);

  useEffect(() => {
    const func: Parameters<typeof connectorManager.onReceiveComments.add>[0] = (connector, newComments) => {
      const ids: number[] = [];
      const index = comments.length;
      for (let i = 0; i < newComments.length; i++) {
        ids.push(index + i);
      }

      setComments(oldComments => [...oldComments, ...newComments]);

      ncvViewState.addComments(ids);
    };

    connectorManager.onReceiveComments.add(func);

    return () => connectorManager.onReceiveComments.delete(func);
  }, [comments.length, connectorManager, ncvViewState]);

  // const [range, setRange] = useState(5);

  return (
    <>
      <ConnectorView connectorManager={connectorManager} />
      <NCV_View state={ncvViewState} />

      {/* <div>
        <input type="range" min={1 * 1} max={10 * 1} step={1 * 1} defaultValue={5 * 1} id="input_text" onChange={e => setRange(+e.target.value)} />

        <button onClick={() => {
          const ary: string[] = [];
          for (let i = 0; i < range; i++)
            ary.push(contentId++ + "");
          virtualListState.addContents(ary);
        }}>追加x{range}</button>
        {""}
        <button onClick={() => virtualListState.addContent(`${contentId++}`)}>追加 1</button>
      </div> */}
    </>
  );
}

interface ConnectorViewState {
  connectorManager: ConnectorManager;
}

function ConnectorView({ connectorManager }: ConnectorViewState) {
  const [liveId1, setLiveid1] = useState("");
  const [liveId2, setLiveid2] = useState("");

  return (
    <div style={{ height: HEAD_AREA_HEIGHT }}>
      <table>
        <thead>
          <tr>
            <th>サイト</th>
            <th>放送URL/ID</th>
            <th>接続/切断</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>サンプルサイト</td>
            <td>
              <input
                type="text"
                value={liveId1}
                onChange={e => setLiveid1(e.target.value)}
                readOnly={connectorManager.has(liveId1)}
              />
            </td>
            <td>
              <button onClick={(() => {
                if (connectorManager.has(liveId1)) {
                  connectorManager.disconnect(liveId1);
                } else {
                  connectorManager.connect(liveId1);
                }
              })}>{connectorManager.has(liveId1) ? "切断" : "接続"}</button>
            </td>
          </tr>

          <tr>
            <td>サンプルサイト</td>
            <td>
              <input
                type="text"
                value={liveId2}
                onChange={e => setLiveid2(e.target.value)}
                readOnly={connectorManager.has(liveId2)}
              />
            </td>
            <td>
              <button onClick={(() => {
                if (connectorManager.has(liveId2)) {
                  connectorManager.disconnect(liveId2);
                } else {
                  connectorManager.connect(liveId2);
                }
              })}>{connectorManager.has(liveId2) ? "切断" : "接続"}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
