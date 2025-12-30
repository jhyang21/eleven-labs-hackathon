export default async function handler(req, res) {
  console.log('API advanceToNextStep called with method:', req.method);
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

    const totalSteps = session.recipe.steps.length;

    // Validate currentStepIndex exists
    if (typeof session.currentStepIndex !== 'number') {
      console.log('Missing or invalid currentStepIndex');
      res.status(400).json({ error: 'Missing or invalid currentStepIndex' });
      return;
    }

    // Calculate next step index (cap at last step)
    const nextIndex = Math.min(session.currentStepIndex + 1, totalSteps - 1);
    
    // Check if already at the last step
    if (session.currentStepIndex >= totalSteps - 1) {
      console.log('Already at the last step');
      res.status(400).json({ error: 'Already at the last step' });
      return;
    }

    // Update session state
    const updatedSession = {
      ...session,
      currentStepIndex: nextIndex,
      lastConfirmedStep: nextIndex,
    };

    console.log('Advanced from step', session.currentStepIndex, 'to step', nextIndex);

    res.status(200).json({ session: updatedSession });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}

