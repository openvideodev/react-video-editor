export type BinarySearchPredicate<T> = (value: T, index: number, arr: T[]) => boolean;

/**
 * Searches for a value by predicate function.
 * @param arr The list of any values.
 * @param predicate Predicate function.
 * @returns Found index or -1.
 */
export function findIndex<T>(arr: T[], predicate: BinarySearchPredicate<T>): number {
  let l = -1;
  let r = arr.length - 1;

  while (1 + l < r) {
    const mid = l + ((r - l) >> 1);
    const cmp = predicate(arr[mid], mid, arr);

    cmp ? (r = mid) : (l = mid);
  }

  return r;
}
