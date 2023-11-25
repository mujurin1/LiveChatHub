import { Trigger } from "@lch/common";
import { SampleSiteComment, SampleSiteConnector } from "./SampleSiteConnector";
import { useMemo, useState } from "react";
import { FeedData } from "./FeedData";

export function useConnectorManager() {
  const [, changed] = useState(0);
  const manager = useMemo(() => new ConnectorManager(), []);
  manager.onConnectorChange.add(() => changed(x => x + 1));

  return manager;
}

export class ConnectorManager {
  public connectors = new Map<string, SampleSiteConnector>();

  public has(connectionId: string): boolean {
    return this.connectors.has(connectionId);
  }


  public onConnectorChange = new Trigger();

  public onReceiveComments = new Trigger<[string, FeedData[]]>();


  /**
   * 
   * @param connectionId 
   * @returns コネクターを生成した場合またはすでに存在する場合は`true`
   */
  public connect(connectionId: string): boolean {
    if (connectionId == "") return false;

    if (this.connectors.has(connectionId)) return true;

    const connector = new SampleSiteConnector(connectionId);
    connector.onCommentReceive.add(contents => {
      this.commentReceive(connector.connectionId, contents);
    });

    this.connectors.set(connectionId, connector);

    this.onConnectorChange.fire();

    return true;
  }

  public disconnect(connectionId: string): void {
    const connector = this.connectors.get(connectionId);
    if (connector == null) return;

    connector.close();
    this.connectors.delete(connectionId);

    this.onConnectorChange.fire();
  }



  private nextCommentId = 0;

  private commentReceive(connectorId: string, contents: SampleSiteComment[]) {
    const comments = contents.map<FeedData>(content => ({
      id: this.nextCommentId++,
      content,
    }));

    this.onReceiveComments.fire(connectorId, comments);
  }
}
