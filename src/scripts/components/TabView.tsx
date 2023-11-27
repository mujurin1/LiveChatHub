import { useEffect } from "react";
import { useWidnowSize } from "../hooks/useWidnowSize";
import { NCV_View, useNCV_ViewState } from "./NCV_View/NCV_View";
import { LiveManager } from "../Lives/LiveManager";
import { HEAD_AREA_HEIGHT } from "./LiveChatHub";

export interface TabViewProps {
  liveManager: LiveManager;
}

export function TabView({ liveManager }: TabViewProps) {
  const { windowWidth, windowHeight } = useWidnowSize();

  const ncvViewState = useNCV_ViewState(windowHeight - HEAD_AREA_HEIGHT, windowWidth, liveManager);

  useEffect(() => {
    const func: Parameters<typeof liveManager.onReceiveLiveDatas.add>[0] = (managedIndex, liveItems) => {

      ncvViewState.addLiveItems(liveItems);
    };

    liveManager.onReceiveLiveDatas.add(func);

    return () => liveManager.onReceiveLiveDatas.delete(func);
  }, [liveManager, ncvViewState]);


  return (
    <NCV_View state={ncvViewState} />
  );
}
