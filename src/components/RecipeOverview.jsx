export default function RecipeOverview({ recipe }) {
  return (
    <div className="recipe-overview">
      <h3>{recipe.title}</h3>
      <div className="recipe-grid">
        <div>
          <h4>Ingredients</h4>
          {recipe.ingredients.length === 0 ? (
            <p className="muted">Ingredients will appear here after parsing.</p>
          ) : (
            <ul>
              {recipe.ingredients.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h4>Steps</h4>
          {recipe.steps.length === 0 ? (
            <p className="muted">Cooking steps will appear here.</p>
          ) : (
            <ol>
              {recipe.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
