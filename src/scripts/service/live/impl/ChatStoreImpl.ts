import { SetonlyCollection, Trigger } from "@lch/common";
import { UpdateVariation } from "../../../definition/LiveChatNotify";
import { LcComment } from "../../../definition/model/LcComment";
import { LcUser } from "../../../definition/model/LcUser";
import { ChatStore } from "../ChatStore";


export class ChatStoreImpl implements ChatStore {
  comments = new SetonlyCollection<LcComment>((comment) => comment.globalId);
  users = new SetonlyCollection<LcUser>((user) => user.globalId);

  readonly changeCommentNotice = new Trigger<[UpdateVariation]>();
  readonly changeUserNotice = new Trigger<[UpdateVariation]>();

  public changeComments(variation: UpdateVariation, ...comments: LcComment[]) {
    if (variation === "Add" || variation === "Update") {
      for (const comment of comments) {
        this.comments.set(comment);
      }
    }
    this.changeCommentNotice.fire(variation);
  }

  public changeUsers(variation: UpdateVariation, ...users: LcUser[]) {
    if (variation === "Add" || variation === "Update") {
      for (const user of users) {
        this.users.set(user);
      }
    }
    this.changeUserNotice.fire(variation);
  }
}
