import {
  createPatchEvent,
  createPublishEvent,
  createRecoverEvent,
  pubKeyToDid,
  resolve
} from './did-nostr.js';

import nostrTools from 'nostr-tools';

import type { MarkedEventTag } from './did-nostr.js';

const { generatePrivateKey, getPublicKey } = nostrTools;

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

const publishEvent = createPublishEvent(kp.public, rkp.public, kp.private, ['wss://relay.damus.io']);
const recoverEvent = createRecoverEvent(
  did,
  rkp.public,
  { eventId: publishEvent.id, relayUrl: 'wss://relay.damus.io' },
  rrkp.public,
  rkp.private
);

const didDoc = resolve(did, [publishEvent, recoverEvent]);
console.log(JSON.stringify(didDoc, null, 4));

// const previousEvent: MarkedEventTag = { eventId: publishEvent.id, relayUrl: '' };
// const patchEvent = createPatchEvent(did, publicKey, publishEvent.id, [], privateKey);