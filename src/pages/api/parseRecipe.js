import * as cheerio from 'cheerio';

const normalizeText = (text) => text.replace(/\s+/g, ' ').trim();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ error: 'Missing URL' });
      return;
    }

    // Validate that it's an AllRecipes link
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();
      if (!hostname.includes('allrecipes.com')) {
        res.status(400).json({ error: 'Invalid URL. Please provide a valid AllRecipes.com recipe link (e.g., https://www.allrecipes.com/recipe/...).' });
        return;
      }
    } catch (e) {
      console.error('URL parsing error:', e);
      res.status(400).json({ error: 'Invalid URL provided. Please ensure you are using a valid AllRecipes.com recipe link.' });
      return;
    }

    const fetched = await fetch(url);
    if (!fetched.ok) {
      res.status(400).json({ error: 'Failed to fetch recipe URL' });
      return;
    }
    const html = await fetched.text();
    const $ = cheerio.load(html);

    const title = normalizeText($('#article-heading_1-0').text() || $('h1').text()) || 'Parsed recipe';

    const ingredients = [];
    // Try multiple selectors for ingredients
    const ingredientSelectors = [
      '#mm-recipes-structured-ingredients_1-0 li',
    ];
    
    for (const selector of ingredientSelectors) {
      if (ingredients.length > 0) break;
      $(selector).each((_, el) => {
        let text = normalizeText($(el).text());
        const cutIndex = text.indexOf('<');
        if (cutIndex !== -1) {
          text = text.substring(0, cutIndex).trim();
        }
        if (text) ingredients.push(text);
      });
    }

    const steps = [];
    // Try multiple selectors for steps
    const stepSelectors = [
      '#mm-recipes-steps_1-0 li', 
    ];

    for (const selector of stepSelectors) {
      if (steps.length > 0) break;
      $(selector).each((_, el) => {
        let text = normalizeText($(el).text());
        const cutIndex = text.indexOf('<');
        if (cutIndex !== -1) {
          text = text.substring(0, cutIndex).trim();
        }
        if (text) steps.push(text);
      });
    }

    if (ingredients.length === 0 || steps.length === 0) {
      res.status(422).json({ error: 'Unable to parse recipe content. Make sure it is a valid AllRecipes page.' });
      return;
    }

    res.status(200).json({ title, ingredients, steps });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}

