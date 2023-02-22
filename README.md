# `did:nostr` <!-- omit in toc -->

Thought experiment around bringing dids to nostr. 

- [Why?](#why)
- [Brain Dump](#brain-dump)
  - [DIDs](#dids)
  - [DID Documents](#did-documents)
- [NIP-9325](#nip-9325)
  - [DID generation](#did-generation)
    - [Deriving base DID Document](#deriving-base-did-document)
  - [DID Event](#did-event)
    - [`publish`](#publish)
      - [Event](#event)
      - [Integrity Checks](#integrity-checks)
    - [`recover`](#recover)
      - [Event](#event-1)
      - [Integrity Checks](#integrity-checks-1)
    - [`patch`](#patch)
      - [Event](#event-2)
  - [Resolving](#resolving)


# Why?
I have no idea whether this will work, or if it's a good idea. What has me interested is:
* Could provide a means for key rotation while keeping the same pubkey
* Could allow for interop between different protocols / systems
* Could enable use of Verifiable Credentials
  * e.g. CashApp could issue cashtag Verifiable Credentials to DIDs.  This would basically allow people to have a "blue checkmark" or, more generally speaking, some trusted way to say "this pubkey is linked to this cashtag".
  * e.g. could introduce stuff like payments on nostr via CashApp simply by having a pubkey present their cashtag VC to a CashApp api endpoint. VC can be used as a form of authentication, since the VC was issued by CashApp
* Could allow for less reliance on DNS if desired

# Brain Dump

## DIDs
DIDs, like URLs are fully qualified URIs. Similar to a URL, DIDs can be resolved. resolving a URL like `https://snort.social/` returns html. So what does resolving a DID return? A DID document

## DID Documents
What is a DID document? it's a JSON object that contains information about the DID e.g. 
* how to contact this DID, 
* pubkeys this DID uses to sign messages, 
* asymmetric encryption keys that can be used to create shared keys and encrypt messages _for_ the DID. Example:

```json
{
  "id": "did:nostr:npub1u2764y8fdf86lw03cdhekduwfw7kl63xuh28qcl8kv92zh0r04yqk6tcs5",
  "verificationMethod": [
    {
      "id": "#nostr-0",
      "type": "SchnorrVerificationKey2023",
      "controller": "did:nostr:npub1u2764y8fdf86lw03cdhekduwfw7kl63xuh28qcl8kv92zh0r04yqk6tcs5",
      "publicKeyHex": "e2bdaa90e96a4fafb9f1c36f9b378e4bbd6fea26e5d47063e7b30aa15de37d48"
    }
  ],
  "service": [
    {
      "id": "#nostr",
      "type": "NostrRelay",
      "serviceEndpoint": ["wss://relay.damus.io", "wss://relay.nostr.info"]
    }
  ],
  "keyAgreement": [
    {
      "id": "#",
      "type": "X25519KeyAgreement2023",
      "controller": "did:nostr:npub1u2764y8fdf86lw03cdhekduwfw7kl63xuh28qcl8kv92zh0r04yqk6tcs5",
      "publicKeyHex": "75d92cea4ab8ef28a0a14acf103d6b8a2bb026120d62d1817fa5a4b11f534038"
    }
  ]
}
```

>_💡 TODO: think of more compelling `service` examples_

>_💡 TODO: figure out `id` property for `keyAgreement`_

so what do the properties in the DID document mean?
| property             | description                                                                                      | notes                                                                                                                        |
| :------------------- | ------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------- |
| `verificationMethod` | includes crypto keys that can be used for various purposes, such as to verify digital signatures | the key shown in the example above happens to be the decoded nostr pubkey                                                    |
| `service`            | lists services that can be used to interact with a DID                                           | the example includes the nostr relays that this DID publishes to. Could also include any other service e.g. a lightning node |
| `keyAgreement`       | lists keys that can be used to generate shared keys for encryption/decryption purposes           |                                                                                                                              |

>_💡 there are several other properties that can exist on DID documents. more info on that [here](https://www.w3.org/TR/did-core/)_

# NIP-9325
⚠️ WIP ⚠️

This NIP proposes the following:
* how to generate a nostr did
* a new event kind `9325` for publishing, patching, and recovering a DID.
* how to resolve a nostr DID


## DID generation
`did:nostr:<nip19_npub>`

1. encode public key in accordance to [nip19](https://github.com/nostr-protocol/nips/blob/master/19.md)
2. prefix the encoded key with `did:nostr:`

>💡 [reference implementation](https://github.com/mistermoe/did-nostr/blob/main/src/did-nostr.ts#L17-L21)

### Deriving base DID Document
the base DID document can be derived without sending a `publish` message to a relay. It's not all that useful in an of itself, but forms the foundation of DID resolution.

>💡 TODO: write out steps to derive base DID Document by reading reference implementation

>💡 [reference implementation](https://github.com/mistermoe/did-nostr/blob/main/src/did-nostr.ts#L114-L135)

```js
// from example.ts in reference implementation
const did = pubKeyToDid(kp.public);
console.log(deriveDidDoc(did));
```

Output
```json
{
  "id": "did:nostr:npub1g8nerhn2dahsk0yzpskmz7wqv70zcg52umktjkpukj9nu8ln2jmqfv3rsz",
  "verificationMethod": [
    {
      "id": "#nostr-0",
      "type": "SchnorrVerificationKey2023",
      "controller": "did:nostr:npub1g8nerhn2dahsk0yzpskmz7wqv70zcg52umktjkpukj9nu8ln2jmqfv3rsz",
      "publicKeyHex": "41e791de6a6f6f0b3c820c2db179c0679e2c228ae6ecb9583cb48b3e1ff354b6"
    }
  ]
}
```

## DID Event

<img width="1682" alt="image" src="https://user-images.githubusercontent.com/4887440/220267286-f72d70ac-edb9-42f1-bf85-ef012c365ead.png">


This event can be used to publish, patch, and recover a DID. every `9325` message should contain the `o` (e.g op) and `d` (e.g. `did`) tags
```json
{
  "kind": 9325,
  "tags": [
    ["o", "publish | patch | recover"],
    ["d", "did:nostr:npub1u2764y8fdf86lw03cdhekduwfw7kl63xuh28qcl8kv92zh0r04yqk6tcs5"]
  ]
}
```

### `publish`

#### Event
```json
{
  "content": "{\"r\":\"683c867bf3dc5e7993fdd0715771d36eb6f00b8a8645795c332246ea5f19c7d5\",\"patches\":[{\"op\":\"add\",\"path\":\"/service\",\"value\":[{\"id\":\"#nostr\",\"type\":\"NostrRelay\",\"serviceEndpoint\":[\"wss://relay.damus.io\"]}]}]}",
  "created_at": 1676957260,
  "kind": 9325,
  "pubkey": "e3932a8cd4ec81e1e9a41467470ec9db817accf21e1e8b939525e84da6786d9a",
  "tags": [
    ["d","did:nostr:npub1uwfj4rx5ajq7r6dyz3n5wrkfmwqh4n8jrc0ghyu4yh5ymfncdkdqrr649c"],
    ["o","publish"]
  ],
  "sig": "b1bae7a64d84ce63e40dfa24d299892116694ae71215f357ddad0a0091455e0b985b45ccca6f9354223dc3f0243a9eabcb6d874ff85fac7051493fee8aab2ef9"
}
```
* should only ever be 1 `publish` event for a given DID
* should be the first event of kind `9325` for a given DID
* the `o` tag should have a value of `publish`
* the `d` tag should be present and contain the relevant DID
* `content` is a stringified json object that contains the following properties:

| Property  | Description                                                                                                                             |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `r`       | double hashed (sha256) encoded recovery pubkey                                                                                          |
| `patches` | an array of [JSON patch ops](https://datatracker.ietf.org/doc/html/rfc6902/#section-4) that are applied on top of the base DID Document |
#### Integrity Checks
* `nip19.encode(event.pubkey)` should match the `id` of the DID found in the `d` tag.
* standard nostr `sig` verification

### `recover`

#### Event
```json
{
  "content": "{\"r\":\"0df32bb15f48f60c5d7e035bdfbc67507a8576109a422dd860ad1a7b4935b3e6\"}",
  "created_at": 1676957711,
  "kind": 9325,
  "pubkey": "b424a3e0ea03a1450feef4cdba3dd74892c3e18726f079f89db42d597dfceb4c",
  "tags": [
    ["d","did:nostr:npub13x4u4zkm04wm3f95ay9scr4e0hr0822hlsse4qaljf0mn3aagvcspfv3p6"],
    ["o", "recover"],
    ["e", "bd513634c49754383d9d4110ebeaa1433467c5b70da7ae2d2873cabcd5445451", "wss://relay.damus.io", "reply"]
  ],
  "sig": "1f3fdaf79dcf9fb7ab51834c80b28abc5e6a3850f0185bb5b616f4a5e133f188dc609be10462e551ea984fe403a32a4b0b8b492d0c9c45f63d4fdd4d38d8c46d",
}
```
* the `o` tag should have a value of `publish`
* the `d` tag should be present and contain the relevant DID
* should contain a [nip10](https://github.com/nostr-protocol/nips/blob/master/10.md#marked-e-tags-preferred) marked `e` tag pointing to the most recent event of kind `9325` for the relevant DID
  * _💡 If more than one `e` tag is allowed, it may be helpful to include an additional marked `root` `e` tag that points back to the initial publish event
  * _💡 If more than one `e` tag is allowed, it may be helpful to include an additional marked `mention` `e` tag that points back to the most recent `recover` event for the relevant DID
* `content` is a stringified json object that contains the following properties:

| Property | Description                             |
| -------- | --------------------------------------- |
| `r`      | new double hashed (sha256) recovery key |

>_💡 Note: any `r` should not be used more than once. Recovering should always include a new `r` that can be used for subsequent recoveries
#### Integrity Checks
* `sha256(sha256(event.pubkey))` should match `JSON.parse(previousEvent.content).r` of the most recent `recover` event if one exists or the initial `publish` event if no other `recover` events exist


### `patch`

#### Event
```json
{
  "kind": 9325,
  "tags": [
    ["d", "did:nostr:npub1u2764y8fdf86lw03cdhekduwfw7kl63xuh28qcl8kv92zh0r04yqk6tcs5"]
    ["e", "event id of most recent 9325 event for did"]
    ["o", "patch"],
  ],
  "content": "{\"patches\": [TODO_FILL_OUT]}"
}
```

* `content` is a stringified json object that contains the following properties:

| Property  | Description                                                                            |
| --------- | -------------------------------------------------------------------------------------- |
| `patches` | an array of [JSON patch ops](https://datatracker.ietf.org/doc/html/rfc6902/#section-4) |



## Resolving
>💡 [WIP reference implementation](https://github.com/mistermoe/did-nostr/blob/main/src/did-nostr.ts#L146-L224)

>💡 TODO: write out steps to resolve by reading reference implementation
