# `did:nostr`

Thought experiment around bringing dids to nostr. 

# Why?
I have no idea whether this will work, or if it's a good idea. What has me interested is:
* Could provide a means for key rotation while keeping the same pubkey
* Could allow for interop between different protocols / systems
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
      "id": "#",
      "type": "NostrRelay",
      "serviceEndpoint": [" wss://relay.damus.io", "wss://relay.nostr.info"]
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

>_💡 TODO: figure out `id` property for `keyAgreement` and `service`_

so what do the properties in the DID document mean?
| property             | description                                                                                      | notes                                                                                                                        |
| :------------------- | ------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------- |
| `verificationMethod` | includes crypto keys that can be used for various purposes, such as to verify digital signatures | the key shown in the example above happens to be the decoded nostr pubkey                                                    |
| `service`            | lists services that can be used to interact with a DID                                           | the example includes the nostr relays that this DID publishes to. Could also include any other service e.g. a lightning node |
| `keyAgreement`       | lists keys that can be used to generate shared keys for encryption/decryption purposes           |                                                                                                                              |

# NIP-9325
⚠️ WIP ⚠️

This NIP defines a new event kind `9325` for publishing, patching, and recovering a DID.

every `9325` message should contain the `o` (e.g op) and `d` (e.g. `did`) tags
```json
{
  "kind": 9325,
  "tags": [
    ["o", "publish | patch | recover"],
    ["d", "did:nostr:npub1u2764y8fdf86lw03cdhekduwfw7kl63xuh28qcl8kv92zh0r04yqk6tcs5"]
  ]
}
```

## `publish`
```json
{
  "content": "{\"r\":\"99b23a194ca1195e5846ad0a1156bd1f8ea943526d90772b3c8a02730f9d5531\"}",
  "kind": 9325,
  "pubkey": "8ef849c9575c1ea46710adc49b4ca5a39dab7c358ea05e22e100ce67f751151c",
  "tags": [
    [
      "d",
      "nostr:did:npub13muynj2hts02gecs4hzfkn995ww6klp436s9ughpqr8x0a63z5wqmku93m"
    ],
    [
      "o",
      "publish"
    ]
  ]
}
```
* should only ever be 1 `publish` event for a given DID
* `content` is a stringified json object that contains the following properties:

| Property | Description                                |
| -------- | ------------------------------------------ |
| `r`      | double hashed (sha256) encoded next pubkey |


## `patch`
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

## `recover`
```json
{
  "kind": 9325,
  "pubkey": "TODO_ADD_PUBKEY_EXAMPLE"
  "tags": [
    ["d", "did:nostr:npub1u2764y8fdf86lw03cdhekduwfw7kl63xuh28qcl8kv92zh0r04yqk6tcs5"]
    ["e", "event id of most recent 9325 event for did"]
    ["o", "recover"],
  ],
  "content": "{\"r\":\"TODO_ADD_RECOVERY_KEY_EXAMPLE\"}"
}
```

`content` is a stringified json object that contains the following properties:
| Property | Description                                |
| -------- | ------------------------------------------ |
| `r`      | double hashed (sha256) encoded next pubkey |