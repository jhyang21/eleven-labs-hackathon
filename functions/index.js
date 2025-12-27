import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fetch from 'node-fetch';

initializeApp();
const db = getFirestore();

const normalizeText = (text) => text.replace(/\s+/g, ' ').trim();

const extractWithRegex = (html, label) => {
  const regex = new RegExp(`<${label}[^>]*>(.*?)<\\/${label}>`, 'gis');
  const matches = [...html.matchAll(regex)];
  return matches.map((match) => normalizeText(match[1].replace(/<[^>]*>/g, ''))).filter(Boolean);
};

const parseIngredients = (html) => {
  const itempropMatches = [...html.matchAll(/itemprop="recipeIngredient"[^>]*>(.*?)<\/[^>]+>/gi)];
  if (itempropMatches.length > 0) {
    return itempropMatches
      .map((match) => normalizeText(match[1].replace(/<[^>]*>/g, '')))
      .filter(Boolean);
  }
  return extractWithRegex(html, 'li');
};

const parseSteps = (html) => {
  const itempropMatches = [...html.matchAll(/itemprop="recipeInstructions"[^>]*>(.*?)<\/[^>]+>/gi)];
  if (itempropMatches.length > 0) {
    return itempropMatches
      .map((match) => normalizeText(match[1].replace(/<[^>]*>/g, '')))
      .filter(Boolean);
  }
  return extractWithRegex(html, 'p');
};

export const parseRecipe = onRequest(async (request, response) => {
  try {
    const { url } = request.body;
    if (!url) {
      response.status(400).json({ error: 'Missing URL' });
      return;
    }
    const fetched = await fetch(url);
    if (!fetched.ok) {
      response.status(400).json({ error: 'Failed to fetch recipe URL' });
      return;
    }
    const html = await fetched.text();
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? normalizeText(titleMatch[1]) : 'Parsed recipe';
    const ingredients = parseIngredients(html).slice(0, 30);
    const steps = parseSteps(html).slice(0, 30);
    if (ingredients.length === 0 || steps.length === 0) {
      response.status(422).json({ error: 'Unable to parse recipe content' });
      return;
    }
    await db.collection('recipes').doc('latest').set({ title, ingredients, steps }, { merge: true });
    response.json({ title, ingredients, steps });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

export const updateSessionStep = onRequest(async (request, response) => {
  try {
    const { currentStepIndex, activeTimers } = request.body;
    await db.collection('sessions').doc('default').set(
      {
        currentStepIndex,
        activeTimers,
      },
      { merge: true }
    );
    response.json({ status: 'ok' });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});
