import { hashHex } from "@/lib/ledger/hash";

let wordsCache: string[] | null = null;

export async function loadWordlist(): Promise<string[]> {
  if (wordsCache) return wordsCache;
  const t = await fetch("/bip39.txt").then((r) => r.text());
  const words = t.trim().split(/\s+/);
  if (words.length !== 2048) throw new Error("bip39 wordlist");
  wordsCache = words;
  return words;
}

function entropyToMnemonic(entropy: Uint8Array, words: string[]): string {
  const bits: number[] = [];
  for (const b of entropy) for (let i = 7; i >= 0; i -= 1) bits.push((b >> i) & 1);
  const cs = (entropy.length * 8) / 32;
  let sum = 0;
  for (const b of entropy) sum = (sum + b) & 0xff;
  for (let i = 7; i >= 8 - cs; i -= 1) bits.push((sum >> i) & 1);
  const out: string[] = [];
  for (let i = 0; i < bits.length; i += 11) {
    let v = 0;
    for (let j = 0; j < 11; j += 1) v = (v << 1) | (bits[i + j] ?? 0);
    out.push(words[v % words.length]);
  }
  return out.join(" ");
}

export async function createMnemonic(): Promise<string> {
  const words = await loadWordlist();
  const entropy = crypto.getRandomValues(new Uint8Array(16));
  return entropyToMnemonic(entropy, words);
}

export async function addressFromMnemonic(mnemonic: string, index = 0): Promise<string> {
  return hashHex(`${mnemonic.normalize("NFKD")}|${index}|kovanica-wallet-v1`);
}

export async function importMnemonic(phrase: string): Promise<string> {
  const words = phrase.trim().toLowerCase().split(/\s+/);
  if (words.length !== 12 && words.length !== 24) throw new Error("Need 12 or 24 words");
  const list = await loadWordlist();
  for (const w of words) {
    if (!list.includes(w)) throw new Error(`Unknown word: ${w}`);
  }
  return words.join(" ");
}
