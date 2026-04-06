import { useState, useCallback } from 'react';

const KEY = 'djur-i-juni:shopping-list';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

function save(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function useShoppingList() {
  const [items, setItems] = useState(load);

  const addFromRecipe = useCallback((recipe, ingredients) => {
    setItems((prev) => {
      const next = [...prev];
      for (const text of ingredients) {
        if (!next.some((i) => i.recipeId === recipe.id && i.text === text)) {
          next.push({ id: `${recipe.id}-${text}`, text, checked: false, recipeId: recipe.id, recipeTitle: recipe.title });
        }
      }
      save(next);
      return next;
    });
  }, []);

  const toggle = useCallback((id) => {
    setItems((prev) => {
      const next = prev.map((i) => i.id === id ? { ...i, checked: !i.checked } : i);
      save(next);
      return next;
    });
  }, []);

  const clearChecked = useCallback(() => {
    setItems((prev) => {
      const next = prev.filter((i) => !i.checked);
      save(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    save([]);
    setItems([]);
  }, []);

  const uncheckedCount = items.filter((i) => !i.checked).length;

  return { items, addFromRecipe, toggle, clearChecked, clearAll, uncheckedCount };
}
