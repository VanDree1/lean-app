import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';

export function useShoppingList() {
  const { state, addShoppingFromRecipe, toggleShoppingItem, clearShoppingChecked, clearShoppingAll } = useAppStore();
  const items = state.shoppingList;
  const uncheckedCount = items.filter((i) => !i.checked).length;

  return useMemo(() => ({
    items,
    addFromRecipe: addShoppingFromRecipe,
    toggle: toggleShoppingItem,
    clearChecked: clearShoppingChecked,
    clearAll: clearShoppingAll,
    uncheckedCount,
  }), [items, addShoppingFromRecipe, toggleShoppingItem, clearShoppingChecked, clearShoppingAll, uncheckedCount]);
}
