export default async function handler(req, res) {
  console.log('API getCurrentStep called with method:', req.method);
  if (req.method !== 'POST') {
    console.log('Method not allowed');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { session } = req.body;
    console.log('Received session:', session ? 'present' : 'missing');
    if (!session) {
      console.log('Missing session in body');
      res.status(400).json({ error: 'Missing session' });
      return;
    }

    // Validate session structure
    if (typeof session !== 'object' || session === null) {
      console.log('Invalid session structure');
      res.status(400).json({ error: 'Invalid session structure' });
      return;
    }

    // Validate that recipe exists
    if (!session.recipe) {
      console.log('Missing recipe in session');
      res.status(400).json({ error: 'Session does not contain a recipe' });
      return;
    }

    // Validate that recipe has steps
    if (!Array.isArray(session.recipe.steps) || session.recipe.steps.length === 0) {
      console.log('Recipe has no steps');
      res.status(400).json({ error: 'Recipe has no steps' });
      return;
    }

    // Validate currentStepIndex
    const stepIndex = session.currentStepIndex;
    if (typeof stepIndex !== 'number' || stepIndex < 0 || stepIndex >= session.recipe.steps.length) {
      console.log('Invalid currentStepIndex:', stepIndex);
      res.status(400).json({ error: 'Invalid currentStepIndex' });
      return;
    }

    const currentStep = session.recipe.steps[stepIndex];
    console.log('Returning current step at index:', stepIndex);

    res.status(200).json({ currentStep });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}

