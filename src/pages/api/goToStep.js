export default async function handler(req, res) {
  console.log('API goToStep called with method:', req.method);
  if (req.method !== 'POST') {
    console.log('Method not allowed');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { session, stepIndex } = req.body;
    console.log('Received session:', session ? 'present' : 'missing');
    console.log('Received stepIndex:', stepIndex);
    
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

    // Validate stepIndex exists and is a number
    if (typeof stepIndex !== 'number') {
      console.log('Missing or invalid stepIndex');
      res.status(400).json({ error: 'Missing or invalid stepIndex. Must be a number.' });
      return;
    }

    // Validate stepIndex is an integer
    if (!Number.isInteger(stepIndex)) {
      console.log('stepIndex is not an integer:', stepIndex);
      res.status(400).json({ error: 'stepIndex must be an integer' });
      return;
    }

    // Validate stepIndex is within valid range (0 to totalSteps - 1)
    if (stepIndex < 0 || stepIndex >= totalSteps) {
      console.log('stepIndex out of range:', stepIndex, 'totalSteps:', totalSteps);
      res.status(400).json({ 
        error: `stepIndex must be between 0 and ${totalSteps - 1} (inclusive). Received: ${stepIndex}` 
      });
      return;
    }

    // Update session state
    const updatedSession = {
      ...session,
      currentStepIndex: stepIndex,
      lastConfirmedStep: stepIndex,
    };

    console.log('Navigated to step', stepIndex, 'of', totalSteps);

    res.status(200).json({ session: updatedSession });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}

