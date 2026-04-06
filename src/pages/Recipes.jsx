import { useState, useCallback } from 'react';
import recipes from '../data/recipes.js';
import styles from './Recipes.module.css';
import { useShoppingList } from '../hooks/useShoppingList.js';
import { useAppStore } from '../store/useAppStore.js';

const ALL_DIETS = ['Allätare', 'Pescetarian', 'Vegetarian', 'Vegan'];

// Priority order — most restrictive first for badge display
const DIET_PRIORITY = ['Vegan', 'Vegetarian', 'Pescetarian', 'Allätare'];

function getPrimaryDiet(diets) {
  return DIET_PRIORITY.find((d) => diets.includes(d)) ?? diets[0];
}

// What each filter should show — more restrictive diets are subsets of broader ones
const DIET_INCLUDES = {
  Allätare:    ['Allätare', 'Pescetarian', 'Vegetarian', 'Vegan'],
  Pescetarian: ['Pescetarian', 'Vegetarian', 'Vegan'],
  Vegetarian:  ['Vegetarian', 'Vegan'],
  Vegan:       ['Vegan'],
};

function recipeMatchesDiet(recipe, activeDiet) {
  if (activeDiet === 'Alla') return true;
  const allowed = DIET_INCLUDES[activeDiet] ?? [activeDiet];
  return recipe.diets.some((d) => allowed.includes(d));
}
const ALL_MEALS = ['Frukost', 'Lunch', 'Middag', 'Snack'];

function HeartIcon({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21C12 21 3 14.5 3 8.5A5 5 0 0 1 12 6a5 5 0 0 1 9 2.5C21 14.5 12 21 12 21z"
        stroke="currentColor"
        strokeWidth={1.8}
        fill={filled ? 'currentColor' : 'none'}
        fillOpacity={filled ? 1 : 0}
      />
    </svg>
  );
}

function RecipeCard({ recipe, isFavorite, onToggleFavorite, onClick }) {
  return (
    <button type="button" className={styles.card} onClick={() => onClick(recipe)}>
      <div className={styles.cardTop}>
        <div className={styles.cardMeta}>
          <span className={styles.mealTag}>{recipe.meal}</span>
          <span className={styles.dietTag}>{getPrimaryDiet(recipe.diets)}</span>
          <span className={styles.prepTime}>{recipe.prepTime} min</span>
          <button
            type="button"
            className={isFavorite ? styles.heartActive : styles.heart}
            aria-label={isFavorite ? 'Ta bort favorit' : 'Spara som favorit'}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(recipe.id); }}
          >
            <HeartIcon filled={isFavorite} />
          </button>
        </div>
        <h3 className={styles.cardTitle}>{recipe.title}</h3>
        <p className={styles.cardDesc}>{recipe.description}</p>
      </div>
      <div className={styles.cardMacros}>
        <div className={styles.macro}>
          <span className={styles.macroVal}>{recipe.kcal}</span>
          <span className={styles.macroLabel}>kcal</span>
        </div>
        <div className={styles.macroDivider} />
        <div className={styles.macro}>
          <span className={styles.macroVal}>{recipe.protein}g</span>
          <span className={styles.macroLabel}>protein</span>
        </div>
        <div className={styles.macroDivider} />
        <div className={styles.macro}>
          <span className={styles.macroVal}>{recipe.carbs}g</span>
          <span className={styles.macroLabel}>kolhydrater</span>
        </div>
        <div className={styles.macroDivider} />
        <div className={styles.macro}>
          <span className={styles.macroVal}>{recipe.fat}g</span>
          <span className={styles.macroLabel}>fett</span>
        </div>
      </div>
    </button>
  );
}

