export function hashHex(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  let h3 = 0x811c9dc5;
  let h4 = 0x01000193;
  for (let i = 0; i < input.length; i += 1) {
    const c = input.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= c + i;
    h2 = Math.imul(h2, 16777619);
    h3 = Math.imul(h3 ^ (c << (i % 8)), 2246822519);
    h4 = (h4 + c * (i + 1)) >>> 0;
  }
  const a = (h1 >>> 0).toString(16).padStart(8, "0");
  const b = (h2 >>> 0).toString(16).padStart(8, "0");
  const c = (h3 >>> 0).toString(16).padStart(8, "0");
  const d = (h4 >>> 0).toString(16).padStart(8, "0");
  return `${a}${b}${c}${d}${a}${b}${c}${d}`.slice(0, 64);
}

export function shortId(id: string, n = 8): string {
  return (id || "").slice(0, n);
}
