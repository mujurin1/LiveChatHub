# VirtualList

画面に見える範囲のDOMのみを描画することで、
非常に長いリストをレンダリングする際のパフォーマンスを
最適化しているリストビューです


TODO:
* 現在は "virtual-list-lineup" の中の `Key` の順序が変わっている\
  これだと、別の行が表示される量のスクロールが起こると
  行のエレメントがDOMツリーから削除→追加が発生するためちょっと効率が悪い
  * 行のCSSは現在は "position: relative" で並べているが、
    これを "position: absolute" にして、各行に "top: XXpx" を付ける
  * 行に対する `Key` が変わると `RowRender` の中で `useState` を使っている場合に
    値が毎回リセットされるのでそれの対処をする
* 分割統治法



## 特徴

* リストビューの範囲内に表示される行 (コンテンツ) のみを描画している
* DOMの再利用をする最適化をしている
* スクロールによる描画内容の更新を完全に管理している
* 行ごとの高さは可変. 描画結果を元に全体の高さが調整される
* 表示行が変わらない程度のスクロールでも、再レンダリング**されてしまう**
  * TODO: 今後の課題 (VirutalList.tsx 内のTODOを参照)


## フック/コンポーネント

VirtualList を構成するフック
* useVirtualListState

VirtualList を構成するコンポーネント
* VirtualList
* VirtualListRow
* RowRender (インターフェースのみ. 実装はリストビューの利用者に任せる)


### useVirtualListState

リストビューの状態を管理するフック

引数を更新すると状態が更新され、ビューが更新される

> このフックが返す値はミュータブル (可変な値) である\
> そのため
> `const [refreshKey, refresh] = useState(0);`
> を定義し、React に再計算してもらう場合にこの値を更新している

主要な変数は以下
* contentHeights : コンテンツのIDをキー/描画後の高さを値として持つコレクション
* rowLayouts : 表示する行の情報 (RowLayout) を持つ連結リスト
* viewportRef : リストビュー全体の要素への参照 (className: virtual-list)
* scrollRef : リストビューのスクロール要素への参照 (classname: virtual-list-scrol)

主要な関数は以下
* addContent : リストビューに表示するコンテンツのIDを追加する
* updateRowHeight : コンテンツの高さを更新する


### VirtualList
VirtualList の利用者が扱う唯一のコンポーネントです\
`ResizeObserver` を使用して各行の高さを監視します


VirtualList コンポーネントの階層

* div (className: virtual-list)
  * div (className: virtual-list-scroll)
  * div (className: virtual-list-lineup)
    * VirtualListRow の配列
      * div (className: virtual-list-row)
        * RowRender または `undefined`


### VirtualListRow
リストビューの行単位のコンポーネントです

このコンポーネントは `RowLayout.RowKey` に対応して生成されます\
RowRender と `RowLayout.ContentId` を元に描画します

### RowRender
リストビューの各行の内容を描画するコンポーネントです\
インターフェースが定義されているだけで、実装は VirtualList の利用者から提供されます
