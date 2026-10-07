import { Component, useEffect, useRef } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { email } from './data';

/* ============================================================
   STEP 1 (UI layer) — routing without a router, error screens,
   and error boundaries. Terminal visual language throughout.
   No GSAP / scroll / snap logic touched.
   ============================================================ */

// Sections that exist as scroll targets. A deep path matching one of
// these slugs scrolls home to it; anything else is a 404.
export const KNOWN_SECTIONS = [
  { slug: 'about', id: 'about', label: 'About' },
  { slug: 'skills', id: 'skills', label: 'Skills' },
  { slug: 'github', id: 'github', label: 'GitHub activity' },
  { slug: 'projects', id: 'projects', label: 'Projects' },
  { slug: 'experience', id: 'experience', label: 'Experience' },
  { slug: 'certifications', id: 'certifications', label: 'Certifications' },
  { slug: 'contact', id: 'contact', label: 'Contact' },
];

export type RouteState =
  | { kind: 'home' }
  | { kind: 'section'; id: string; label: string }
  | { kind: 'missing'; path: string };

export function parseRoute(pathname?: string): RouteState {
  const raw = typeof pathname === 'string'
    ? pathname
    : (typeof window !== 'undefined' ? window.location.pathname : '/');
  const slug = raw.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!slug) return { kind: 'home' };
  const found = KNOWN_SECTIONS.find((section) => section.slug === slug);
  if (found) return { kind: 'section', id: found.id, label: found.label };
  return { kind: 'missing', path: `/${slug}` };
}

export function levenshtein(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const next = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = next;
    }
  }
  return prev[b.length];
}

// Closest real section slug, or null when nothing is close enough to suggest.
export function closestSection(path: string): { slug: string; label: string } | null {
  const slug = path.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!slug) return null;
  let best: { slug: string; label: string } | null = null;
  let bestDistance = Infinity;
  for (const section of KNOWN_SECTIONS) {
    const distance = levenshtein(slug, section.slug);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = { slug: section.slug, label: section.label };
    }
  }
  if (!best || bestDistance > Math.max(2, Math.floor(best.slug.length / 2))) return null;
  return best;
}

function ConsoleHead({ title }: { title: string }) {
  return (
    <div className="error-console-head">
      <span className="palette-lights" aria-hidden="true"><i /><i /><i /></span>
      <span>{title}</span>
    </div>
  );
}

// Collapsible technical details: error message only in production,
// message + stack in dev.
function ErrorDetails({ error }: { error: Error }) {
  return (
    <details className="error-details">
      <summary>TECHNICAL DETAILS</summary>
      <p className="error-message">{error.message || 'Unknown error'}</p>
      {import.meta.env.DEV && error.stack && <pre className="error-stack">{error.stack}</pre>}
    </details>
  );
}

function reportMailto(error: Error): string {
  const subject = encodeURIComponent(`[JEDV portfolio] Fault report: ${(error.message || 'unknown error').slice(0, 80)}`);
  const body = encodeURIComponent('Steps to reproduce:\n1. \n\nExpected:\n\nBrowser / OS:\n');
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

export function SystemFaultScreen({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="site-shell">
      <main className="error-screen" aria-labelledby="fault-title">
        <div className="container">
          <div className="error-console" role="alert">
            <ConsoleHead title="JEDV // SYSTEM FAULT" />
            <div className="error-console-body">
              <p className="error-kicker"><span className="error-tag">ERR 500</span> // SYSTEM FAULT</p>
              <h1 id="fault-title" className="error-title">Something broke on my end.</h1>
              <p className="error-copy">The system hit a fault it couldn&apos;t recover from. Your data is safe — nothing here sends anything anywhere. Reload to reboot the interface, or report it and I&apos;ll inspect the logs.</p>
              <ErrorDetails error={error} />
              <div className="error-actions">
                <button className="button button-primary" onClick={() => window.location.reload()}>Reload</button>
                <a className="button" href={reportMailto(error)}>Report ↗</a>
                <button className="button" onClick={onRetry}>Retry render</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function SectionFault({ name, error, onRetry }: { name: string; error: Error; onRetry: () => void }) {
  return (
    <div className="section-fault" role="alert">
      <p className="fault-label"><span className="error-tag">ERR</span> // MODULE FAILED TO LOAD</p>
      <p className="fault-name">{name}</p>
      <p className="fault-copy">This block crashed; the rest of the page is unaffected.</p>
      <ErrorDetails error={error} />
      <button className="button fault-retry" onClick={onRetry}>Retry</button>
    </div>
  );
}

interface ErrorBoundaryProps {
  name: string;
  variant: 'page' | 'section';
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error(`[ErrorBoundary:${this.props.name}]`, error, info.componentStack);
    }
  }

  private retry = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.variant === 'section') {
      return <SectionFault name={this.props.name} error={error} onRetry={this.retry} />;
    }
    return <SystemFaultScreen error={error} onRetry={this.retry} />;
  }
}

export function NotFoundScreen({ path, onHome, onNavigate, onPalette }: { path: string; onHome: () => void; onNavigate: (slug: string, label: string) => void; onPalette: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const suggestion = closestSection(path);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="error-screen" aria-labelledby="not-found-title">
      <div className="container">
        <div className="error-console">
          <ConsoleHead title="JEDV // ROUTE NOT FOUND" />
          <div className="error-console-body">
            <p className="error-kicker"><span className="error-tag">ERR 404</span> // ROUTE NOT FOUND</p>
            <h1 id="not-found-title" ref={headingRef} tabIndex={-1} className="error-title">No such directory.</h1>
            <div className="error-lines" aria-label="Terminal output">
              <p><span className="error-prompt" aria-hidden="true">&gt;</span> cd {path}</p>
              <p>no such directory: {path}</p>
              {suggestion && <p>did you mean <span className="error-suggest-path">/{suggestion.slug}</span>?</p>}
            </div>
            {suggestion && (
              <div className="error-actions">
                <button className="button" onClick={() => onNavigate(suggestion.slug, suggestion.label)}>Go to /{suggestion.slug} — {suggestion.label}</button>
              </div>
            )}
            <div className="error-actions">
              <button className="button button-primary" onClick={onHome}>Return home</button>
              <button className="button button-console" onClick={onPalette}><span className="button-prompt">$</span> Open command palette <kbd>⌘K</kbd></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
