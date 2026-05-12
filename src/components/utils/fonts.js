let _notoFontBytesCache = null;

// Loaded once and cached so PDF saving doesn't re-fetch on every save.
export async function loadNotoFontBytes() {
  if (_notoFontBytesCache) return _notoFontBytesCache;
  const names = [
    "noto-sans-regular", "noto-sans-bold", "noto-sans-italic", "noto-sans-bold-italic",
    "noto-serif-regular", "noto-serif-bold",
    "noto-sans-mono-regular",
  ];
  const entries = await Promise.all(names.map(async (n) => {
    const res = await fetch(`/fonts/${n}.woff2`);
    return [n, await res.arrayBuffer()];
  }));
  _notoFontBytesCache = Object.fromEntries(entries);
  return _notoFontBytesCache;
}

