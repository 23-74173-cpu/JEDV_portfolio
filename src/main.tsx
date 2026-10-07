import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { ErrorBoundary } from './errors';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* STEP 1 (UI layer): page-level boundary → SYSTEM FAULT screen on crash */}
    <ErrorBoundary name="App" variant="page">
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
