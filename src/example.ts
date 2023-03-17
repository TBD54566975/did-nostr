import {
  createPublishEvent,
  createRecoverEvent,
  deriveDidDoc,
  pubKeyToDid,
  resolve
} from './did-nostr.js';

import { generatePrivateKey, getPublicKey } from 'nostr-tools';

function generateKeyPair(): { public: string, private: string } {
  const privateKey = generatePrivateKey();
  const publicKey = getPublicKey(privateKey);

  return {
    private : privateKey,
    public  : publicKey
  };
}

const kp = generateKeyPair();
const rkp = generateKeyPair();
const rrkp = generateKeyPair();

const did = pubKeyToDid(kp.public);
console.log(deriveDidDoc(did));

const publishEvent = createPublishEvent(kp.public, rkp.public, kp.private, ['wss://relay.damus.io']);
const recoverEvent = createRecoverEvent(
  did,
  rkp.public,
  { eventId: publishEvent.id, relayUrl: 'wss://relay.damus.io' },
  rrkp.public,
  rkp.private
);

console.log(JSON.stringify(recoverEvent, null, 2));

const didDoc = resolve(did, [publishEvent, recoverEvent]);
console.log(JSON.stringify(didDoc, null, 4));

// const previousEvent: MarkedEventTag = { eventId: publishEvent.id, relayUrl: '' };
// const patchEvent = createPatchEvent(did, publicKey, publishEvent.id, [], privateKey);