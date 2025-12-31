import * as cheerio from 'cheerio';

const normalizeText = (text) => text.replace(/\s+/g, ' ').trim();

export default async function handler(req, res) {
  console.log('API parseRecipe called with method:', req.method);
  if (req.method !== 'POST') {
    console.log('Method not allowed');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { url } = req.body;
    console.log('Received URL:', url);
    if (!url) {
      console.log('Missing URL in body');
      res.status(400).json({ error: 'Missing URL' });
      return;
    }

    // Validate domain
    try {
      const parsedUrl = new URL(url);
      console.log('Parsed hostname:', parsedUrl.hostname);
      if (!parsedUrl.hostname.includes('allrecipes.com')) {
        console.log('Invalid domain:', parsedUrl.hostname);
        res.status(400).json({ error: 'Only allrecipes.com URLs are supported.' });
        return;
      }
    } catch (e) {
      console.error('URL parsing error:', e);
      res.status(400).json({ error: 'Invalid URL provided.' });
      return;
    }

    console.log('Fetching URL...');
    const fetched = await fetch(url);
    console.log('Fetch status:', fetched.status);
    if (!fetched.ok) {
      console.log('Failed to fetch URL');
      res.status(400).json({ error: 'Failed to fetch recipe URL' });
      return;
    }
    const html = await fetched.text();
    console.log('Fetched HTML length:', html.length);
    const $ = cheerio.load(html);

    const title = normalizeText($('#article-heading_1-0').text() || $('h1').text()) || 'Parsed recipe';
    console.log('Parsed title:', title);

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
    console.log(`Parsed ${ingredients.length} ingredients`);

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
    console.log(`Parsed ${steps.length} steps`);

    if (ingredients.length === 0 || steps.length === 0) {
      console.log('Parsing failed: ingredients or steps empty');
      res.status(422).json({ error: 'Unable to parse recipe content. Make sure it is a valid AllRecipes page.' });
      return;
    }

    res.status(200).json({ title, ingredients, steps });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}

