import { Fn, Trigger } from "@lch/common";
import { LiveItem } from "./LiveItem";


export interface DemoLiveContent {
  id: string;
  usreId: string;
  userName: string;
  time: Date;
  message: string;
}

export type ConnectionState = "connecting" | "open" | "closed";

export interface DemoLiveOptions {
  connectName?: string;

}

export class DemoLive {
  /**
   * Live を管理する LiveManager のためのインデックス
   */
  public readonly managedIndex: number;
  public connectName: string;

  private connection: DemoConnection;
  public get connectionState() { return this.connection.state; }

  //#region 配信の情報 (LiveState)
  public get connectId() { return this.connection.connectId; }
  public title: string;
  public streamerId: string;
  //#endregion 配信の情報 (LiveState)

  public readonly liveItems: LiveItem[] = [];

  public onLiveItemsReceive = new Trigger<[LiveItem[]]>();
  public onStateChange = new Trigger<[ConnectionState]>();

  private constructor(managedIndex: number, connectId: string, connectName: string) {
    this.connectName = connectName ?? "DEMO";

    this.managedIndex = managedIndex;
    this.connection = new DemoConnection(
      connectId,
      this.receiveContents.bind(this),
      this.onStateChange.fire.bind(this.onStateChange)
    );

    this.title = "";
    this.streamerId = "";
  }

  public static create(managedIndex: number, connectId: string, option: DemoLiveOptions = {}): DemoLive | null {
    option.connectName ??= "DEMO";

    const parsedConnectId = this.urlOrIdParse(connectId);
    if (parsedConnectId == null) return null;

    const live = new DemoLive(managedIndex, parsedConnectId, option.connectName);

    return live;
  }

  public static urlOrIdParse(urlOrId: string): string | null {
    const index = urlOrId.indexOf("?");
    if (index === -1) return urlOrId;

    const value = urlOrId.substring(0, index);

    if (value.length < 0) return null;

    return value;
  }

  close(): void {
    this.connection.close();
  }

  reload(): void {
    this.connection.close();

    this.connection = new DemoConnection(
      this.connectId,
      this.receiveContents.bind(this),
      this.onStateChange.fire.bind(this.onStateChange)
    );
  }

  private receiveContents(contents: DemoLiveContent[]): void {
    const newItems = contents.map<LiveItem>((content, index) => ({
      id: ((this.liveItems.length + index) << 8) + this.managedIndex,
      connectId: this.connectId,
      content,
    }));

    this.liveItems.push(...newItems);
    this.onLiveItemsReceive.fire(newItems);
  }
}

class DemoConnection {
  public readonly connectId: string;

  public state: ConnectionState;
  public streaming: boolean;

  public onContentsReceive: Fn<[DemoLiveContent[]]>;
  public onStateChange: Fn<[ConnectionState]>;

  constructor(
    connectId: string,
    onContentsReceive: Fn<[DemoLiveContent[]]>,
    onStateChange: Fn<[ConnectionState]>,
  ) {
    this.connectId = connectId;
    this.onContentsReceive = onContentsReceive;
    this.onStateChange = onStateChange;

    this.state = "connecting";
    this.streaming = false;

    this.run();
  }

  close(): void {
    if (this.state === "closed") return;

    clearInterval(this.contentInterval!);

    this.state = "closed";
    this.onStateChange(this.state);
  }



  private contentInterval: NodeJS.Timeout | null = null;

  private run() {
    setTimeout(() => {
      if (this.state !== "connecting") return;

      this.state = "open";
      this.onStateChange(this.state);

      this.contentInterval = setInterval(() => {
        this.createContent(1);
      }, 300);

      this.createContent(1);
    }, 0);
  }


  private nextContentId = 1;
  private createContent(num: number) {
    if (this.state !== "open") return;

    const contents: DemoLiveContent[] = [];
    for (let i = 0; i < num; i++) {
      const contentId = `${this.nextContentId++}`;
      const live = {
        id: contentId,
        message: `msg`,
        time: new Date(),
        userName: "GUEST",
        usreId: "0",
      };

      contents.push(live);
    }

    this.onContentsReceive(contents);
  }
}
