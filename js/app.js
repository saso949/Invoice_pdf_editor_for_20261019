(function () {
  'use strict';

  const STORAGE_KEY = 'kasai-claim-form-v1';
  const PERSIST_KEY = 'kasai-claim-persist';
  const { LAYOUT, ITEM_ROWS } = window.FormLayout;
  const PREFS = ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県', '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県', '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'];

  const $ = (s) => document.querySelector(s);
  const form = $('#form');
  const state = { template: null, templateName: '', fontBytes: null, subsetFont: null, pdfBytes: null, busy: false, again: false };

  pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js';

  // ---------- IndexedDB（テンプレートPDFの保存） ----------
  function idb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('kasai-claim', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('files');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function idbRun(mode, fn) {
    const db = await idb();
    return new Promise((resolve, reject) => {
      const req = fn(db.transaction('files', mode).objectStore('files'));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  const idbGet = (k) => idbRun('readonly', (s) => s.get(k));
  const idbSet = (k, v) => idbRun('readwrite', (s) => s.put(v, k));
  const idbDel = (k) => idbRun('readwrite', (s) => s.delete(k));

  function safeStorage(fn, fallback) {
    try { return fn(); } catch (e) { return fallback; }
  }

  // ---------- 画面の構築 ----------
  const prefSel = $('#pref');
  PREFS.forEach((p) => prefSel.add(new Option(p, p)));

  const tbody = $('#items');
  for (let i = 0; i < ITEM_ROWS; i++) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i + 1}</td>
      <td><input name="item${i}_name"></td>
      <td><input name="item${i}_maker"></td>
      <td><input name="item${i}_y" inputmode="numeric" maxlength="4" class="w-y"></td>
      <td><input name="item${i}_m" inputmode="numeric" maxlength="2" class="w-mo"></td>
      <td><input name="item${i}_price" inputmode="numeric"></td>
      <td><input name="item${i}_qty" inputmode="numeric" class="w-q"></td>
      <td><input name="item${i}_amount" inputmode="numeric"></td>`;
    tbody.appendChild(tr);
  }

  function message(text, isError) {
    const el = $('#message');
    el.textContent = text || '';
    el.classList.toggle('error', !!isError);
  }

  // ---------- 入力値の収集・復元 ----------
  function readForm() {
    const v = {};
    for (const el of form.elements) {
      if (!el.name) continue;
      if (el.type === 'radio') { if (el.checked) v[el.name] = el.value; }
      else if (el.type === 'checkbox') v[el.name] = el.checked;
      else if (el.type !== 'file') v[el.name] = el.value;
    }
    return v;
  }

  function writeForm(v) {
    for (const el of form.elements) {
      if (!el.name || !(el.name in v)) continue;
      if (el.type === 'radio') el.checked = el.value === v[el.name];
      else if (el.type === 'checkbox') el.checked = !!v[el.name];
      else if (el.type !== 'file') el.value = v[el.name] ?? '';
    }
    updateVisibility();
    updateKanaPreviews();
    updateAmountPlaceholders();
  }

  const strip0 = (s) => String(Number(s));

  // フォーム値 → PDF書き込み用データ
  function toPdfData(v) {
    const d = Object.assign({}, v);
    const date = (key) => (v[key] ? v[key].split('-') : null);

    const k = date('kinyu_date');
    if (k) Object.assign(d, { kinyu_y: k[0].slice(2), kinyu_m: strip0(k[1]), kinyu_d: strip0(k[2]) });
    const b = date('birth_date');
    if (b) Object.assign(d, { birth_y: b[0], birth_m: strip0(b[1]), birth_d: strip0(b[2]) });
    const o = date('occ_date');
    if (o) Object.assign(d, { occ_y: o[0].slice(2), occ_m: strip0(o[1]), occ_d: strip0(o[2]) });
    const p = date('police_date');
    if (p) Object.assign(d, { police_y: p[0], police_m: strip0(p[1]), police_d: strip0(p[2]) });

    if (v.occ_time) {
      const [h, m] = v.occ_time.split(':').map(Number);
      Object.assign(d, { occ_ampm: h < 12 ? '午前' : '午後', occ_h: String(h % 12), occ_min: String(m) });
    }
    if (v.pref) {
      const suffix = v.pref.slice(-1);
      Object.assign(d, { pref_suffix: suffix, pref_name: v.pref.slice(0, -1) });
    }
    return d;
  }

  // ---------- 表示補助 ----------
  function updateVisibility() {
    const v = readForm();
    document.querySelectorAll('[data-show]').forEach((el) => {
      const [k, val] = el.dataset.show.split('=');
      el.hidden = v[k] !== val;
    });
  }

  function updateKanaPreviews() {
    document.querySelectorAll('.kana-preview').forEach((el) => {
      const input = form.elements[el.dataset.for];
      const cells = FormFiller.toKanaCells(input.value.trim());
      el.innerHTML = '';
      if (!cells.length) return;
      cells.forEach((c) => {
        const s = document.createElement('span');
        s.textContent = c || ' ';
        el.appendChild(s);
      });
      if (cells.length > 51) el.insertAdjacentHTML('beforeend', '<em>マスが足りません</em>');
    });
  }

  function updateAmountPlaceholders() {
    for (let i = 0; i < ITEM_ROWS; i++) {
      const price = Number(String(form.elements[`item${i}_price`].value).replace(/[^\d]/g, ''));
      const qty = Number(String(form.elements[`item${i}_qty`].value).replace(/[^\d]/g, ''));
      form.elements[`item${i}_amount`].placeholder = price && qty ? (price * qty).toLocaleString('ja-JP') : '';
    }
  }

  // ---------- 保存 ----------
  function save() {
    if (!$('#persist').checked) return;
    safeStorage(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(readForm())));
  }

  // ---------- PDF生成とプレビュー ----------
  async function ensureFont() {
    if (state.fontBytes && state.subsetFont) return;
    const [font, wasm] = await Promise.all([
      fetch('fonts/BIZUDPGothic-Regular.ttf').then((r) => { if (!r.ok) throw new Error('フォントを読み込めません'); return r.arrayBuffer(); }),
      fetch('lib/hb-subset.wasm').then((r) => { if (!r.ok) throw new Error('hb-subset.wasm を読み込めません'); return r.arrayBuffer(); }),
    ]);
    state.fontBytes = new Uint8Array(font);
    state.subsetFont = await FontSubset.loadSubsetter(wasm);
  }

  async function generate() {
    await ensureFont();
    return FormFiller.fillPdf({
      PDFLib, fontkit,
      templateBytes: state.template,
      fontBytes: state.fontBytes,
      subsetFont: state.subsetFont,
      data: toPdfData(readForm()),
      layout: LAYOUT,
      itemRows: ITEM_ROWS,
      includeExamples: $('#include-examples').checked,
    });
  }

  async function renderPreview(bytes) {
    const doc = await pdfjsLib.getDocument({ data: bytes.slice(), cMapUrl: 'lib/cmaps/', cMapPacked: true }).promise;
    const box = $('#preview');
    const width = box.clientWidth || 600;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const canvases = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const vp = page.getViewport({ scale: (width / base.width) * dpr });
      const c = document.createElement('canvas');
      c.width = vp.width;
      c.height = vp.height;
      await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
      canvases.push(c);
    }
    box.replaceChildren(...canvases);
    doc.destroy();
  }

  async function refresh() {
    if (!state.template) return;
    if (state.busy) { state.again = true; return; }
    state.busy = true;
    message('生成中…');
    try {
      const bytes = await generate();
      state.pdfBytes = bytes;
      $('#download').disabled = false;
      await renderPreview(bytes);
      message('');
    } catch (e) {
      console.error(e);
      message('PDFの生成に失敗しました: ' + e.message, true);
    } finally {
      state.busy = false;
      if (state.again) { state.again = false; refresh(); }
    }
  }

  let timer = 0;
  function scheduleRefresh() {
    clearTimeout(timer);
    timer = setTimeout(refresh, 700);
  }

  function download() {
    if (!state.pdfBytes) return;
    const blob = new Blob([state.pdfBytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    const t = new Date();
    const ymd = `${t.getFullYear()}${String(t.getMonth() + 1).padStart(2, '0')}${String(t.getDate()).padStart(2, '0')}`;
    a.href = URL.createObjectURL(blob);
    a.download = `保険金請求書_記入済_${ymd}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }

  // ---------- テンプレートPDF ----------
  async function setTemplate(bytes, name, store) {
    try {
      const doc = await PDFLib.PDFDocument.load(bytes);
      const pages = doc.getPages();
      if (pages.length < 2) throw new Error('2ページ以上のPDFが必要です');
      const { width, height } = pages[0].getSize();
      const warn = Math.abs(width - 595.28) > 3 || Math.abs(height - 841.89) > 3;
      state.template = bytes;
      state.templateName = name;
      $('#template-status').textContent = `✓ ${name}（${pages.length}ページ）`;
      $('#template-clear').hidden = false;
      $('#drop').classList.add('loaded');
      if (store) await idbSet('template', { name, bytes }).catch(() => {});
      message(warn ? 'ページサイズが想定（A4）と違います。記入位置がずれる可能性があります。' : '', warn);
      refresh();
    } catch (e) {
      message('PDFを読み込めませんでした: ' + e.message, true);
    }
  }

  async function onFile(file) {
    if (!file) return;
    const bytes = new Uint8Array(await file.arrayBuffer());
    setTemplate(bytes, file.name, true);
  }

  // ---------- イベント ----------
  $('#template-file').addEventListener('change', (e) => onFile(e.target.files[0]));
  const drop = $('#drop');
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('over');
    onFile(e.dataTransfer.files[0]);
  });
  $('#template-clear').addEventListener('click', async () => {
    await idbDel('template').catch(() => {});
    state.template = null;
    state.pdfBytes = null;
    $('#download').disabled = true;
    $('#template-status').textContent = 'PDFを選択（またはここにドロップ）';
    $('#template-clear').hidden = true;
    $('#drop').classList.remove('loaded');
    $('#preview').innerHTML = '<p class="placeholder">PDFを選ぶとここにプレビューが表示されます</p>';
  });

  form.addEventListener('input', (e) => {
    if (e.target.type === 'file') return;
    if (e.target.dataset.kana !== undefined) updateKanaPreviews();
    if (/^item\d+_(price|qty)$/.test(e.target.name)) updateAmountPlaceholders();
    updateVisibility();
    save();
    scheduleRefresh();
  });
  form.addEventListener('change', (e) => {
    if (e.target.dataset.kana !== undefined) {
      // 全角カタカナに整える
      e.target.value = e.target.value.normalize('NFKC')
        .replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60))
        .replace(/\s+/g, ' ');
      updateKanaPreviews();
      save();
    }
  });

  $('#today').addEventListener('click', () => {
    const t = new Date();
    form.elements.kinyu_date.value = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    form.dispatchEvent(new Event('input'));
    save();
    scheduleRefresh();
  });

  $('#refresh').addEventListener('click', refresh);
  $('#download').addEventListener('click', async () => {
    clearTimeout(timer);
    await refresh();
    download();
  });
  $('#include-examples').addEventListener('change', scheduleRefresh);

  $('#persist').addEventListener('change', (e) => {
    safeStorage(() => localStorage.setItem(PERSIST_KEY, e.target.checked ? '1' : '0'));
    if (e.target.checked) save();
    else safeStorage(() => localStorage.removeItem(STORAGE_KEY));
  });

  $('#export-json').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(readForm(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '保険金請求書_入力内容.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  });
  $('#import-json').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      writeForm(JSON.parse(await f.text()));
      save();
      refresh();
      message('入力内容を読み込みました');
    } catch (err) {
      message('読み込みに失敗しました: ' + err.message, true);
    }
    e.target.value = '';
  });
  $('#reset').addEventListener('click', () => {
    if (!window.confirm('入力内容をすべて消去しますか？（元のPDFは残ります）')) return;
    const keep = [$('#persist').checked, $('#include-examples').checked];
    form.reset();
    [$('#persist').checked, $('#include-examples').checked] = keep;
    safeStorage(() => localStorage.removeItem(STORAGE_KEY));
    updateVisibility();
    updateKanaPreviews();
    updateAmountPlaceholders();
    refresh();
  });

  // ---------- 起動 ----------
  (async function init() {
    const persist = safeStorage(() => localStorage.getItem(PERSIST_KEY), null) !== '0';
    $('#persist').checked = persist;
    if (persist) {
      const saved = safeStorage(() => JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'), null);
      if (saved) writeForm(saved);
    }
    updateVisibility();
    ensureFont().catch((e) => message(e.message, true));
    const stored = await idbGet('template').catch(() => null);
    if (stored && stored.bytes) setTemplate(new Uint8Array(stored.bytes), stored.name, false);
  })();
})();