function scaleIngredient(ingredient, factor) {
  if (factor === 1) return ingredient;
  // Scale the first number found in the string (integer or decimal)
  return ingredient.replace(/^(\d+(?:[.,]\d+)?)/, (_, num) => {
    const scaled = parseFloat(num.replace(',', '.')) * factor;
    const rounded = Math.round(scaled * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace('.', ',');
  });
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M3 6h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 10a4 4 0 0 1-8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ShoppingListSheet({ items, onToggle, onClearChecked, onClearAll, onClose }) {
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.recipeTitle]) acc[item.recipeTitle] = [];
    acc[item.recipeTitle].push(item);
    return acc;
  }, {});

  const hasChecked = items.some((i) => i.checked);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Handlingslista</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Stäng">✕</button>
        </div>

        {items.length === 0 ? (
          <p className={styles.shoppingEmpty}>Listan är tom. Öppna ett recept och tryck på "Lägg till i handlingslistan".</p>
        ) : (
          <>
            {Object.entries(grouped).map(([title, groupItems]) => (
              <div key={title} className={styles.shoppingGroup}>
                <p className={styles.shoppingGroupTitle}>{title}</p>
                <ul className={styles.shoppingList}>
                  {groupItems.map((item) => (
                    <li key={item.id} className={styles.shoppingItem}>
                      <button
                        type="button"
                        className={styles.shoppingCheck}
                        onClick={() => onToggle(item.id)}
                        aria-label={item.checked ? 'Avmarkera' : 'Markera som köpt'}
                      >
                        {item.checked && (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                      <span className={item.checked ? styles.shoppingTextDone : styles.shoppingText}>
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className={styles.shoppingActions}>
              {hasChecked && (
                <button type="button" className={styles.shoppingClearChecked} onClick={onClearChecked}>
                  Rensa klara
                </button>
              )}
              <button type="button" className={styles.shoppingClearAll} onClick={onClearAll}>
                Rensa allt
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RecipeModal({ recipe, onClose, onAddToList }) {
  const [portions, setPortions] = useState(recipe.servings);
  const [added, setAdded] = useState(false);
  const factor = portions / recipe.servings;

  const scale = (val) => Math.round(val * factor);

  function handleAdd() {
    const scaled = recipe.ingredients.map((ing) => scaleIngredient(ing, factor));
    onAddToList(recipe, scaled);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.cardMeta}>
              <span className={styles.mealTag}>{recipe.meal}</span>
              <span className={styles.prepTime}>{recipe.prepTime} min</span>
              <span className={styles.difficulty}>{recipe.difficulty}</span>
            </div>
            <h2 className={styles.modalTitle}>{recipe.title}</h2>
            <p className={styles.cardDesc}>{recipe.description}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Stäng">✕</button>
        </div>

        <div className={styles.portionRow}>
          <span className={styles.portionLabel}>Portioner</span>
          <div className={styles.portionControls}>
            <button
              className={styles.portionBtn}
              onClick={() => setPortions((p) => Math.max(1, p - 1))}
              aria-label="Minska portioner"
              disabled={portions <= 1}
            >−</button>
            <span className={styles.portionCount}>{portions}</span>
            <button
              className={styles.portionBtn}
              onClick={() => setPortions((p) => Math.min(20, p + 1))}
              aria-label="Öka portioner"
            >+</button>
          </div>
        </div>

        <div className={styles.cardMacros} style={{ marginBottom: '1.5rem' }}>
          <div className={styles.macro}>
            <span className={styles.macroVal}>{scale(recipe.kcal)}</span>
            <span className={styles.macroLabel}>kcal</span>
          </div>
          <div className={styles.macroDivider} />
          <div className={styles.macro}>
            <span className={styles.macroVal}>{scale(recipe.protein)}g</span>
            <span className={styles.macroLabel}>protein</span>
          </div>
          <div className={styles.macroDivider} />
          <div className={styles.macro}>
            <span className={styles.macroVal}>{scale(recipe.carbs)}g</span>
            <span className={styles.macroLabel}>kolhydrater</span>
          </div>
          <div className={styles.macroDivider} />
          <div className={styles.macro}>
            <span className={styles.macroVal}>{scale(recipe.fat)}g</span>
            <span className={styles.macroLabel}>fett</span>
          </div>
        </div>

        <section className={styles.modalSection}>
          <h3 className={styles.modalSectionTitle}>Ingredienser</h3>
          <ul className={styles.ingredientList}>
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className={styles.ingredientItem}>
                {scaleIngredient(ing, factor)}
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.modalSection}>
          <h3 className={styles.modalSectionTitle}>Tillagning</h3>
          <ol className={styles.stepList}>
            {recipe.steps.map((step, i) => (
              <li key={i} className={styles.stepItem}>
                <span className={styles.stepNum}>{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <button type="button" className={added ? styles.addedToListBtn : styles.addToListBtn} onClick={handleAdd}>
          <CartIcon />
          {added ? 'Tillagt!' : 'Lägg till i handlingslistan'}
        </button>
      </div>
    </div>
  );
}

export default function Recipes() {
  const { state, toggleRecipeFavorite, setRecipeFilters } = useAppStore();
  const userDiet = state.profile?.diet || null;
  const activeDiet = state.recipes.filters?.diet ?? userDiet ?? 'Alla';
  const activeMeal = state.recipes.filters?.meal ?? 'Alla';

  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [showList, setShowList] = useState(false);
  const favorites = new Set(state.recipes.favorites);
  const { items, addFromRecipe, toggle, clearChecked, clearAll, uncheckedCount } = useShoppingList();

  const toggleFavorite = useCallback((id) => {
    toggleRecipeFavorite(id);
  }, [toggleRecipeFavorite]);

  const q = query.trim().toLowerCase();
  const filtered = recipes
    .filter((r) => recipeMatchesDiet(r, activeDiet))
    .filter((r) => activeMeal === 'Alla' || r.meal === activeMeal)
    .filter((r) => !showFavoritesOnly || favorites.has(r.id))
    .filter((r) => !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.ingredients.some((i) => i.toLowerCase().includes(q)));

  const dietFilters = ['Alla', ...ALL_DIETS];
  const mealFilters = ['Alla', ...ALL_MEALS];

  return (
    <main className={styles.main}>
      <div className={styles.stack}>
        <div className={styles.hero}>
          <p className={styles.eyebrow}>Recept</p>
          <h2 className={styles.title}>Enkla recept som håller ramen</h2>
          {userDiet && (
            <p className={styles.subtitle}>
              Visar recept som passar din kost: <strong>{userDiet}</strong>
            </p>
          )}
        </div>

        <div className={styles.searchRow}>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Sök recept eller ingrediens…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            className={showFavoritesOnly ? styles.favBtnActive : styles.favBtn}
            onClick={() => setShowFavoritesOnly((v) => !v)}
            aria-label="Visa favoriter"
          >
            <HeartIcon filled={showFavoritesOnly} />
          </button>
          <button
            type="button"
            className={styles.cartBtn}
            onClick={() => setShowList(true)}
            aria-label="Öppna handlingslistan"
          >
            <CartIcon />
            {uncheckedCount > 0 && (
              <span className={styles.cartBadge}>{uncheckedCount}</span>
            )}
          </button>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterGroupLabel}>Måltid</span>
          <div className={styles.filterScroll}>
            {mealFilters.map((f) => (
              <button
                key={f}
                type="button"
                className={activeMeal === f ? styles.filterActive : styles.filter}
                onClick={() => setRecipeFilters({ meal: f })}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterGroupLabel}>Kost</span>
          <div className={styles.filterScroll}>
            {dietFilters.map((f) => (
              <button
                key={f}
                type="button"
                className={activeDiet === f ? styles.filterActive : styles.filter}
                onClick={() => setRecipeFilters({ diet: f })}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>
              {showFavoritesOnly && favorites.size === 0
                ? 'Du har inga favoriter ännu – tryck på hjärtat på ett recept.'
                : 'Inga recept matchar din sökning.'}
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                isFavorite={favorites.has(r.id)}
                onToggleFavorite={toggleFavorite}
                onClick={setSelected}
              />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <RecipeModal
          recipe={selected}
          onClose={() => setSelected(null)}
          onAddToList={addFromRecipe}
        />
      )}

      {showList && (
        <ShoppingListSheet
          items={items}
          onToggle={toggle}
          onClearChecked={clearChecked}
          onClearAll={clearAll}
          onClose={() => setShowList(false)}
        />
      )}
    </main>
  );
}
