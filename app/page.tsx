'use client';

import App from '../src/App';

/**
 * Root page — renders the existing React SPA as a client component.
 * The existing App.tsx is fully preserved; Next.js just wraps it.
 */
export default function Page() {
  return <App />;
}
