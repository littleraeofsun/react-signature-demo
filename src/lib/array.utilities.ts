/** Inserts a new item into an array at a specific index in a non-mutating manner. */
export function insertAtIndex<T>(array: T[], newItem: T, index: number): T[] {
  return [...array.slice(0, index), newItem, ...array.slice(index)];
}
/** Updates an item in an array at a specific index in a non-mutating manner. */
export function updateAtIndex<T>(array: T[], newItem: T, index: number): T[] {
  return [...array.slice(0, index), newItem, ...array.slice(index + 1)];
}
/** Removes an item from an array at a specific index in a non-mutating manner. */
export function removeAtIndex<T>(array: T[], index: number): T[] {
  return [...array.slice(0, index), ...array.slice(index + 1)];
}