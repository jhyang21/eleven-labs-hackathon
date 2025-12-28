import { db } from '../../lib/firebaseAdmin';
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

    // Validate domain
    try {
      const parsedUrl = new URL(url);
      if (!parsedUrl.hostname.includes('allrecipes.com')) {
        res.status(400).json({ error: 'Only allrecipes.com URLs are supported.' });
        return;
      }
    } catch (e) {
      res.status(400).json({ error: 'Invalid URL provided.' });
      return;
    }

    const fetched = await fetch(url);
    if (!fetched.ok) {
      res.status(400).json({ error: 'Failed to fetch recipe URL' });
      return;
    }
    const html = await fetched.text();
    const $ = cheerio.load(html);

    const title = normalizeText($('#article-heading').text()) || 'Parsed recipe';

    const ingredients = [];
    $('#mm-recipes-structured-ingredients_1-0 li').each((_, el) => {
      const text = normalizeText($(el).text());
      if (text) ingredients.push(text);
    });

    const steps = [];
    $('#mm-recipes-steps_1-0 li').each((_, el) => {
      const text = normalizeText($(el).text());
      if (text) steps.push(text);
    });

    if (ingredients.length === 0 || steps.length === 0) {
      res.status(422).json({ error: 'Unable to parse recipe content. Make sure it is a valid AllRecipes page.' });
      return;
    }

    await db.collection('recipes').doc('latest').set({ title, ingredients, steps }, { merge: true });
    res.status(200).json({ title, ingredients, steps });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

