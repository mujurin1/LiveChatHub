import { Trigger } from "@lch/common";
import { Live } from "../../../definition/Live";
import { UpdateVariation } from "../../../definition/LiveChatNotify";
import { LcComment } from "../../../definition/model/LcComment";
import { LcUser } from "../../../definition/model/LcUser";
import { LiveError } from "../../../definition/model/LiveError";
import { dep } from "../../dep";
import { LiveStore } from "../LiveStore";

export class LiveManager implements LiveStore {
  /** 放送の配列 */
  readonly lives: Live[] = [];
  /** 放送のマップ */
  readonly #liveMap: Record<string, Live> = {};

  readonly onError = new Trigger<[LiveError]>();

  public constructor(lives: Live[]) {
    lives.forEach((live) => {
      this.lives.push(live);
      this.#liveMap[live.livePlatformId] = live;
      // Liveの通知の設定
      live.changeComments.add(this.changeComments.bind(this));
      live.changeUsers.add(this.changeUsers.bind(this));
      live.onError.add(this.liveError.bind(this));
    });
  }

  getLive(livePlatformId: string): Live {
    return this.#liveMap[livePlatformId];
  }

  private changeComments(
    variation: UpdateVariation,
    ...comments: LcComment[]
  ) {
    const chatStore = dep.getChatStore();
    chatStore.changeComments(variation, ...comments);
  }

  private changeUsers(variation: UpdateVariation, ...users: LcUser[]) {
    const chatStore = dep.getChatStore();
    chatStore.changeUsers(variation, ...users);
  }

  private liveError(liveError: LiveError) {
    this.onError.fire(liveError);
  }
}
