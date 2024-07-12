# Webページ内で特定の顔を識別するChrome拡張
face-api.js を使って、Webページ内の画像に自動でマーカ枠で囲う。

## install

```
pnpm install
npm run build
```
chrome://extensions/  
で「パッケージ化されていない拡張機能を読み込む」で取り込む。


## specification

- アイコンでON・OFFをバッチ表示
- ポップアップで対象人物画像を取り込む。syncストレージで顔記述子のみ保存し、画像自体は保存しない。
- モデルをロードする必要があり、重い。