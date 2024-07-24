# Webページ内で特定の顔を識別するChrome拡張
face-api.js を使って、Webページ内の画像に自動でマーカ枠で囲う。

## development

```bash
pnpm install
pnpm run build
```
chrome://extensions/  
で「パッケージ化されていない拡張機能を読み込む」で取り込む。

## production release

```bash
pnpm run build
```
でdistディレクトリにビルドされる。  
そのdistディレクトリをzip圧縮して、
[Chrome デベロッパー ダッシュボード](https://chrome.google.com/webstore/devconsole?hl=ja) でアップロードする。

## specification

- ポップアップで対象人物画像を取り込む。syncストレージで顔記述子のみ保存する。
  - 画像自体はlocal保存する。(容量制限でsyncでは厳しいから。)
- モデルをロードする必要があり、重い。