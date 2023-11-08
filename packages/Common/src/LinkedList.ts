
export interface LinkedNode<V> {
  value: V;
  before?: LinkedNode<V>;
  next?: LinkedNode<V>;
}

export class LinkedList<V> {
  public first: LinkedNode<V>;
  public last: LinkedNode<V>;

  constructor(firstValue: V, ...nexts: [V, ...V[]]) {
    const first: LinkedNode<V> = { value: firstValue };

    let last = first;
    for (const value of nexts) {
      const node: LinkedNode<V> = { value, before: last };
      last.next = node;
      last = node;
    }

    this.first = first;
    this.last = last;
  }

  connectLast(value: V) {
    const oldLast = this.last;
    const last: LinkedNode<V> = { value, before: oldLast };
    oldLast.next = last;

    this.last = last;
  }

  /**
   * 一番最初のノードを最後に移動する
   */
  moveFirstToLast(): void {
    const first = this.first.next!;
    const last = this.first;

    first.before = undefined;
    last.before = this.last;
    last.next = undefined;

    this.last.next = last;

    this.first = first;
    this.last = last;
  }

  /**
   * 一番最後のノードを最初に移動する
   */
  moveLastToFirst(): void {
    const first = this.last;
    const last = this.last.before!;

    first.before = undefined;
    first.next = this.first;
    last.next = undefined;

    this.first.before = first;

    this.first = first;
    this.last = last;
  }

  find(fn: (node: LinkedNode<V>) => boolean): LinkedNode<V> | undefined {
    for (const node of this) {
      if (fn(node)) return node;
    }
    return undefined;
  }

  map<R>(fn: (node: LinkedNode<V>) => R): R[] {
    const ary: R[] = [];
    for (const node of this) {
      ary.push(fn(node));
    }
    return ary;
  }

  __dbg_get_next(count: number) {
    let node = this.first;
    for (let i = 0; i < count; i++) {
      node = node.next!;
    }
    return node;
  }

  [Symbol.iterator]() {
    let node: LinkedNode<V> | undefined = { next: this.first } as LinkedNode<V>;
    return {
      next: () => {
        node = node?.next;
        if (node == null) return { done: true, value: null! };
        return { done: false, value: node };
      }
    };
  }
}
