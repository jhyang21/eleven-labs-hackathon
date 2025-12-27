export default function IngredientsPanel({ ingredients, isOpen, onToggle }) {
  return (
    <section className={`ingredients-panel ${isOpen ? 'open' : ''}`}>
      <button type="button" className="ingredients-toggle" onClick={onToggle}>
        Ingredients
      </button>
      {isOpen ? (
        <ul className="ingredients-list">
          {ingredients.map((ingredient) => {
            const [quantity, ...nameParts] = ingredient.split(' ');
            const name = nameParts.join(' ') || ingredient;
            return (
              <li key={ingredient}>
                <input type="checkbox" checked readOnly />
                <div>
                  <p className="ingredient-name">{name}</p>
                  <p className="ingredient-qty">{quantity}</p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
