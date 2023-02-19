import { createPublishEvent } from './did-nostr.js';
import { NostrWallet } from './nostr-wallet.js';

const { mnemonic, wallet } = NostrWallet.create();

const pubKey = wallet.getPublickey();
const recoveryPubKey = wallet.getPublickey(1);

const publishEvent = createPublishEvent(pubKey, recoveryPubKey);
console.log(JSON.stringify(publishEvent, null, 2));