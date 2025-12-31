export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { session } = req.body;
    if (!session) {
      res.status(400).json({ error: 'Missing session' });
      return;
    }

    // Validate session structure
    if (typeof session !== 'object' || session === null) {
      res.status(400).json({ error: 'Invalid session structure' });
      return;
    }

    // Validate that recipe exists
    if (!session.recipe) {
      res.status(400).json({ error: 'Session does not contain a recipe' });
      return;
    }

    // Validate that recipe has steps
    if (!Array.isArray(session.recipe.steps) || session.recipe.steps.length === 0) {
      res.status(400).json({ error: 'Recipe has no steps' });
      return;
    }

    const steps = session.recipe.steps;

    res.status(200).json({ steps });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}

