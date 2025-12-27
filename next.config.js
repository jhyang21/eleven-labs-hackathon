/** @type {import('next').NextConfig} */
const firebaseWebappConfig = process.env.FIREBASE_WEBAPP_CONFIG || '';

const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Firebase App Hosting provides FIREBASE_WEBAPP_CONFIG automatically at build time.
  // Expose it to the browser bundle so client-side Firebase can initialize without
  // manually setting 6 separate NEXT_PUBLIC_FIREBASE_* vars.
  env: {
    NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG: firebaseWebappConfig,
  },
};

module.exports = nextConfig;


