import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const getFirebaseAdminApp = () => {
  if (getApps().length === 0) {
    return initializeApp();
  }
  return getApp();
};

const app = getFirebaseAdminApp();
const db = getFirestore(app);

export { db };

