const modifiers = [0, 1, 2, 3];
function permutations(values) {
  return values.length
    ? values.flatMap((value) =>
      permutations(values.filter((item) => item !== value)).map((tail) => [value, ...tail]))
    : [[]];
}

export const modifierOrders = permutations(modifiers);
export const shortcutHomeModes = ["auto", "native", "apple"];
export function modifierOrder(rank, apple) {
  return modifierOrders[rank - 1] ?? (apple ? [3, 1, 2, 0] : modifierOrders[0]);
}
