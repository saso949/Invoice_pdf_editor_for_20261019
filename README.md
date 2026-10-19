# 火災・新種保険金請求書 入力ツール

三井住友海上「火災・新種保険金請求書」のPDFに、ブラウザで入力した内容を書き込んでダウンロードする個人用の静的サイトです。

- すべてブラウザ内で処理し、外部へは通信しません（ライブラリ・フォントも同梱）
- 元のPDFはリポジトリに含めません。初回にPDFを選ぶと、その端末のブラウザ（IndexedDB）に保存されます
- 入力内容はブラウザ（localStorage）に自動保存されます。「保存・その他」でオフにできます。JSONファイルへの書き出しと読み込みもできます

## 使い方

1. 公開したページを開く
2. 「0. 元のPDF」で `保険金請求書（火災新種用）.pdf` を選ぶ
3. 各欄に入力する。右側（スマホでは下）にプレビューが出ます
4. 「PDFをダウンロード」を押す
5. 印刷して押印欄に押印する

## GitHub Pages で公開する

```sh
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

GitHub のリポジトリで Settings → Pages → Branch を `main` / `/ (root)` にします。

> GitHub Pages は無料プランだと公開サイトになります。このリポジトリには個人情報が入っていないので、公開しても入力内容やPDFが漏れることはありません（`.gitignore` で `*.pdf` と `*.json` を除外しています）。

## ローカルで動かす

`file://` では動かないので、簡易サーバーを使ってください。

```sh
python -m http.server 8000
# http://localhost:8000/ を開く
```

## 記入位置の調整

記入位置は `js/layout.js` にまとめてあります（単位はポイント、原点は左上）。ずれている欄があれば、その欄の `x` / `cy` を調整してください。

## 構成

| パス | 内容 |
| --- | --- |
| `index.html`, `css/`, `js/app.js` | 画面 |
| `js/layout.js` | 記入位置の定義 |
| `js/fill.js` | PDFへの書き込み（pdf-lib） |
| `js/subset.js` | フォントのサブセット化（harfbuzz）。pdf-lib 標準のサブセット化では日本語の文字が欠けるため |
| `fonts/` | BIZ UDPゴシック（SIL Open Font License） |
| `lib/` | pdf-lib, @pdf-lib/fontkit, pdf.js, hb-subset.wasm |
