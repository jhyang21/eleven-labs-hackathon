import { db } from '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Determine if we received a full session object or just partial fields
    // The previous function accepted { currentStepIndex, activeTimers }
    // The plan says: "Update it to accept the full session object (matching frontend behavior)"
    // We will save whatever is passed in req.body to the session document.
    const sessionData = req.body;

    await db.collection('sessions').doc('default').set(
      sessionData,
      { merge: true }
    );
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

