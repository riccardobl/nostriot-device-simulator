import { finalizeEvent, getPublicKey, SimplePool } from "npm:nostr-tools";
import { hexToBytes } from "npm:@noble/hashes/utils";
import { loadConfigFile } from "./config.ts";

const appConfig = await loadConfigFile("./config.json");

const sk = hexToBytes(appConfig.privateKey);
const pk = getPublicKey(sk);

let event = finalizeEvent({
  kind: 1,
  created_at: Math.floor(Date.now() / 1000),
  tags: [],
  content: "hello from deno!",
}, sk);

const pool = new SimplePool();

// await Promise.any(pool.publish(appConfig.relays, event))
// console.log('published to at least one relay!')

let h = pool.subscribeMany(
  appConfig.relays,
  [
    {
      "#p": [pk],
    },
  ],
  {
    onevent(event) {
      console.log(event);
    },
    oneose() {
      h.close();
    },
  },
);
