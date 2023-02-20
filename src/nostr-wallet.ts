import * as bip39 from '@scure/bip39';
import * as secp256k1 from '@noble/secp256k1';
import { HDKey } from '@scure/bip32';
import nostrTools from 'nostr-tools';

const { nip06 } = nostrTools;

const { bytesToHex } = secp256k1.utils;

function DER_PATH(addressIdx: number): string {
  return `m/44'/1237'/0'/0/${addressIdx}`;
}

export class NostrWallet {
  private root: HDKey;

  constructor(mnemonic: string, passphrase?: string) {
    passphrase = passphrase ?? '';

    const seed = bip39.mnemonicToSeedSync(mnemonic, passphrase);
    this.root = HDKey.fromMasterSeed(seed);
  }

  static create(passphrase?: string): { 'mnemonic': string, 'wallet': NostrWallet } {
    const mnemonic = nip06.generateSeedWords();

    const wallet = new NostrWallet(mnemonic, passphrase);

    return { mnemonic, wallet };
  }

  getPrivateKey(idx: number = 0): string {
    const derPath = DER_PATH(idx);
    const { privateKey } = this.root.derive(derPath);

    if (!privateKey) {
      throw new Error(`failed to derive public key at ${derPath}`);
    }

    return bytesToHex(privateKey);
  }

  getPublickey(idx: number = 0): string {
    const privateKey = this.getPrivateKey(idx);
    const publicKey = secp256k1.schnorr.getPublicKey(privateKey);

    return bytesToHex(publicKey);
  }
}