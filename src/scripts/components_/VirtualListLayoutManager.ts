import { Trigger, assertNotNullish } from "@lch/common";

/* ListView 表示されるビュー
 * Row      リストの行
 * Item     リストの要素。アイテム
 *
 */


/**
 * リストに表示する要素。アイテムのレイアウト
 */
export interface ItemLayout {
  /**
   * アイテムのインデックス
   */
  readonly index: number;
  /**
   * 表示する行のエレメントに適用するレイアウト
   */
  readonly style: {
    readonly top: number;
    readonly minHeight: number;
  };
}

/**
 * 実際に表示する並べる行のレイアウト
 */
export interface RowLayout {
  /**
   * 行のキー
   */
  readonly key: string;
  /**
   * アイテム
   */
  readonly itemLayout: ItemLayout;
}

/**
 * リストビュー
 */
export interface ListViewLayout {
  /**
   * スクロールするエリアの高さ
   */
  readonly scrollHeight: number;
  /**
   * 表示する行の数
   */
  readonly visibleRowCount: number;
  /**
   * 各行レイアウトの配列
   */
  readonly rowLayouts: RowLayout[];
}

export class VirtualListLayoutManager {
  /**
   * リストビューの高さ
   */
  #viewportHeight = 0;
  /**
   * スクロール位置
   */
  #scrollTop = 0;
  /**
   * 自動スクロール
   */
  #autoScroll = true;
  /**
   * 行の最小縦幅.デフォルトの高さとしても利用する
   */
  #minHeight: number;
  /**
   * アイテムのレイアウトの配列
   */
  #itemLayouts: ItemLayout[] = [];
  /**
   * リストビュー全体のレイアウト
   */
  #listViewLayout: ListViewLayout;
  readonly #onScroll = new Trigger<[number]>();
  /**
   * スクロール位置が変更されたら呼ばれる
   */
  public readonly onScroll = this.#onScroll.asSetOnlyTrigger();
  readonly #onRecomputedLayout = new Trigger();
  /**
   * リストビュー全体のレイアウトが変更されたら呼ばれる
   */
  public readonly onRecomputedLayout =
    this.#onRecomputedLayout.asSetOnlyTrigger();

