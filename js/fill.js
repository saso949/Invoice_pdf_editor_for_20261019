// 入力データをテンプレートPDFに書き込む（ブラウザ / Node 共通）
(function (root) {
  const INK = [0.05, 0.05, 0.18];
  const MIN_SIZE = 5;

  function toHalfDigits(s) {
    return String(s).replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  }

  function formatMoney(v) {
    const n = toHalfDigits(v).replace(/[,，\s円]/g, '');
    if (!/^\d+$/.test(n)) return String(v);
    return Number(n).toLocaleString('ja-JP');
  }

  // 口座名義用: 全角カタカナ化し、濁点・半濁点を1マスとして分割。空白は空マス。
  function toKanaCells(str) {
    let s = String(str).normalize('NFKC');
    s = s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
    s = s.normalize('NFD').replace(/゙/g, '゛').replace(/゚/g, '゜');
    return Array.from(s.replace(/\s/g, ' ')).map((c) => (c === ' ' ? '' : c.toUpperCase()));
  }

  function wrap(font, text, size, width) {
    const out = [];
    for (const para of String(text).split(/\r?\n/)) {
      let line = '';
      for (const ch of Array.from(para)) {
        if (line && font.widthOfTextAtSize(line + ch, size) > width) {
          out.push(line);
          line = ch;
        } else line += ch;
      }
      out.push(line);
    }
    return out;
  }

  // 入力値の前処理（購入金額の自動計算など）
  function prepare(data, itemRows) {
    const d = Object.assign({}, data);
    for (let i = 0; i < itemRows; i++) {
      const p = toHalfDigits(d[`item${i}_price`] || '').replace(/[,，円\s]/g, '');
      const q = toHalfDigits(d[`item${i}_qty`] || '').replace(/[\s]/g, '');
      if (!d[`item${i}_amount`] && /^\d+$/.test(p) && /^\d+$/.test(q)) {
        d[`item${i}_amount`] = String(Number(p) * Number(q));
      }
    }
    return d;
  }

  // 描画しうる文字をすべて集める（サブセット用）
  function usedChars(d) {
    let s = '0123456789,';
    for (const v of Object.values(d)) {
      if (typeof v !== 'string') continue;
      s += v + toHalfDigits(v) + toKanaCells(v).join('');
    }
    return s;
  }

  async function fillPdf({ PDFLib, fontkit, templateBytes, fontBytes, subsetFont, data, layout, itemRows, includeExamples }) {
    const { PDFDocument, rgb } = PDFLib;
    const ink = rgb(...INK);
    const doc = await PDFDocument.load(templateBytes);
    const pages = doc.getPages();
    if (pages.length < 2) throw new Error('テンプレートPDFのページ数が足りません（表面・裏面の2ページが必要です）');
    const d = prepare(data, itemRows);
    doc.registerFontkit(fontkit);
    const font = await doc.embedFont(subsetFont ? subsetFont(fontBytes, usedChars(d)) : fontBytes, { subset: false });

    const textAt = (page, str, x, cy, size, align, w) => {
      const H = page.getHeight();
      let s = size;
      if (w) while (s > MIN_SIZE && font.widthOfTextAtSize(str, s) > w) s -= 0.25;
      const tw = font.widthOfTextAtSize(str, s);
      let tx = x;
      if (align === 'center') tx = x + (w - tw) / 2;
      else if (align === 'right') tx = x + w - tw;
      page.drawText(str, { x: tx, y: H - (cy + s * 0.36), size: s, font, color: ink });
    };

    for (const f of layout) {
      const page = pages[f.page];
      const H = page.getHeight();
      const raw = d[f.key];

      if (f.type === 'circle') {
        const on = f.value === undefined ? raw === true : raw === f.value;
        if (on) {
          page.drawEllipse({ x: f.cx, y: H - f.cy, xScale: f.rx, yScale: f.ry, borderColor: ink, borderWidth: f.width || 1.1 });
        }
        continue;
      }
      if (raw === undefined || raw === null || String(raw).trim() === '') continue;
      let val = String(raw).trim();

      switch (f.type) {
        case 'text':
          if (f.money) val = formatMoney(val);
          textAt(page, val, f.x, f.cy, f.size, f.align || 'left', f.w);
          break;

        case 'cells': {
          let chars = Array.from(toHalfDigits(val).replace(/[\s\-ー－]/g, '')).slice(-f.count);
          const offset = f.align === 'right' ? f.count - chars.length : 0;
          chars.forEach((c, i) => textAt(page, c, f.x0 + (i + offset) * f.pitch, f.cy, f.size, 'center', f.pitch));
          break;
        }

        case 'kana': {
          const cells = toKanaCells(val);
          const topN = Math.floor((f.right - f.topX0) / f.pitch);
          const bottomN = Math.floor((f.right - f.bottomX0) / f.pitch);
          cells.slice(0, topN + bottomN).forEach((c, i) => {
            if (!c) return;
            const top = i < topN;
            const x = top ? f.topX0 + i * f.pitch : f.bottomX0 + (i - topN) * f.pitch;
            textAt(page, c, x, top ? f.topCy : f.bottomCy, f.size, 'center', f.pitch);
          });
          break;
        }

        case 'lines': {
          let s = f.size, ls;
          while (true) {
            ls = wrap(font, val, s, f.w);
            if (ls.length <= f.cys.length || s <= MIN_SIZE) break;
            s -= 0.25;
          }
          if (ls.length > f.cys.length) {
            // 行が足りない場合は罫線間に詰めて描画
            const top = f.cys[0] - (f.cys[1] - f.cys[0]) / 2;
            const span = (f.cys[1] - f.cys[0]) * f.cys.length;
            const lh = span / ls.length;
            ls.forEach((l, i) => textAt(page, l, f.x, top + lh * (i + 0.5), Math.min(s, lh * 0.9), 'left'));
          } else {
            ls.forEach((l, i) => textAt(page, l, f.x, f.cys[i], s, 'left'));
          }
          break;
        }

        case 'box': {
          let s = f.size, ls;
          while (true) {
            ls = wrap(font, val, s, f.w);
            if (ls.length * s * 1.2 <= f.h || s <= MIN_SIZE) break;
            s -= 0.25;
          }
          const lh = s * 1.2;
          const startCy = f.y + (f.h - lh * ls.length) / 2 + lh / 2;
          ls.forEach((l, i) => textAt(page, l, f.x, startCy + i * lh, s, 'left', f.w));
          break;
        }
      }
    }

    if (!includeExamples) {
      for (let i = doc.getPageCount() - 1; i >= 2; i--) doc.removePage(i);
    }
    return doc.save();
  }

  const api = { fillPdf, toKanaCells, formatMoney };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FormFiller = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
