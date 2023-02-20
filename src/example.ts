import { createPatchEvent, createPublishEvent, pubKeyToDid } from './did-nostr.js';
import { NostrWallet } from './nostr-wallet.js';

const { mnemonic, wallet } = NostrWallet.create();

const privateKey = wallet.getPrivateKey(0);
const publicKey = wallet.getPublickey(0);
const recoveryPublicKey = wallet.getPublickey(1);

const did = pubKeyToDid(publicKey);
console.log(did);

const publishEvent = createPublishEvent(publicKey, recoveryPublicKey, privateKey);
const patchEvent = createPatchEvent(did, publicKey, publishEvent.id, [], privateKey);