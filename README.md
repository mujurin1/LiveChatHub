# LiveChatHub

このアプリは生放送のコメントを表示するためのChromium系ブラウザ向けのブラウザ拡張機能です

scripts フォルダの構成
* components
* hooks
* slices
* その他のフォルダは現在使用していないフォルダです


## Bugs
* 高速で下までスクロールした時に最後の行のした部分のテキストが表示されない
  (存在はしている。謎)

## packages
メインのプロジェクトとは分けて管理しているプロジェクトです

* Common -
  汎用的な関数を置いているプロジェクトです
* [VirtualList](packages/VirtualList/README.md) -
  コメントを表示するリスト部分のコンポーネントです
