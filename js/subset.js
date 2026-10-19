// harfbuzz (hb-subset.wasm) で使用文字だけのフォントを作る
// pdf-lib 標準の subset は日本語フォントでグリフが欠けるため、こちらを使う
(function (root) {
  async function loadSubsetter(wasmBytes) {
    const { instance } = await WebAssembly.instantiate(wasmBytes);
    const ex = instance.exports;

    return function subset(fontBytes, text) {
      const fontPtr = ex.malloc(fontBytes.byteLength);
      new Uint8Array(ex.memory.buffer).set(new Uint8Array(fontBytes), fontPtr);
      const blob = ex.hb_blob_create(fontPtr, fontBytes.byteLength, 2 /* WRITABLE */, 0, 0);
      const face = ex.hb_face_create(blob, 0);
      ex.hb_blob_destroy(blob);

      const input = ex.hb_subset_input_create_or_fail();
      const set = ex.hb_subset_input_unicode_set(input);
      for (const ch of new Set(Array.from(text + ' '))) ex.hb_set_add(set, ch.codePointAt(0));
      const sub = ex.hb_subset_or_fail(face, input);
      ex.hb_subset_input_destroy(input);

      try {
        if (!sub) throw new Error('フォントのサブセット化に失敗しました');
        const res = ex.hb_face_reference_blob(sub);
        const ptr = ex.hb_blob_get_data(res, 0);
        const len = ex.hb_blob_get_length(res);
        const out = new Uint8Array(ex.memory.buffer).slice(ptr, ptr + len);
        ex.hb_blob_destroy(res);
        if (!len) throw new Error('フォントのサブセット化に失敗しました');
        return out;
      } finally {
        if (sub) ex.hb_face_destroy(sub);
        ex.hb_face_destroy(face);
        ex.free(fontPtr);
      }
    };
  }

  const api = { loadSubsetter };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FontSubset = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
