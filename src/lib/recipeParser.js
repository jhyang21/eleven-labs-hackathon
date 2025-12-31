const normalizeText = (text) => text.replace(/\s+/g, ' ').trim();

const cleanAndNormalizeText = (node) => {
  let text = normalizeText(node.textContent);
  
  // Cut off text at the first occurrence of "<"
  const cutIndex = text.indexOf('<');
  if (cutIndex !== -1) {
    text = text.substring(0, cutIndex).trim();
  }
  
  return text;
};

const extractListItems = (container) =>
  Array.from(container.querySelectorAll('li'))
    .map((item) => cleanAndNormalizeText(item))
    .filter(Boolean);

const deriveSteps = (document) => {
  const stepSelectors = [
    '[itemprop="recipeInstructions"] li',
    '[itemprop="recipeInstructions"] p',
    '.recipe-instructions li',
    '.instruction li',
    '.instructions li',
  ];
  for (const selector of stepSelectors) {
    const nodes = Array.from(document.querySelectorAll(selector));
    if (nodes.length > 1) {
      return nodes.map((node) => cleanAndNormalizeText(node)).filter(Boolean);
    }
  }
  return [];
};

const deriveIngredients = (document) => {
  const ingredientSelectors = [
    '[itemprop="recipeIngredient"]',
    '.ingredients li',
    '.ingredient li',
    '.recipe-ingredients li',
  ];
  for (const selector of ingredientSelectors) {
    const nodes = Array.from(document.querySelectorAll(selector));
    if (nodes.length > 1) {
      return nodes.map((node) => cleanAndNormalizeText(node)).filter(Boolean);
    }
  }
  return [];
};

export const parseRecipeFromUrl = async (url) => {
  if (!url) {
    throw new Error('Please provide a recipe URL.');
  }

  try {
    const parsedUrl = new URL(url);
    if (!parsedUrl.hostname.includes('allrecipes.com')) {
      throw new Error('Only allrecipes.com URLs are supported.');
    }
  } catch (error) {
    if (error.message.includes('Only allrecipes.com')) {
      throw error;
    }
    throw new Error('Invalid URL provided.');
  }

  const functionUrl = '/api/parseRecipe';
  if (functionUrl) {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!response.ok) {
      throw new Error('Failed to parse recipe via backend function.');
    }
    return response.json();
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Unable to fetch recipe URL.');
  }

  const html = await response.text();
  const parser = new DOMParser();
  const document = parser.parseFromString(html, 'text/html');
  const title = normalizeText(
    document.querySelector('h1')?.textContent || document.title || 'Parsed recipe'
  );
  const ingredients = deriveIngredients(document);
  const steps = deriveSteps(document);

  if (!ingredients.length || !steps.length) {
    throw new Error('Unable to extract ingredients or steps. Try another recipe URL.');
  }

  return {
    title,
    ingredients,
    steps,
  };
};
