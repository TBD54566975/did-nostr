// @ts-ignore
import nostrTools from 'nostr-tools';
import jp from 'fast-json-patch';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

const { nip19, getEventHash, signEvent, validateEvent, verifySignature } = nostrTools;
const EVENT_KIND = 9325;
const OPS = new Set(['publish', 'patch', 'recover']);

export type MarkedEventTag = {
  eventId: string,
  relayUrl: string,
  marker?: 'reply' | 'root'
};

export function pubKeyToDid(pubKey: string): string {
  const npub = nip19.npubEncode(pubKey);

  return `did:nostr:${npub}`;
}

export function didToPubKey(did: string): string {
  const [_, __, npub] = did.split(':');
  const { data } = nip19.decode(npub);

  return data;
}

export function hashRecoveryKey(recoveryPubKey: string): string {
  const hashed = sha256(sha256(recoveryPubKey));

  return bytesToHex(hashed);
}

export function createPublishEvent(pubKey: string, recoveryPubKey: string, privateKey: string, relays: string[], patches: any[] = []): any {
  const relayService = { id: '#nostr', type: 'NostrRelay', serviceEndpoint: relays };
  patches.push({ op: 'add', path: '/service', value: [relayService] });

  const content = { r: hashRecoveryKey(recoveryPubKey), patches };

  const event = {
    content    : JSON.stringify(content),
    created_at : Math.floor(Date.now() / 1_000),
    kind       : EVENT_KIND,
    pubkey     : pubKey,
    tags       : [
      ['d', pubKeyToDid(pubKey)],
      ['o', 'publish']
    ]
  };

  const sig = signEvent(event, privateKey);
  const id = getEventHash(event);

  return { ...event, id, sig };
}

export function createPatchEvent(did: string, pubKey: string, previousEvent: MarkedEventTag, patches: any[], privateKey: string): any {
  const content = { patches };

  const { eventId, relayUrl, marker } = previousEvent;
  const previousEventTag = ['e', eventId, relayUrl];
  marker ?? previousEventTag.push(marker);

  const event = {
    content    : JSON.stringify(content),
    created_at : Math.floor(Date.now() / 1_000),
    kind       : EVENT_KIND,
    pubkey     : pubKey,
    tags       : [
      ['d', did],
      ['o', 'patch'],
      previousEventTag
    ]
  };

  const sig = signEvent(event, privateKey);
  const id = getEventHash(event);

  return { ...event, sig, id };
}

export function createRecoverEvent(did: string, pubKey: string, previousEvent: MarkedEventTag, recoveryPubKey: string, privateKey: string): any {
  const { eventId, relayUrl, marker } = previousEvent;
  const previousEventTag = ['e', eventId, relayUrl];
  marker ?? previousEventTag.push(marker);

  const content = { r: hashRecoveryKey(recoveryPubKey) };
  const event = {
    content    : JSON.stringify(content),
    created_at : Math.floor(Date.now() / 1_000),
    kind       : EVENT_KIND,
    pubkey     : pubKey,
    tags       : [
      ['d', did],
      ['o', 'recover'],
      previousEventTag
    ]
  };

  const sig = signEvent(event, privateKey);
  const id = getEventHash(event);

  return { ...event, sig, id };
}

export function getEventOp(event): string {
  const [ opTag ] = event.tags.filter(tag => tag[0] === 'o');

  return opTag[1];
}

export function deriveDidDoc(did: string): any {
  const [protocol, method, npub] = did.split(':');

  if (protocol !== 'did') {
    throw new Error('invalid DID');
  }

  if (method !== 'nostr') {
    throw new Error(`cannot resolve ${method} DIDs`);
  }

  const { type, data: pubkey } = nip19.decode(npub);

  if (type !== 'npub') {
    throw new Error('invalid DID. id must be bech32 encoded');
  }

  return {
    id                 : did,
    verificationMethod : [createNostrVerificationMethod(did, pubkey)]
  };
}

export function createNostrVerificationMethod(did, pubkey): any {
  return {
    'id'           : '#nostr-0',
    'type'         : 'SchnorrVerificationKey2023',
    'controller'   : did,
    'publicKeyHex' : pubkey
  };
}

export function resolve(did: string, events: any[]): any {
  let didDoc = deriveDidDoc(did);

  const [event] = events;
  if (!validateEvent(event)) {
    throw new Error('invalid event');
  }

  const { patches } = JSON.parse(event.content);

  const op = getEventOp(event);
  if (op !== 'publish') {
    throw new Error('1st event must be a publish');
  }

  const isLegit = verifySignature(event);
  let pubKey = didToPubKey(did);

  if (!isLegit || event.pubkey !== pubKey) {
    throw new Error('intergrity check failed');
  }

  jp.applyPatch(didDoc, patches, true, true);

  let previousRecoverEvent = event;
  let previousEvent = event;

  for (let i = 1; i < events.length; i += 1) {
    const event = events[i];
    const op = getEventOp(event);

    if (op === 'publish') {
      throw new Error('there can only be 1 publish event');
    }

    if (!OPS.has(op)) {
      throw new Error(`invalid op: ${op}`);
    }

    const [previousEventTag] = event.tags.filter(tag => tag[0] === 'e');
    const [_, previousEventId] = previousEventTag;

    if (previousEventId !== previousEvent.id) {
      throw new Error('previous event id doesnt match expected id');
    }

    const isLegit = verifySignature(event);
    if (!isLegit) {
      throw new Error('integrity check failed');
    }

    if (op === 'recover') {
      // get r from last recovery event
      const { r: expected } = JSON.parse(previousRecoverEvent.content);

      // hash revealed recovery key
      const test = hashRecoveryKey(event.pubkey);

      // compare
      if (expected !== test) {
        throw new Error('recovery check failed');
      }

      const verificationMethod = createNostrVerificationMethod(did, event.pubkey);
      const patch = { op: 'replace', path: '/verificationMethod/0', value: verificationMethod };

      // @ts-ignore
      jp.applyPatch(didDoc, [patch], true, true);
    }

    if (op === 'patch') {

    }

  }

  return didDoc;
}