import { Trigger, assertNotNullish } from "@lch/common";
import { Live } from "../../definition/Live";
import { UpdateVariation } from "../../definition/LiveChatNotify";
import { LcComment } from "../../definition/model/LcComment";
import { LcUser } from "../../definition/model/LcUser";
import { LiveError } from "../../definition/model/LiveError";
import { LiveState } from "../../definition/model/LiveState";
import { LiveViews } from "../../definition/model/LiveViews";
import { DemoComment } from "./DemoComment";
import { DemoLiveConnect } from "./DemoLiveConnect";
import { DemoLiveSendComment } from "./DemoLiveSendComment";
import { DemoUser } from "./DemoUser";
import { nanoid } from "nanoid";


/**
 * テスト用デモ配信プラットフォーム
 */
export class DemoLive implements Live {
  public static readonly livePlatformId = "DemoPlatform";
  public static readonly livePlatformName = "デモ配信サイト";
  readonly livePlatformId = DemoLive.livePlatformId;
  readonly livePlatformName = DemoLive.livePlatformName;

  private createCommentIntervalId?: NodeJS.Timeout | string | number;

  /**
   * { [globalId]: DemoUser }
   */
  #demoUsers: Record<string, DemoUser> = {};
  /**
   * { [globalId]: DemoComment }
   */
  #demoComments: Record<string, DemoComment> = {};
  readonly updateLiveState = new Trigger<[LiveState]>();
  readonly changeComments = new Trigger<[UpdateVariation, ...LcComment[]]>();
  readonly changeUsers = new Trigger<[UpdateVariation, ...LcUser[]]>();
  readonly onError = new Trigger<[LiveError]>();
  #connecting = false;
  #liveState?: LiveState;
  readonly views: LiveViews;

  public constructor() {
    this.views = {
      connect: () => DemoLiveConnect({ demoLive: this }),
      sendComment: () => DemoLiveSendComment({ demoLive: this }),
    };
  }

  public get connecting() {
    return this.#connecting;
  }

  public get liveState() {
    return this.#liveState;
  }

  public switchAutoComment() {
    if (this.createCommentIntervalId == null) {
      this.createCommentIntervalId = setInterval(() => {
        this.newComments(1);
      }, 20);
    } else {
      clearInterval(this.createCommentIntervalId);
      this.createCommentIntervalId = undefined;
    }
  }

  public newComments(plus: number): LcComment[] {
    const comments: LcComment[] = [];
    const users: LcUser[] = [];
    for (let i = 0; i < plus; i++) {
      const comment = createComment();
      this.#demoComments[comment.globalId] = comment;

      let user = this.#demoUsers[comment.userInnerId];
      if (user == null) {
        user = createUser(comment.userInnerId);
        this.#demoUsers[user.innerId] = user;
        users.push(toLcUser(user));
      }
      comments.push(toLcComment(comment, user));
    }
    if (users.length > 0) this.changeUsers.fire("Add", ...users);
    this.changeComments.fire("Add", ...comments);
    return comments;
  }
}

let demoComments = 0;
const demoUsers = [
  { id: "1", name: "デモ AAAAAA" },
  { id: "2", name: "デモ BB", },
  { id: "3", name: "デモ C", },
  { id: "4", name: "デモ DDDDD", },
  { id: "5", name: "デモ EEEEEEEEEEEE" },
];
const randomUser = () =>
  demoUsers[Math.floor(Math.random() * demoUsers.length)];

function createComment(): DemoComment {
  demoComments += 1;
  const user = randomUser();
  return {
    globalId: nanoid(),
    innerId: `${demoComments}`,
    userInnerId: user.id,
    // comment: `userId:${user.id}, name: ${user.name}`,
    comment: randomComment(),
  };
}

function randomComment(): string {
  const text = "テストテキストです";
  const cnt = Math.random() * 10;
  let comment = "";
  for (let i = 0; i < cnt; i++) comment += text;
  return comment;
}

const createUser = (userId: string): DemoUser => {
  const user = demoUsers.find((user) => user.id === userId);
  assertNotNullish(user);
  return {
    globalId: nanoid(),
    innerId: user.id,
    name: user.name,
  };
};

const toLcUser = (user: DemoUser): LcUser => ({
  globalId: user.globalId,
  livePlatformId: DemoLive.livePlatformId,
  state: {
    name: user.name,
  },
});
const toLcComment = (comment: DemoComment, user: DemoUser): LcComment => ({
  globalId: nanoid(),
  livePlatformId: DemoLive.livePlatformId,
  userGlobalId: user.globalId,
  content: {
    text: comment.comment,
    time: Date.now(),
  },
});
