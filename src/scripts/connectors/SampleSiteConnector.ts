import { Trigger } from "@lch/common";


export interface SampleSiteComment {
  id: string;
  usreId: string;
  userName: string;
  time: Date;
  message: string;
}

export type ConnectState = "connecting" | "open" | "closed";

export class SampleSiteConnector {
  public connectionId: string;
  public title: string;
  public streamerId: string;

  public state: ConnectState;
  public streaming: boolean;

  public onCommentReceive = new Trigger<[SampleSiteComment[]]>();
  public onStateChange = new Trigger<[ConnectState]>();

  constructor(connectionId: string) {
    this.connectionId = connectionId;
    this.title = "";
    this.streamerId = "";

    this.state = "connecting";
    this.streaming = false;

    this.run();
  }

  reload(): void { }

  close(): void {
    if (this.state === "closed") return;

    clearInterval(this.commentInterval!);

    this.state = "closed";
    this.onStateChange.fire(this.state);
  }


  private commentInterval: NodeJS.Timeout | null = null;

  private run() {
    setTimeout(() => {
      if (this.state !== "connecting") return;

      this.state = "open";
      this.onStateChange.fire(this.state);

      this.commentInterval = setInterval(() => {
        this.createComment(1);
      }, 300);
    }, 0);
  }

  private nextCommentId = 1;
  private createComment(num: number) {
    if (this.state !== "open") return;

    const comments: SampleSiteComment[] = [];
    for (let i = 0; i < num; i++) {
      const id = `${this.nextCommentId++}`;
      comments.push({
        id,
        message: `msg: ${id}`,
        time: new Date(),
        userName: "GUEST",
        usreId: "0",
      });
    }

    this.onCommentReceive.fire(comments);
  }
}
