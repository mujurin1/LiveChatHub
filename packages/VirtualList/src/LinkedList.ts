
export interface LinkedNode<V> {
  value: V;
  next: LinkedNode<V> | null;
}

export const LinkedList = {
  new: <V>(value: V, next: LinkedNode<V> | null = null): LinkedNode<V> => {
    return { value, next };
  },
  find: <V>(first: LinkedNode<V> | null, fn: (node: LinkedNode<V>) => boolean): LinkedNode<V> | null => {
    const iter = LinkedList.getIterator(first);
    for (const node of iter) {
      if (fn(node)) return node;
    }
    return null;
  },
  map: <V, R>(first: LinkedNode<V> | null, fn: (node: LinkedNode<V>) => R): R[] => {
    const ary: R[] = [];
    for (const node of LinkedList.getIterator(first)) {
      ary.push(fn(node));
    }
    return ary;
  },
  getIterator: <V>(first: LinkedNode<V> | null) => {
    let node: LinkedNode<V> = { next: first } as LinkedNode<V>;

    return {
      next: () => {
        // node = node.next;
        if (node.next == null) return { done: true, value: null! };
        return { done: false, value: (node = node.next) };
      },
      [Symbol.iterator]() {
        return this;
      }
    };
  },

  // __dbg_get_next: <V>(first: LinkedNode<V>, count: number) => {
  //   let node = first;
  //   for (let i = 0; i < count; i++) {
  //     node = node.next!;
  //   }
  //   return node;
  // },
} as const;
