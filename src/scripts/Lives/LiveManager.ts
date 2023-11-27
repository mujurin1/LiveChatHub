import { Trigger } from "@lch/common";
import { useMemo, useState } from "react";
import { LiveItem } from "./LiveItem";
import { DemoLive } from "./DemoLive";

export function useLiveManager() {
  const [, changed] = useState(0);
  const manager = useMemo(() => new LiveManager(), []);
  manager.onLiveChange.add(() => changed(x => x + 1));

  return manager;
}

export class LiveManager {
  public readonly lives: DemoLive[] = [];

  public onLiveChange = new Trigger();
  public onReceiveLiveDatas = new Trigger<[number, LiveItem[]]>();

  private nextManagedId = 1;

  // public hasConnector(broadcastId: string): boolean {
  //   return this.lives.findIndex(live => live.connector.broadcastId === broadcastId) !== -1;
  // }

  public getLiveItem(liveItemId: number): LiveItem {
    const managedIndex = liveItemId & 0xFF;
    const itemIndex = liveItemId >> 8;
    const live = this.lives.find(live => live.managedIndex === managedIndex)!;
    return live.liveItems[itemIndex];
  }

  public findFromConnectId(connectId: string): DemoLive | undefined {
    const value = DemoLive.urlOrIdParse(connectId);
    if (value == null) return;

    return this.lives.find(live => live.connectId === value);
  }

  public isConnect(connectId: string): boolean {
    const live = this.findFromConnectId(connectId);
    if (live == null) return false;
    return live.connectionState !== "closed";
  }


  /**
   * 
   * @param connectorId 
   * @returns 接続した`Live`オブジェクトまたは `null`
   */
  public connect(connectId: string): DemoLive | null {
    const oldLive = this.findFromConnectId(connectId);
    if (oldLive) {
      oldLive.reload();
      this.onLiveChange.fire();
      return oldLive;
    }

    if (this.nextManagedId > 0xFF)
      throw new Error(`最大接続数を超えました: connectorId:${this.nextManagedId}`);

    const live = DemoLive.create(this.nextManagedId, connectId);
    if (live == null) return null;

    this.nextManagedId += 1;
    this.lives.push(live);


    live.onLiveItemsReceive.add(items => {
      this.onReceiveLiveDatas.fire(live.managedIndex, items);
    });

    this.onLiveChange.fire();

    return live;
  }

  public disconnect(connectId: string): void {
    const live = this.findFromConnectId(connectId);
    if (live == null) return;

    live.close();

    this.onLiveChange.fire();
  }
}
