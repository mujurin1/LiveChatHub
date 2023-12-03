import { Trigger } from "@lch/common";
import { useEffect, useState } from "react";
import { LiveItem } from "../Lives/LiveItem";
import { DemoLive } from "../Lives/DemoLive";

export function useLives() {
  const [lives, setLives] = useState(_liveManager.lives);

  useEffect(() => {
    const fn = () => setLives([..._liveManager.lives]);

    _liveManager.onLiveChange.add(fn);
    return () => _liveManager.onLiveChange.delete(fn);
  }, []);

  return lives;
}

export function useReceiveLiveItems(func: (managedIndex: number, liveItems: LiveItem[]) => void) {
  useEffect(() => {
    _liveManager.onReceiveLiveItems.add(func);
    return () => _liveManager.onReceiveLiveItems.delete(func);
  }, [func]);
}


class _LiveManager {
  public readonly lives: DemoLive[] = [];

  public onLiveChange = new Trigger();
  public onReceiveLiveItems = new Trigger<[number, LiveItem[]]>();

  private nextManagedId = 1;

  // public hasConnector(broadcastId: string): boolean {
  //   return this.lives.findIndex(live => live.connector.broadcastId === broadcastId) !== -1;
  // }

  public getLiveItem(liveItemId: number): LiveItem {
    // return this.lives[0].liveItems[0];
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
   * @returns 新しく接続した場合は`true`
   */
  public connect(connectId: string): boolean {
    if (this.findFromConnectId(connectId) != null) return false;

    if (this.nextManagedId > 0xFF)
      throw new Error(`最大接続数を超えました: connectorId:${this.nextManagedId}`);

    const live = DemoLive.create(this.nextManagedId, connectId);
    if (live == null) return false;

    this.nextManagedId += 1;
    this.lives.push(live);

    live.onLiveItemsReceive.add(items => this.onReceiveLiveItems.fire(live.managedIndex, items));
    live.onStateChange.add(_ => this.onLiveChange.fire());

    this.onLiveChange.fire();

    return true;
  }

  public disconnect(connectId: string): void {
    const live = this.findFromConnectId(connectId);
    if (live == null) return;

    live.close();
  }
}

const _liveManager = new _LiveManager();

export type LiveManager = Omit<_LiveManager, "lives">;
export const liveManager: LiveManager = _liveManager;

