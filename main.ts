import { generateSecretKey, getPublicKey } from "npm:nostr-tools";

const secretKey = generateSecretKey();
const publicKey = getPublicKey(secretKey);

console.log(secretKey);
console.log(publicKey);
