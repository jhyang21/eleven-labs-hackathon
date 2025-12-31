export default async function handler(req, res) {
  console.log('API getAllTimers called with method:', req.method);
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

    // Get active timers, default to empty array if not present
    const timers = Array.isArray(session.activeTimers) ? session.activeTimers : [];
    
    // Optionally calculate remaining time for each timer
    const now = Date.now();
    const timersWithRemaining = timers.map((timer) => {
      const remainingMs = timer.endTime - now;
      return {
        ...timer,
        remainingMs: remainingMs > 0 ? remainingMs : 0,
        isExpired: remainingMs <= 0,
      };
    });

    console.log('Returning', timersWithRemaining.length, 'timers');

    res.status(200).json({ timers: timersWithRemaining });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}

