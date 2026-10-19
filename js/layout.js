// 保険金請求書（火災新種用）の記入位置定義
// 座標はPDFのポイント単位（A4: 595.28 x 841.89）、原点は左上。
//   text   : 1行テキスト。cy=縦中心、align=left|center|right（right は x+w が右端）
//   box    : 折返し付きテキスト。x,y,w,h の枠に収まるよう縮小
//   lines  : 罫線ごとに1行ずつ（自動折返し）
//   cells  : 1マス1文字。x0=最初のマスの左端、pitch=マス幅
//   kana   : 口座名義（上段→下段にあふれる）
//   circle : data[key] === value のとき楕円で囲む（value 省略時は true で描画）
(function (root) {
  const P0 = 0, P1 = 1;
  const L = [];

  // ---------- 表面 1 ----------
  L.push(
    { type: 'text', page: P0, key: 'kinyu_y', x: 180, w: 32, cy: 215.5, size: 13, align: 'center' },
    { type: 'text', page: P0, key: 'kinyu_m', x: 230, w: 30, cy: 215.5, size: 13, align: 'center' },
    { type: 'text', page: P0, key: 'kinyu_d', x: 276, w: 30, cy: 215.5, size: 13, align: 'center' },
    { type: 'circle', page: P0, key: 'same_as_contractor', cx: 159.6, cy: 265.8, rx: 27, ry: 7 },
    { type: 'text', page: P0, key: 'birth_y', x: 442, w: 37, cy: 267, size: 10, align: 'center' },
    { type: 'text', page: P0, key: 'birth_m', x: 491, w: 17, cy: 267, size: 10, align: 'center' },
    { type: 'text', page: P0, key: 'birth_d', x: 519, w: 17, cy: 267, size: 10, align: 'center' },
  );

  // ---------- 表面 2 ----------
  L.push(
    { type: 'cells', page: P0, key: 'zip1', x0: 123.9, pitch: 10.33, count: 3, cy: 335.2, size: 10 },
    { type: 'cells', page: P0, key: 'zip2', x0: 165.2, pitch: 10.33, count: 4, cy: 335.2, size: 10 },
    { type: 'text', page: P0, key: 'pref_name', x: 212, w: 53, cy: 335.5, size: 11, align: 'right' },
    { type: 'circle', page: P0, key: 'pref_suffix', value: '都', cx: 272.2, cy: 335.1, rx: 7.2, ry: 7.2 },
    { type: 'circle', page: P0, key: 'pref_suffix', value: '道', cx: 286.9, cy: 335.1, rx: 7.2, ry: 7.2 },
    { type: 'circle', page: P0, key: 'pref_suffix', value: '府', cx: 300.7, cy: 335.1, rx: 7.2, ry: 7.2 },
    { type: 'circle', page: P0, key: 'pref_suffix', value: '県', cx: 315.0, cy: 335.1, rx: 7.2, ry: 7.2 },
    { type: 'text', page: P0, key: 'addr1', x: 326, w: 116, cy: 335.5, size: 10.5 },
    { type: 'text', page: P0, key: 'addr2', x: 124, w: 316, cy: 357.5, size: 11 },
    { type: 'text', page: P0, key: 'name_kana', x: 158, w: 282, cy: 375.6, size: 9 },
    { type: 'text', page: P0, key: 'name', x: 152, w: 288, cy: 399, size: 14 },
    { type: 'text', page: P0, key: 'tel1', x: 191, w: 54, cy: 426.3, size: 11, align: 'center' },
    { type: 'text', page: P0, key: 'tel2', x: 253, w: 66, cy: 426.3, size: 11, align: 'center' },
    { type: 'text', page: P0, key: 'tel3', x: 332, w: 100, cy: 426.3, size: 11, align: 'center' },
    { type: 'text', page: P0, key: 'co_owner1', x: 123, w: 129, cy: 451.5, size: 11 },
    { type: 'text', page: P0, key: 'co_owner2', x: 365, w: 129, cy: 451.5, size: 11 },
  );

  // ---------- 表面 3 振込口座 ----------
  L.push(
    { type: 'circle', page: P0, key: 'pay_method', value: 'furikae', cx: 109.3, cy: 510.7, rx: 6.5, ry: 6.5, width: 1.6 },
    { type: 'circle', page: P0, key: 'pay_method', value: 'bank', cx: 109.3, cy: 570.0, rx: 6.5, ry: 6.5, width: 1.6 },
    { type: 'circle', page: P0, key: 'pay_method', value: 'yucho', cx: 109.3, cy: 631.4, rx: 6.5, ry: 6.5, width: 1.6 },

    { type: 'text', page: P0, key: 'bank_name', x: 170, w: 158, cy: 547.5, size: 12 },
    { type: 'circle', page: P0, key: 'bank_type', value: '銀行', cx: 342.3, cy: 541.7, rx: 10.5, ry: 5.3 },
    { type: 'circle', page: P0, key: 'bank_type', value: '信金', cx: 342.1, cy: 552.6, rx: 10.5, ry: 5.3 },
    { type: 'circle', page: P0, key: 'bank_type', value: '信組', cx: 369.6, cy: 541.6, rx: 10.5, ry: 5.3 },
    { type: 'circle', page: P0, key: 'bank_type', value: '農協', cx: 369.3, cy: 552.5, rx: 10.5, ry: 5.3 },
    { type: 'text', page: P0, key: 'branch_name', x: 410, w: 112, cy: 547.5, size: 12 },
    { type: 'circle', page: P0, key: 'branch_type', value: '支店', cx: 535.1, cy: 541.6, rx: 10.5, ry: 5.3 },
    { type: 'circle', page: P0, key: 'branch_type', value: '支所', cx: 534.9, cy: 552.5, rx: 10.5, ry: 5.3 },
    { type: 'cells', page: P0, key: 'branch_no', x0: 196.5, pitch: 18.07, count: 3, cy: 568.6, size: 13 },
    { type: 'circle', page: P0, key: 'acct_type', value: '普通', cx: 294.3, cy: 568.3, rx: 18, ry: 5.5 },
    { type: 'circle', page: P0, key: 'acct_type', value: '当座', cx: 325.5, cy: 568.6, rx: 11, ry: 5.5 },
    { type: 'circle', page: P0, key: 'acct_type', value: '貯蓄', cx: 348.8, cy: 568.5, rx: 11, ry: 5.5 },
    { type: 'circle', page: P0, key: 'acct_type', value: '別段', cx: 372.0, cy: 568.5, rx: 11, ry: 5.5 },
    { type: 'cells', page: P0, key: 'acct_no', x0: 423.3, pitch: 18.2, count: 7, cy: 568.6, size: 13, align: 'right' },
    { type: 'kana', page: P0, key: 'bank_holder', topX0: 246.1, topCy: 585.4, bottomX0: 207.9, bottomCy: 596.3, pitch: 12.7, right: 551, size: 9.5 },

    { type: 'cells', page: P0, key: 'yucho_kigo', x0: 251.2, pitch: 18.4, count: 3, cy: 618.4, size: 13 },
    { type: 'cells', page: P0, key: 'yucho_no', x0: 404.8, pitch: 18.24, count: 8, cy: 618.4, size: 13, align: 'right' },
    { type: 'kana', page: P0, key: 'yucho_holder', topX0: 246.1, topCy: 635.4, bottomX0: 207.9, bottomCy: 646.3, pitch: 12.7, right: 551, size: 9.5 },
  );

  // ---------- 表面 4 他の保険契約 ----------
  L.push(
    { type: 'circle', page: P0, key: 'other_ins', value: 'なし', cx: 140.5, cy: 700.6, rx: 13, ry: 6 },
    { type: 'circle', page: P0, key: 'other_ins', value: 'あり', cx: 140.1, cy: 714.7, rx: 13, ry: 6 },
    { type: 'text', page: P0, key: 'oi_company', x: 307, w: 243, cy: 701.5, size: 10.5 },
    { type: 'text', page: P0, key: 'oi_kind', x: 250, w: 128, cy: 720.2, size: 10 },
    { type: 'text', page: P0, key: 'oi_policy', x: 456, w: 95, cy: 720.2, size: 10 },
    { type: 'text', page: P0, key: 'oi_holder', x: 250, w: 128, cy: 738.4, size: 10 },
    { type: 'circle', page: P0, key: 'oi_claim', value: 'なし', cx: 479.5, cy: 739.0, rx: 13, ry: 6 },
    { type: 'circle', page: P0, key: 'oi_claim', value: 'あり', cx: 524.0, cy: 738.7, rx: 13, ry: 6 },
  );

  // ---------- 裏面 5 事故の内容 ----------
  L.push(
    { type: 'text', page: P1, key: 'occ_y', x: 163, w: 32, cy: 134.5, size: 13, align: 'center' },
    { type: 'text', page: P1, key: 'occ_m', x: 210, w: 30, cy: 134.5, size: 13, align: 'center' },
    { type: 'text', page: P1, key: 'occ_d', x: 256, w: 30, cy: 134.5, size: 13, align: 'center' },
    { type: 'circle', page: P1, key: 'occ_ampm', value: '午前', cx: 322.7, cy: 132.3, rx: 13, ry: 6 },
    { type: 'circle', page: P1, key: 'occ_ampm', value: '午後', cx: 358.8, cy: 132.3, rx: 13, ry: 6 },
    { type: 'text', page: P1, key: 'occ_h', x: 380, w: 26, cy: 135, size: 12, align: 'center' },
    { type: 'text', page: P1, key: 'occ_min', x: 419, w: 24, cy: 135, size: 12, align: 'center' },
    { type: 'circle', page: P1, key: 'occ_kind', value: '発生', cx: 486.5, cy: 132.1, rx: 13, ry: 6 },
    { type: 'circle', page: P1, key: 'occ_kind', value: '発見', cx: 523.0, cy: 132.1, rx: 13, ry: 6 },
    { type: 'circle', page: P1, key: 'place_same', cx: 150.6, cy: 159.3, rx: 33, ry: 11.5 },
    { type: 'text', page: P1, key: 'place', x: 188, w: 355, cy: 159.5, size: 10.5 },
    { type: 'lines', page: P1, key: 'situation', x: 118, w: 425, cys: [185, 208, 231], size: 10.5 },

    { type: 'text', page: P1, key: 'police', x: 164, w: 134, cy: 278.5, size: 10.5 },
    { type: 'text', page: P1, key: 'police_y', x: 398, w: 52, cy: 280.5, size: 10.5, align: 'center' },
    { type: 'text', page: P1, key: 'police_m', x: 464, w: 28, cy: 280.5, size: 10.5, align: 'center' },
    { type: 'text', page: P1, key: 'police_d', x: 505, w: 28, cy: 280.5, size: 10.5, align: 'center' },
    { type: 'text', page: P1, key: 'reporter', x: 164, w: 171, cy: 301.7, size: 10.5 },
    { type: 'text', page: P1, key: 'receipt_no', x: 380, w: 161, cy: 301.7, size: 10.5 },
    { type: 'text', page: P1, key: 'cash', x: 210, w: 124, cy: 331.5, size: 11.5, align: 'right', money: true },
    { type: 'text', page: P1, key: 'savings', x: 405, w: 125, cy: 331.5, size: 11.5, align: 'right', money: true },
  );

  // ---------- 裏面 6 損害 ----------
  L.push(
    { type: 'box', page: P1, key: 'damage_place', x: 164, y: 370, w: 161, h: 54, size: 10.5 },
    { type: 'text', page: P1, key: 'repair_amount', x: 400, w: 130, cy: 414, size: 12, align: 'right', money: true },
  );
  // 家財・その他の動産（11行）。年ラベルの上端y
  const nenTop = [467.4, 498.2, 530.2, 561.2, 592.6, 623.2, 655.7, 686.0, 717.2, 749.4, 780.7];
  nenTop.forEach((t, i) => {
    const cy = t + 5.8;              // 年・円ラベルの縦中心
    const top = t - 16;              // 行の上端
    L.push(
      { type: 'box', page: P1, key: `item${i}_name`, x: 119, y: top + 1.5, w: 87, h: 27, size: 10 },
      { type: 'box', page: P1, key: `item${i}_maker`, x: 211, y: top + 1.5, w: 83, h: 27, size: 10 },
      { type: 'text', page: P1, key: `item${i}_y`, x: 301, w: 30, cy, size: 10, align: 'right' },
      { type: 'text', page: P1, key: `item${i}_m`, x: 345, w: 16, cy, size: 10, align: 'right' },
      { type: 'text', page: P1, key: `item${i}_price`, x: 388, w: 49, cy, size: 10, align: 'right', money: true },
      { type: 'text', page: P1, key: `item${i}_qty`, x: 453, w: 27, cy, size: 10, align: 'center' },
      { type: 'text', page: P1, key: `item${i}_amount`, x: 483, w: 50, cy, size: 10, align: 'right', money: true },
    );
  });

  const api = { LAYOUT: L, ITEM_ROWS: nenTop.length };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FormLayout = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
