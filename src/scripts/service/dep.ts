import { DemoLive } from "../livePlatform/__demo__/DemoLive";
import { ChatStore } from "./live/ChatStore";
import { LiveStore } from "./live/LiveStore";
import { ChatStoreImpl } from "./live/impl/ChatStoreImpl";
import { LiveManager } from "./live/impl/LiveManager";

export function singleton<T>(fn: () => T): () => T {
  let instance: T | null = null;
  return () => instance ?? (instance = fn());
}

export type Provider<T> = () => T;

/** サービスの依存関係定義 */
const getChatStore: Provider<ChatStore> = singleton(() => new ChatStoreImpl());

// const getStorage: Provider<LocalStorage> = singleton(() => {
//   const storage = new ChromeLocalStorage();

//   // ストレージが更新されたら
//   storage.onUpdated.add(setNiconamaToken);

//   // トークンのセット
//   function setNiconamaToken() {
//     setNiconamaApiUseToken(() => {
//       const token = dep.getStorage().data.nico.token?.access_token;
//       if (token == null) throw new Error("トークンが存在しません");
//       return token;
//     });
//   }
//   setNiconamaToken();

//   // ストレージの初期化
//   void storage.load().then(async () => {
//     setNiconamaToken();

//     if (storage.data.nico?.token?.access_token == null) {
//       window.open(GetNicoTokenUrl, "get_nico_oauth");
//     } else {
//       storage.data.nico.token = await checkTokenRefresh(
//         storage.data.nico.token
//       );
//       await storage.save();
//     }
//   });

//   return storage;
// });

const getLiveManager: Provider<LiveManager> = singleton(() => {
  const demoLive = new DemoLive();
  // const niconama = new NiconamaLive();
  // return new LiveManager([demoLive, niconama]);
  return new LiveManager([demoLive]);
});

const getLiveStore: Provider<LiveStore> = getLiveManager;

export const dep = {
  getChatStore,
  // getStorage,
  getLiveStore,
};

// getStorage();
