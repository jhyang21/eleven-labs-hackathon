const splitIngredient = (item) => {
  const parts = item.split(',');
  if (parts.length === 1) {
    return { name: item.trim(), quantity: '' };
  }
  return {
    name: parts[0].trim(),
    quantity: parts.slice(1).join(',').trim(),
  };
};

export default function IngredientsPanel({ ingredients, isOpen, onToggle }) {
  return (
    <div className={`ingredients-panel ${isOpen ? 'open' : ''}`}>
      <button type="button" className="ingredients-toggle" onClick={onToggle}>
        Ingredients
        <span className="ingredients-caret">{isOpen ? '–' : '+'}</span>
      </button>
      {isOpen && (
        <div className="ingredients-content">
          {ingredients.length === 0 ? (
            <p className="muted">Ingredients will appear after parsing.</p>
          ) : (
            <ul>
              {ingredients.map((item) => {
                const parsed = splitIngredient(item);
                return (
                  <li key={item}>
                    <label>
                      <input type="checkbox" />
                      <span className="ingredient-name">{parsed.name}</span>
                      {parsed.quantity && (
                        <span className="ingredient-quantity">{parsed.quantity}</span>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