  /**
   * コンストラクタ
   * @param minRowHeight 最小の行の高さ.デフォルトの高さとしても利用される
   * @param itemCount アイテムの数
   */
  public constructor(minRowHeight: number, itemCount: number) {
    this.#minHeight = minRowHeight;
    this.#itemLayouts = createItemLayouts(itemCount, this.#minHeight);
    this.#listViewLayout = {
      scrollHeight: itemCount * minRowHeight,
      visibleRowCount: 0,
      rowLayouts: [],
    };
    this.#autoScroll =
      itemCount * minRowHeight - this.#viewportHeight <= this.#scrollTop;
  }

  /**
   * スクロール位置
   */
  public get scrollTop() {
    return this.#scrollTop;
  }

  /**
   * リストビュー全体のレイアウト
   */
  public get listViewLayout() {
    return this.#listViewLayout;
  }

  /**
   * リストビューの高さを変更する
   * @param height 高さ
   */
  public setViewportHeight(height: number): void {
    if (height === this.#viewportHeight) return;
    const dif = height - this.#viewportHeight;

    this.#viewportHeight = height;

    const minScrollTop = 0;
    const maxScrollTop = Math.max(this.#listViewLayout.scrollHeight - height, 0);
    this.#scrollTop = Math.min(Math.max(minScrollTop, this.#scrollTop - dif), maxScrollTop);

    this.recomputeListViewLayout(false, this.#autoScroll);

    // ビューの高さが変わるとスクロール位置も変える（上でなく下の行に合わせるため）
    // ただ、連続して高さを変更すると`setScrollPosition`の中で、
    // `top`と`#scrollTop`の位置が違うため、プログラムからのスクロールなのに以降の処理に進む不具合がある
    // 先にレイアウト変更イベントを呼んで貰うため
    setTimeout(() => {
      this.#onScroll.fire(this.#scrollTop);
    }, 0);
  }

  /**
   * 指定位置までスクロールする
   * @param top スクロール座標
   */
  public setScrollPosition(top: number): void {
    const minScrollTop = 0;
    const maxScrollTop = Math.max(
      this.#listViewLayout.scrollHeight - this.#viewportHeight,
      0
    );
    top = Math.min(Math.max(minScrollTop, top), maxScrollTop);

    // （現状最適だが不具合のある）プログラムかユーザーかどっちのスクロールか判定する分岐
    // true ならプログラム
    if (top === this.#scrollTop) return;

    const scrollUp = this.#scrollTop > top;

    this.#scrollTop = top;

    this.recomputeListViewLayout(false, scrollUp ? false : undefined);
  }

  /**
   * 新しい行の数をセットする
   * @param rowCount 新しい行の数
   * @param heights 行の幅. 指定しないと minHeight でされる
   */
  public setRowCount(rowCount: number, heights?: number[]) {
    const plus = rowCount - this.#itemLayouts.length;
    if (plus === 0) return;
    if (plus < 0) {
      heights = [];
      this.#itemLayouts = this.#itemLayouts.splice(0, rowCount);
    } else {
      if (heights == null) {
        heights = [];
        for (let i = 0; i < plus; i++) heights.push(this.#minHeight);
      }

      this.#itemLayouts = addItemLayouts(this.#itemLayouts, heights);
    }

    if (this.#autoScroll) {
      this.#scrollTop += plus * this.#minHeight;
    }
    const newScrollHeight =
      this.#listViewLayout.scrollHeight + plus * this.#minHeight;
    const minScrollTop = 0;
    const maxScrollTop = Math.max(newScrollHeight - this.#viewportHeight, 0);
    this.#scrollTop = Math.min(
      Math.max(minScrollTop, this.#scrollTop),
      maxScrollTop
    );

    this.recomputeListViewLayout(true, this.#autoScroll);
  }

  /**
   * 指定アイテム行の高さを変更する
   * @param array [変更するインデックス, 新しい高さ][]
   */
  public changeRowHeight(array: [number, number][]): void {
    if (
      array.length === 0 ||
      array[0][0] === -1 ||
      array.every(
        ([index, height]) =>
          this.#itemLayouts[index]?.style?.minHeight === height
      )
    )
      return;

    let scrollHeightDif = 0;
    let changeMinIndex = Number.MAX_SAFE_INTEGER;
    let changeMaxIndex = Number.MIN_SAFE_INTEGER;
    // アイテムの新しい高さを設定する
    for (const value of array) {
      const index = value[0];
      const height = Math.max(value[1], this.#minHeight);
      // let height = value[1];
      // if (height < this.#minHeight) height = this.#minHeight;
      const layout = this.#itemLayouts[index];
      const dif = height - layout.style.minHeight;
      if (dif === 0) continue;
      scrollHeightDif += dif;

      this.#itemLayouts[index] = {
        ...layout,
        style: { ...layout.style, minHeight: height },
      };
      if (index < changeMinIndex) changeMinIndex = index;
      if (index > changeMaxIndex) changeMaxIndex = index;
    }
    if (changeMinIndex === Number.MAX_SAFE_INTEGER) return;

    // アイテムの高さを再計算する
    this.#itemLayouts = recomputeTopItemLayout(
      this.#itemLayouts,
      changeMinIndex
    );

    // スクロール計算
    const firstRowItem = this.#listViewLayout.rowLayouts[0].itemLayout;
    const lastRowItem = this.#listViewLayout.rowLayouts[this.#listViewLayout.visibleRowCount - 1].itemLayout;
    assertNotNullish(firstRowItem);
    assertNotNullish(lastRowItem);

    let layoutMayBeSame = false;
    // スクロールの計算
    if (changeMinIndex <= lastRowItem.index) {
      // 変更するアイテムは表示する行より上
      layoutMayBeSame = true;
      this.#scrollTop += scrollHeightDif;
      // 先にレイアウト変更イベントを呼んで貰うため
      setTimeout(() => {
        this.#onScroll.fire(this.#scrollTop);
      }, 0);
      // layoutMayBeSame をより正確に計算するだけ
      layoutMayBeSame = changeMaxIndex < firstRowItem.index;
    }

    // リストビューレイアウト計算
    // MEMO: layoutMayBeSame が true なら絶対変わらない
    this.recomputeListViewLayout(layoutMayBeSame, undefined);
  }

  /**
   * レイアウトを再計算する\
   * `isCheckEaualityLayout`が`True`の時レイアウトが変更されるかチェックする\
   * 変更する必要が無ければレイアウトは変わらず`onRecomputedLayout`も呼ばれない
   * @param layoutMayBeSame レイアウトが同じ可能性がある
   * @param isAutoScroll 自動スクロールするか?.指定しなければ状況に自動スクロールするか計算する
   */
  private recomputeListViewLayout(
    layoutMayBeSame: boolean,
    isAutoScroll?: boolean
  ) {
    const oldVisibleRowCount = this.#listViewLayout.visibleRowCount;
    const oldRowLayouts = this.#listViewLayout.rowLayouts;

    if (isAutoScroll === true) {
      this.#autoScroll = true;
    } else if (isAutoScroll === false) {
      this.#autoScroll = false;
    } else {
      const lastItem = this.#itemLayouts.at(-1);
      assertNotNullish(lastItem);
      this.#autoScroll =
        lastItem.style.top + lastItem.style.minHeight - this.#viewportHeight <=
        this.#scrollTop;
    }

    let firstRowIndex;
    let lastRowIndex;
    if (this.#autoScroll) {
      const lastItem = this.#itemLayouts.at(-1);
      if (lastItem == null) {
        firstRowIndex = 0;
        lastRowIndex = 0;
      } else {
        // 一番下の行のインデックスは一番下のアイテムのインデックス
        lastRowIndex = lastItem.index;
        // #scrollTop を計算する
        this.#scrollTop =
          lastItem.style.top + lastItem.style.minHeight - this.#viewportHeight;
        if (this.#scrollTop < 0) this.#scrollTop = 0;
        // 一番上の行のインデックスを計算する
        firstRowIndex = binarySearch(this.#itemLayouts, this.#scrollTop);
      }
    } else {
      firstRowIndex = binarySearch(this.#itemLayouts, this.#scrollTop);
      const linenupBottom = this.#scrollTop + this.#viewportHeight;
      lastRowIndex = binarySearch(this.#itemLayouts, linenupBottom);
    }

    const visibleRowCount = lastRowIndex - firstRowIndex + 1;
    const numViews = Math.max(oldRowLayouts.length, visibleRowCount);
    // 最適化のため、レイアウトを更新するかチェック
    if (
      layoutMayBeSame &&
      oldRowLayouts.length === numViews &&
      oldRowLayouts[0].itemLayout.index === firstRowIndex &&
      oldRowLayouts[oldVisibleRowCount - 1].itemLayout.index === lastRowIndex &&
      visibleRowCount <= oldVisibleRowCount
    ) {
      // レイアウトを更新しない
    } else {
      // レイアウトを更新する
      const newRowLayouts: RowLayout[] = [];

      for (let i = firstRowIndex; i < firstRowIndex + numViews; i++) {
        if (i <= lastRowIndex && this.#itemLayouts[i] != null) {
          const layout = this.#itemLayouts[i];
          newRowLayouts.push({
            key: `${i % numViews}`,
            itemLayout: {
              ...layout,
              style: {
                ...layout.style,
                top: this.#itemLayouts[i].style.top - this.#scrollTop,
              },
            },
          });
        } else {
          newRowLayouts.push({
            key: `${i % numViews}`,
            itemLayout: { index: -1, style: { minHeight: 0, top: 0 } },
          });
        }
      }
      this.#listViewLayout = {
        ...this.#listViewLayout,
        visibleRowCount,
        rowLayouts: newRowLayouts,
      };
    }

    this.setScrollHeight();

    if (this.#autoScroll) {
      this.#onScroll.fire(this.#scrollTop);
    }
  }

  /**
   * スクロールエリアサイズを再計算し、更新を呼ぶ
   */
  private setScrollHeight() {
    const lastItem = this.#itemLayouts.at(-1);
    this.#listViewLayout = {
      ...this.#listViewLayout,
      scrollHeight:
        lastItem == null ? 0 : lastItem.style.top + lastItem.style.minHeight,
    };
    this.#onRecomputedLayout.fire();
  }
}

/**
 * アイテムのレイアウトを生成する
 * @param itemCount アイテムの数
 * @param height 高さ
 */
function createItemLayouts(itemCount: number, height: number): ItemLayout[] {
  const layouts: ItemLayout[] = [];
  let top = 0;

  for (let i = layouts.length; i < itemCount; i++) {
    layouts[i] = { index: i, style: { minHeight: height, top } };
    top += height;
  }

  return layouts;
}

/**
 * アイテムのレイアウトの開始位置を再計算する
 * @param layouts 元となるレイアウト
 * @param startIndex 計算を開始するインデックス。default 0
 */
function recomputeTopItemLayout(
  layouts: ItemLayout[],
  startIndex = 0
): ItemLayout[] {
  let top =
    startIndex === 0
      ? 0
      : layouts[startIndex - 1].style.top +
      layouts[startIndex - 1].style.minHeight;
  for (let i = startIndex; i < layouts.length; i++) {
    layouts[i] = { ...layouts[i], style: { ...layouts[i].style, top } };
    top += layouts[i].style.minHeight;
  }
  return layouts;
}

/**
 * 渡されたアイテムのレイアウトに新しい行を追加して再計算する
 * @param layouts 元となるレイアウト
 * @param heights 追加する行の高さの配列
 */
function addItemLayouts(
  layouts: ItemLayout[],
  heights: number[]
): ItemLayout[] {
  if (heights.length === 0) return layouts;

  let top = 0;
  const lastItem = layouts.at(-1);
  if (lastItem != null) top = lastItem.style.top + lastItem.style.minHeight;
  const bottom = layouts.length;
  for (let i = 0; i < heights.length; i++) {
    layouts.push({ index: bottom + i, style: { minHeight: heights[i], top } });
    top += heights[i];
  }

  return layouts;
}

/**
 * `itemLayouts`から`y`を超えない限界の値のインデックスを返す
 * @param itemLayouts
 * @param y
 */
function binarySearch(itemLayouts: ItemLayout[], y: number): number {
  let from = 0;
  let to = itemLayouts.length;

  while (to > from + 1) {
    const mid = Math.floor((from + to) / 2);

    if (itemLayouts[mid].style.top === y) return mid;
    if (itemLayouts[mid].style.top > y) to = mid;
    else from = mid;
  }
  return from;
}
