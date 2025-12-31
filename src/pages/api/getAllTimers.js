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

    res.status(200).json({ timers: timersWithRemaining });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}

