import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, ReactNode, RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { certifications, email, projects, skillGroups, timeline, type Project, type ProjectStatus, type SkillItem } from './data';
import { ErrorBoundary, NotFoundScreen, parseRoute } from './errors';
import type { RouteState } from './errors';
import {
  SiJavascript,
  SiTypescript,
  SiPython,
  SiHtml5,
  SiCss,
  SiReact,
  SiNextdotjs,
  SiTailwindcss,
  SiNodedotjs,
  SiLaravel,
  SiCodeigniter,
  SiJsonwebtokens,
  SiMysql,
  SiMariadb,
  SiSqlite,
  SiDocker,
  SiGit,
  SiGithub,
  SiRailway,
  SiVercel,
  SiLinux,
  SiOpenjdk,
  SiClaude,
  SiXampp,
  SiPhp,
  SiExpo,
  SiCplusplus,
  SiSharp,
  SiHostinger,
  SiCursor,
  SiOpencode,
} from 'react-icons/si';
import { FaWindows, FaDatabase, FaDesktop, FaKey, FaShieldAlt, FaNetworkWired, FaProjectDiagram, FaChartLine, FaChartArea, FaChartBar, FaChartPie, FaBrain } from 'react-icons/fa';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

type Theme = 'dark' | 'light';
type ThemeMode = 'system' | 'light' | 'dark';
type Toast = { id: number; message: string };
type PaletteCommand = { id: string; label: string; group: string; hint?: string; action: () => void };

const THEME_KEY = 'jedv-theme';
const THEME_COLORS: Record<Theme, string> = { dark: '#0A0A0A', light: '#f7f6f2' };

// Single theme hook: mode is system/light/dark (default system), resolved
// is the applied value. Only explicit light/dark persist; system removes
// the key. SSR-safe: no window access outside effects and guarded reads.
function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'system';
    try {
      const stored = window.localStorage.getItem(THEME_KEY);
      return stored === 'light' || stored === 'dark' ? stored : 'system';
    } catch {
      return 'system';
    }
  });
  const [systemDark, setSystemDark] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  ));
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  const resolved: Theme = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;
  useEffect(() => {
    const root = document.documentElement;
    // Swap with transitions suppressed so all surfaces (including those
    // with hover transitions, like project cards) flip in the same paint
    // instead of lagging behind. Removed after two frames; hover transitions
    // after that are unaffected.
    root.classList.add('theme-instant');
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[resolved]);
    const raf = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => root.classList.remove('theme-instant'));
    });
    return () => window.cancelAnimationFrame(raf);
  }, [resolved]);
  const select = (next: ThemeMode) => {
    setMode(next);
    try {
      if (next === 'system') window.localStorage.removeItem(THEME_KEY);
      else window.localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private mode: keep the choice in memory for this session.
    }
  };
  return { mode, resolved, select };
}

// All scroll-tracked sections (nav highlights the nearest preceding nav item).
const sectionOrder = ['hero', 'about', 'skills', 'github', 'projects', 'experience', 'certifications', 'contact'];
const navSectionFor: Record<string, string> = {
  hero: 'hero',
  about: 'about',
  skills: 'about',
  github: 'projects',
  projects: 'projects',
  experience: 'experience',
  certifications: 'certifications',
  contact: 'contact',
};

const navItems = [
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'contact', label: 'Contact' },
];

// Rail tone: each tick takes the root theme (every band now follows the
// color mode, so all ticks agree). Attribute writes only, no re-render.
function updateRailTones() {
  const ticks = document.querySelectorAll<HTMLElement>('.rail-tick');
  if (!ticks.length) return;
  const tone = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  ticks.forEach((tick) => {
    if (tick.dataset.tone !== tone) tick.dataset.tone = tone;
  });
}

// Single shared scroll-spy: the nav id whose section range contains a line
// at ~35% viewport height. Short trailing sections can never pull their top
// up to a header/top-center line (the page bottom clamps first), so when
// scrolled within ~2px of the bottom the last section wins outright.
function readActiveNav(): string {
  const vh = window.innerHeight;
  if (window.scrollY + vh >= document.documentElement.scrollHeight - 2) return 'contact';
  const line = vh * 0.35;
  for (const id of sectionOrder) {
    const section = document.getElementById(id);
    if (!section) continue;
    const rect = section.getBoundingClientRect();
    if (rect.top <= line && rect.bottom >= line) return navSectionFor[id] ?? id;
  }
  return 'hero';
}

// STEP 4: rail follows DOM order (skills sits between about and projects).
// Active state reuses activeSection — no second source of truth.
const railItems = [
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'contact', label: 'Contact' },
];

const filters: Array<'All' | ProjectStatus> = ['All', 'Shipped', 'In Progress'];

// The desktop-only project deck (pinned, stacked cards) exists solely under
// this query. Every deck visual driver must check it so mobile — a static
// vertical list with no trigger — never gets card visuals forced on it.
const DESKTOP_DECK_QUERY = '(min-width: 701px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';
const isDesktopDeck = () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_DECK_QUERY).matches;

// Pin/start contract for the projects deck (single source of truth — the
// filter reset below lands on the rebuilt trigger's start, which derives
// from this): the frame parks flush with the viewport top, and the frame's
// own 88px top padding keeps the heading clear of the sticky header. This
// only holds because the desktop section padding-top is 0 both before the
// pin starts and while pinned (media-driven, never state-driven).
const PROJECTS_PIN_START = 'top top';

function ArrowUpRight() {
  return <span aria-hidden="true" className="arrow-icon">↗</span>;
}

function SocialIcon({ network }: { network: 'github' | 'facebook' | 'linkedin' }) {
  const paths = {
    github: 'M12 2.5a9.5 9.5 0 0 0-3 18.51c.48.09.66-.21.66-.46v-1.67c-2.68.58-3.25-1.13-3.25-1.13-.44-1.11-1.08-1.41-1.08-1.41-.88-.6.07-.59.07-.59.97.07 1.48 1 1.48 1 .86 1.48 2.25 1.05 2.8.8.09-.62.34-1.05.61-1.29-2.14-.24-4.39-1.07-4.39-4.77 0-1.05.37-1.9 1-2.57-.1-.24-.43-1.22.1-2.54 0 0 .82-.26 2.61.98a9.08 9.08 0 0 1 4.74 0c1.79-1.24 2.61-.98 2.61-.98.53 1.32.2 2.3.1 2.54.63.67 1 1.52 1 2.57 0 3.71-2.26 4.52-4.41 4.76.35.3.65.9.65 1.82v2.48c0 .25.17.55.66.46A9.5 9.5 0 0 0 12 2.5Z',
    facebook: 'M13.5 21v-8h2.75l.41-3h-3.16V8.08c0-.87.24-1.46 1.5-1.46h1.81V3.94c-.31-.04-1.38-.14-2.61-.14-2.58 0-4.35 1.58-4.35 4.48V10H7.08v3h2.77v8h3.65Z',
    linkedin: 'M5.1 7.24a2.12 2.12 0 1 0 0-4.24 2.12 2.12 0 0 0 0 4.24ZM3.3 20.99h3.6V9.25H3.3v11.74ZM9.17 9.25h3.45v1.6h.05c.48-.92 1.66-1.89 3.42-1.89 3.66 0 4.34 2.41 4.34 5.55v6.48h-3.6v-5.75c0-1.37-.03-3.13-1.91-3.13-1.91 0-2.2 1.49-2.2 3.02v5.86H9.17V9.25Z',
  };
  return <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={paths[network]} /></svg>;
}

function FigmaIcon() {
  return <svg className="figma-icon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M7 2h5v6H7a3 3 0 1 1 0-6Z" /><path d="M12 2h3a3 3 0 1 1 0 6h-3V2Z" /><path d="M7 8h5v6H7a3 3 0 1 1 0-6Z" /><path d="M12 8h3a3 3 0 1 1 0 6h-3V8Z" /><path d="M7 14h5v3a3 3 0 1 1-5-3Z" /></svg>;
}

function SkillIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  // Brand marks where they exist, monochrome; generic FA glyphs for
  // concepts/algorithms with no brand logo so no pill looks empty.
  const wrap = (icon: ReactNode) => <span className="skill-icon" aria-hidden="true">{icon}</span>;
  if (n.includes('javascript') && !n.includes('typescript')) return wrap(<SiJavascript />);
  if (n.includes('typescript')) return wrap(<SiTypescript />);
  if (n === 'java') return wrap(<SiOpenjdk />);
  if (n === 'c#' || n.includes('c#')) return wrap(<SiSharp />);
  if (n.includes('c++')) return wrap(<SiCplusplus />);
  if (n.includes('python')) return wrap(<SiPython />);
  if (n === 'php') return wrap(<SiPhp />);
  if (n.includes('html')) return wrap(<SiHtml5 />);
  if (n.includes('css') && n.includes('tailwind')) return wrap(<SiTailwindcss />);
  if (n.includes('css')) return wrap(<SiCss />);
  if (n.includes('sql') && !n.includes('mysql') && !n.includes('sqlite') && !n.includes('mariadb')) return wrap(<FaDatabase />);
  if (n.includes('react native')) return wrap(<SiExpo />);
  if (n.includes('react')) return wrap(<SiReact />);
  if (n.includes('next.js')) return wrap(<SiNextdotjs />);
  if (n.includes('java swing')) return wrap(<FaDesktop />);
  if (n.includes('node')) return wrap(<SiNodedotjs />);
  if (n.includes('laravel')) return wrap(<SiLaravel />);
  if (n.includes('codeigniter')) return wrap(<SiCodeigniter />);
  if (n.includes('jwt')) return wrap(<SiJsonwebtokens />);
  if (n.includes('bcrypt')) return wrap(<FaKey />);
  if (n === 'mysql') return wrap(<SiMysql />);
  if (n.includes('mariadb')) return wrap(<SiMariadb />);
  if (n.includes('sqlite')) return wrap(<SiSqlite />);
  if (n.includes('aes') || n.includes('encryption')) return wrap(<FaShieldAlt />);
  if (n.includes('docker')) return wrap(<SiDocker />);
  if (n === 'git / github') return wrap(<SiGithub />);
  if (n.includes('github')) return wrap(<SiGithub />);
  if (n.includes('git')) return wrap(<SiGit />);
  if (n.includes('railway')) return wrap(<SiRailway />);
  if (n.includes('hostinger')) return wrap(<SiHostinger />);
  if (n.includes('vercel')) return wrap(<SiVercel />);
  if (n.includes('linux')) return wrap(<SiLinux />);
  if (n.includes('windows')) return wrap(<FaWindows />);
  if (n.includes('xampp') || n.includes('lampp')) return wrap(<SiXampp />);
  if (n.includes('figma')) return wrap(<FigmaIcon />);
  if (n.includes('network')) return wrap(<FaNetworkWired />);
  if (n.includes('data model')) return wrap(<FaProjectDiagram />);
  if (n.includes('power bi')) return wrap(<FaChartBar />);
  if (n.includes('tableau')) return wrap(<FaChartPie />);
  if (n.includes('forecast')) return wrap(<FaChartLine />);
  if (n.includes('sarima')) return wrap(<FaChartArea />);
  if (n.includes('xgboost')) return wrap(<FaBrain />);
  if (n.includes('claude')) return wrap(<SiClaude />);
  if (n.includes('opencode')) return wrap(<SiOpencode />);
  if (n.includes('cursor')) return wrap(<SiCursor />);
  // generic fallback - first letter in a tiny badge
  return wrap(<span style={{width:'100%',height:'100%',display:'grid',placeItems:'center',border:'1px solid currentColor',fontSize:'0.62em',fontWeight:800,lineHeight:1}}>{name.trim()[0]?.toUpperCase()}</span>);
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="section-label"><span className="label-dot" aria-hidden="true" />{children}</p>;
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  return <span className={`status-badge status-${status.toLowerCase().replace(' ', '-')}`}><span className="status-dot" aria-hidden="true" />{status}</span>;
}

function ThemeGlyph({ kind }: { kind: ThemeMode }) {
  const props = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'square' as const, 'aria-hidden': true };
  if (kind === 'light') {
    return <svg {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" /></svg>;
  }
  if (kind === 'dark') {
    return <svg {...props}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>;
  }
  return <svg {...props}><rect x="2" y="3" width="20" height="13" /><path d="M8 21h8M12 17v4" /></svg>;
}

function ThemeControl({ mode, onSelect }: { mode: ThemeMode; onSelect: (mode: ThemeMode, el: HTMLElement | null) => void }) {
  const options: Array<{ id: ThemeMode; label: string }> = [
    { id: 'system', label: 'System theme' },
    { id: 'light', label: 'Light theme' },
    { id: 'dark', label: 'Dark theme' },
  ];
  return (
    <div className="theme-control" role="group" aria-label="Theme">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`theme-button${mode === option.id ? ' is-selected' : ''}`}
          aria-label={option.label}
          aria-pressed={mode === option.id}
          onClick={(event) => onSelect(option.id, event.currentTarget)}
        >
          <ThemeGlyph kind={option.id} />
        </button>
      ))}
    </div>
  );
}

function App() {
  const { mode: themeMode, select: selectThemeMode } = useTheme();
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [selectedCommand, setSelectedCommand] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [filter, setFilter] = useState<'All' | ProjectStatus>('All');
  const [resumeState, setResumeState] = useState<'idle' | 'preparing' | 'saved'>('idle');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [inspectionProject, setInspectionProject] = useState<Project | null>(null);
  // STEP 1 (UI layer): static-host route. No router in this app — the path is
  // read once (SSR-safe) and re-read on popstate. Unknown paths → 404 screen.
  const [route, setRoute] = useState<RouteState>(() => parseRoute());
  const paletteInputRef = useRef<HTMLInputElement>(null);
  const projectsFrameRef = useRef<HTMLDivElement>(null);
  const projectsStageRef = useRef<HTMLDivElement>(null);
  const projectListRef = useRef<HTMLDivElement>(null);
  const projectsTriggerRef = useRef<ScrollTrigger | null>(null);
  const deckIndexRef = useRef(0);
  const deckSettleRef = useRef<(() => void) | null>(null);
  // Filter swap span: scroll + progress captured before setFilter, consumed
  // by the restore effect after the deck rebuild. Freeze values restore the
  // section min-height and body anchor the handler overrides.
  const pendingFilterRestoreRef = useRef<{ y: number; progress: number; wasInside: boolean } | null>(null);
  const filterFreezeRef = useRef<{ minHeight: string; anchor: string; behavior: string } | null>(null);
  const projectsRefreshRaf = useRef(0);
  const timelineSectionRef = useRef<HTMLElement>(null);  const timelineViewportRef = useRef<HTMLDivElement>(null);
  const timelineTrackRef = useRef<HTMLDivElement>(null);
  const toastId = useRef(0);
  // Active theme-switch view transition, if any. A new toggle skips it
  // first so rapid clicks never stack and the switching attribute below
  // cannot get stuck.
  const transitionRef = useRef<ViewTransition | null>(null);
  const visibleProjects = projects.filter((project) => filter === 'All' || project.status === filter);
  // Mirror for handlers that must see the current dialog project without
  // re-subscribing (global Esc): plain ref read at call time, never stale.
  const inspectionProjectRef = useRef<Project | null>(null);
  inspectionProjectRef.current = inspectionProject;
  // Scroll-spy click lock: set on nav/rail/palette jumps, cleared on
  // scrollend or a timeout fallback, so the spy cannot override the click
  // while the smooth scroll is still traveling.
  const spyLockRef = useRef(false);
  const spyTimerRef = useRef(0);
  const lockSpy = (navId: string) => {
    setActiveSection(navId);
    spyLockRef.current = true;
    window.clearTimeout(spyTimerRef.current);
    spyTimerRef.current = window.setTimeout(() => { spyLockRef.current = false; }, 800);
  };

  const notify = (message: string) => {
    const id = toastId.current + 1;
    toastId.current = id;
    setToasts((current) => [...current, { id, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3200);
  };

  const scrollToSection = (id: string, _label: string) => {
    const el = document.getElementById(id);
    if (el) {
      lockSpy(navSectionFor[id] ?? id);
      // Immediate jump — no GSAP scrub / smooth delay.
      // Single shared value: measured sticky header height (69px fallback).
      const headerOffset = Math.ceil(document.querySelector('.site-header')?.getBoundingClientRect().height ?? 69);
      const top = el.getBoundingClientRect().top + window.scrollY - headerOffset + 1;
      window.scrollTo({ top, behavior: 'auto' });
      // Force ScrollTrigger to sync immediately instead of scrubbing
      ScrollTrigger.refresh();
      // Nudge GSAP ticker to update pins without easing lag
      gsap.delayedCall(0.02, () => ScrollTrigger.update());
    }
    setMobileNavOpen(false);
    setPaletteOpen(false);
  };

  const applyTheme = (next: ThemeMode, anchor?: HTMLElement | 'center' | null) => {
    if (next === themeMode) {
      notify(`Already in ${next}`);
      return;
    }
    const run = () => {
      selectThemeMode(next);
      notify(`Theme: ${next}`);
    };
    // Explicit toggle clicks only: OS-driven system changes and first
    // load flow through the theme effect instead and stay instant.
    if (
      typeof document === 'undefined' ||
      typeof document.startViewTransition !== 'function' ||
      reducedMotion
    ) {
      run();
      return;
    }
    const root = document.documentElement;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let from: string;
    if (anchor instanceof HTMLElement) {
      const rect = anchor.getBoundingClientRect();
      from = `inset(${Math.max(0, rect.top)}px ${Math.max(0, viewportWidth - rect.right)}px ${Math.max(0, viewportHeight - rect.bottom)}px ${Math.max(0, rect.left)}px)`;
    } else {
      from = `inset(${viewportHeight / 2}px ${viewportWidth / 2}px ${viewportHeight / 2}px ${viewportWidth / 2}px)`;
    }
    try {
      transitionRef.current?.skipTransition();
    } catch {
      // A finished transition has nothing to skip.
    }
    root.setAttribute('data-theme-switching', '');
    root.style.setProperty('--theme-wipe-from', from);
    let transition: ViewTransition;
    try {
      transition = document.startViewTransition(() => {
        flushSync(() => selectThemeMode(next));
      });
    } catch {
      root.removeAttribute('data-theme-switching');
      run();
      return;
    }
    transitionRef.current = transition;
    notify(`Theme: ${next}`);
    const settle = () => {
      if (transitionRef.current === transition) {
        transitionRef.current = null;
        root.removeAttribute('data-theme-switching');
        const applied = root.dataset.theme === 'light' ? 'light' : 'dark';
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[applied]);
      }
    };
    transition.finished.then(settle, settle);
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      const helper = document.createElement('textarea');
      helper.value = email;
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      document.execCommand('copy');
      helper.remove();
    }
    notify('Email copied');
  };

  const downloadResume = () => {
    setResumeState('preparing');
    notify('Resume downloading');
    const link = document.createElement('a');
    link.href = '/john-eduard-de-villa-resume.pdf';
    link.download = 'john-eduard-de-villa-resume.pdf';
    link.click();
    window.setTimeout(() => setResumeState('saved'), 700);
    window.setTimeout(() => setResumeState('idle'), 3200);
  };

  // Filter change never moves the page. There is no scroll to the section
  // top and no scroll to the rebuilt trigger start: the handler only
  // captures scrollY + deck progress, freezes the section height so the
  // pin-spacer teardown cannot collapse the document, swaps the list, and
  // lets the [filter] layout effect below revert/rebuild the pin. The
  // restore effect after it re-seats scroll (progress-mapped inside the
  // pin, same scrollY outside it) with instant jumps only.
  // Re-entry is safe and needs no suppression flag: a repeated call for
  // the selected option returns right after focus. A flag would stick: this
  // handler commits synchronously during pointerdown, the pin teardown moves
  // layout under the cursor, mouseup can land off the button so no click
  // ever arrives to consume the flag, and the stale flag would then swallow
  // the next keyboard or assistive click.
  const handleFilterChange = (option: 'All' | ProjectStatus, el?: HTMLElement | null) => {
    if (el) el.focus({ preventScroll: true });
    if (option === filter) return;
    const section = document.getElementById('projects');
    if (!section) {
      setFilter(option);
      return;
    }
    const st = projectsTriggerRef.current;
    const savedY = window.scrollY;
    const progress = Math.min(1, Math.max(0, st ? st.progress : 0));
    const wasInside = !!st && isDesktopDeck() && savedY >= st.start - 2 && savedY <= st.end + 2;
    pendingFilterRestoreRef.current = { y: savedY, progress, wasInside };
    filterFreezeRef.current = {
      minHeight: section.style.minHeight,
      anchor: document.body.style.overflowAnchor,
      behavior: document.documentElement.style.scrollBehavior,
    };
    // border-box is global, so minHeight matches the rendered height exactly.
    section.style.minHeight = `${section.offsetHeight}px`;
    // Page-wide anchor kill for the swap window (the projects-section rule
    // alone cannot suppress anchors living in later sections).
    document.body.style.overflowAnchor = 'none';
    // scrollTo with behavior auto would follow the CSS smooth rule, and so
    // would ScrollTrigger.refresh internal restores: force instant for the
    // swap window so every jump below stays a single step.
    document.documentElement.style.scrollBehavior = 'auto';
    deckIndexRef.current = 0;
    closeInspectionRef.current(false);
    setFilter(option);
  };

  const openProject = (project: Project) => {
    scrollToSection('projects', 'Projects');
    // immediate — no smooth/scrub lag
    const el = document.getElementById(project.id);
    if (el) window.setTimeout(() => el.scrollIntoView({ behavior: 'auto', block: 'center' }), 20);
    setPaletteOpen(false);
    notify(`Opening ${project.title}`);
  };

  const openInspection = (project: Project) => {
    setInspectionProject(project);
    setPaletteOpen(false);
  };

  // Single funnel for every case-file dialog close: chrome button, backdrop
  // click, Esc, filter change, unmount (the body lock restore lives in the
  // modal's own effect cleanup, so it runs on every path including unmount).
  // Restores focus to the originating card without scrolling the page.
  const closeInspection = (restoreFocus = true) => {
    const id = inspectionProjectRef.current?.id;
    setInspectionProject(null);
    if (restoreFocus && id) {
      window.requestAnimationFrame(() => {
        document.getElementById(id)?.querySelector<HTMLButtonElement>('.project-jump')?.focus({ preventScroll: true });
      });
    }
  };
  const closeInspectionRef = useRef(closeInspection);
  closeInspectionRef.current = closeInspection;

  // STEP 2: keep --header-h in sync with the real sticky header height.
  // 69px CSS fallback covers pre-JS / no-header cases. Refresh pins once
  // fonts land so heading metrics can't shift the pin under the header.
  useEffect(() => {
    const syncHeaderHeight = () => {
      const height = Math.ceil(document.querySelector('.site-header')?.getBoundingClientRect().height ?? 69);
      document.documentElement.style.setProperty('--header-h', `${height}px`);
    };
    syncHeaderHeight();
    window.addEventListener('resize', syncHeaderHeight);
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) {
        syncHeaderHeight();
        ScrollTrigger.refresh();
      }
    }).catch(() => undefined);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', syncHeaderHeight);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(mediaQuery.matches);
    updateMotion();
    mediaQuery.addEventListener('change', updateMotion);
    return () => mediaQuery.removeEventListener('change', updateMotion);
  }, []);

  // Hero intro — runs once on mount, no delay
  useEffect(() => {
    if (reducedMotion) {
      gsap.set(['.hero-kicker', '.hero-index', '#hero-title', '.hero-role', '.hero-intro', '.hero-actions .button', '.hero-portrait', '.hero-footer'], { clearProps: 'all' });
      return;
    }
    const ctx = gsap.context(() => {
      // ensure starting state is hidden (in case CSS left it visible)
      gsap.set(['.hero-kicker', '.hero-index', '#hero-title', '.hero-role', '.hero-intro', '.hero-actions .button', '.hero-portrait', '.hero-footer'], { autoAlpha: 1 });
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.hero-kicker', { y: 14, autoAlpha: 0, duration: 0.45 }, 0)
        .from('.hero-index', { y: 14, autoAlpha: 0, duration: 0.45 }, 0.07)
        .from('#hero-title', { y: 32, autoAlpha: 0, duration: 0.7 }, 0.1)
        .from('.hero-role', { y: 12, autoAlpha: 0, duration: 0.45 }, 0.28)
        .from('.hero-intro', { y: 14, autoAlpha: 0, duration: 0.5 }, 0.34)
        .from('.hero-actions .button', { y: 12, autoAlpha: 0, duration: 0.4, stagger: 0.07 }, 0.42)
        .from('.hero-portrait', { y: 22, autoAlpha: 0, scale: 0.97, duration: 0.6 }, 0.22)
        .from('.hero-footer', { autoAlpha: 0, duration: 0.35 }, 0.55);
    });
    return () => ctx.revert();
  }, [reducedMotion]);

  useEffect(() => {
    let ticking = false;
    const updateActiveSection = () => {
      ticking = false;
      if (spyLockRef.current) return;
      setActiveSection(readActiveNav());
      updateRailTones();
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateActiveSection);
      }
    };
    const onScrollEnd = () => {
      spyLockRef.current = false;
      window.clearTimeout(spyTimerRef.current);
    };
    updateActiveSection();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scrollend', onScrollEnd);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scrollend', onScrollEnd);
    };
  }, []);

  // Re-measure pins after viewport changes settle (fonts already refresh
  // via the header-sync effect).
  useEffect(() => {
    let timer = 0;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(true);
      }
      if (event.key === 'Escape') {
        setPaletteOpen(false);
        setMobileNavOpen(false);
        closeInspectionRef.current();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    if (paletteOpen) {
      setPaletteQuery('');
      setSelectedCommand(0);
      window.setTimeout(() => paletteInputRef.current?.focus(), 40);
      // STEP 2: lock body scroll while the palette is open (restored on close).
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prevOverflow; };
    }
    return undefined;
  }, [paletteOpen]);

  // STEP 1 (UI layer): route helpers. Scroll nav never touches history, so
  // these only run for deep links, back/forward, and the 404 screen.
  const goHome = () => {
    window.history.pushState({}, '', '/');
    setRoute({ kind: 'home' });
    setMobileNavOpen(false);
    setPaletteOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
    ScrollTrigger.refresh();
  };

  const goToSlug = (slug: string, label: string) => {
    window.history.pushState({}, '', `/${slug}`);
    setRoute({ kind: 'home' });
    setMobileNavOpen(false);
    setPaletteOpen(false);
    scrollToSection(slug, label);
  };

  const openPaletteFrom404 = () => {
    window.history.pushState({}, '', '/');
    setRoute({ kind: 'home' });
    window.scrollTo({ top: 0, behavior: 'auto' });
    setPaletteOpen(true);
  };

  useEffect(() => {
    const onPopState = () => setRoute(parseRoute());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Deep link: jump straight to the section (pins exist after mount).
  useEffect(() => {
    if (route.kind === 'section') {
      scrollToSection(route.id, route.label);
    }
  }, [route]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (route.kind !== 'missing') return undefined;
    const prevTitle = document.title;
    document.title = '404 // ROUTE NOT FOUND: JEDV';
    return () => { document.title = prevTitle; };
  }, [route]);

  // STEP 1 (UI layer): global handlers surface a toast instead of failing
  // silently. Step 2 rewires these to the useToast() manager.
  useEffect(() => {
    const pushFault = (message: string) => {
      const id = toastId.current + 1;
      toastId.current = id;
      setToasts((current) => [...current, { id, message }]);
      window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3200);
    };
    const onError = (event: ErrorEvent) => {
      pushFault(`ERR // ${event.message || 'unexpected fault'}`);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason ?? 'unhandled rejection');
      pushFault(`ERR // ${reason}`);
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  useLayoutEffect(() => {
    window.history.scrollRestoration = 'manual';
    const resetPage = () => {
      const html = document.documentElement;
      const previousScrollBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      window.scrollTo(0, 0);
      html.style.scrollBehavior = previousScrollBehavior;
      ScrollTrigger.refresh();
    };
    resetPage();
    const resetFrame = window.requestAnimationFrame(resetPage);
    // The browser restores scroll around/after load — after the resets above.
    // Re-assert top once loading settles (home route only; deep links scroll
    // to their section after boot instead).
    const onLoad = () => {
      if (parseRoute().kind === 'home') resetPage();
    };
    window.addEventListener('load', onLoad);
    return () => {
      window.cancelAnimationFrame(resetFrame);
      window.removeEventListener('load', onLoad);
    };
  }, []);

  const scheduleProjectsRefresh = () => {
    window.cancelAnimationFrame(projectsRefreshRaf.current);
    projectsRefreshRaf.current = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
  };

  // Keep pin geometry in sync after filter swaps (DOM size changed).
  useEffect(() => {
    scheduleProjectsRefresh();
    // Re-sync to the current card immediately; pin geometry refresh follows
    // on the next frame. Desktop-only: on mobile the cards are a static
    // list with no trigger to sync to.
    if (isDesktopDeck()) deckSettleRef.current?.();
    return () => window.cancelAnimationFrame(projectsRefreshRaf.current);
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  // STEP 2: container resizes (stage/list, incl. case-file expand) refresh pins.
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return undefined;
    const stageEl = projectsStageRef.current;
    const listEl = projectListRef.current;
    if (!stageEl && !listEl) return undefined;
    let raf = 0;
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    if (stageEl) observer.observe(stageEl);
    if (listEl) observer.observe(listEl);
    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [filter]);

  // STEP 4: scroll-end fallback — if any trigger callback is skipped during
  // a fast fling, re-derive the active card from real progress (~150 ms
  // after scrolling stops) and force its exact final state.
  useEffect(() => {
    let timer = 0;
    const onScrollEnd = () => {
      window.clearTimeout(timer);
      // Deck-only fallback: without the desktop pin there is no active card
      // to settle, and calling the stale closure would re-hide contents.
      if (!isDesktopDeck()) return;
      timer = window.setTimeout(() => deckSettleRef.current?.(), 150);
    };
    window.addEventListener('scroll', onScrollEnd, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScrollEnd);
      window.clearTimeout(timer);
    };
  }, []);

  // Safety net for desktop -> mobile switches: if any GSAP inline styles
  // survive context teardown (missed cleanup, killed tween), strip them
  // while the desktop deck is inactive so cards can never strand invisible
  // or offset. Desktop is untouched — this early-returns while the pin owns
  // the deck.
  useEffect(() => {
    const query = window.matchMedia(DESKTOP_DECK_QUERY);
    const resetDeckInlineStyles = () => {
      if (query.matches) return;
      document.querySelectorAll<HTMLElement>('.project-card').forEach((card) => {
        card.style.transform = '';
        card.style.opacity = '';
        card.style.visibility = '';
        card.style.zIndex = '';
      });
      document.querySelectorAll<HTMLElement>('.project-card-content').forEach((content) => {
        content.style.opacity = '';
        content.style.visibility = '';
      });
    };
    resetDeckInlineStyles();
    window.addEventListener('resize', resetDeckInlineStyles);
    if (typeof query.addEventListener === 'function') query.addEventListener('change', resetDeckInlineStyles);
    return () => {
      window.removeEventListener('resize', resetDeckInlineStyles);
      if (typeof query.removeEventListener === 'function') query.removeEventListener('change', resetDeckInlineStyles);
    };
  }, []);

  // Card-step keyboard nav: one ArrowDown/ArrowUp = one card while the
  // projects pin is engaged. Native arrow steps (~50px) can never cross a
  // ~600px card slot, so without this snap pulls every tap back to net zero
  // and the deck feels stuck. Wheel/touch behavior is untouched.
  useEffect(() => {
    const onDeckKeys = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) return;
      if (document.querySelector('.command-palette') || document.querySelector('.inspection-dialog')) return;
      const trigger = projectsTriggerRef.current;
      if (!trigger) return;
      // Engage anywhere inside the pin span (inclusive). isActive alone
      // misses the exact start/end boundary, which strands the first tap.
      const yNow = window.scrollY;
      if (yNow < trigger.start - 2 || yNow > trigger.end + 2) return;
      const count = projectListRef.current?.querySelectorAll('.project-card').length ?? 0;
      if (count < 2) return;
      const dir = event.key === 'ArrowDown' ? 1 : -1;
      const current = Math.round(trigger.progress * (count - 1));
      const next = Math.max(0, Math.min(count - 1, current + dir));
      // At the edge in the pressed direction, don't intercept: let the key
      // perform its native action so keyboard users can leave the pin.
      if (next === current) return;
      event.preventDefault();
      const y = trigger.start + (next / (count - 1)) * (trigger.end - trigger.start);
      window.scrollTo({ top: y, behavior: 'auto' });
    };
    window.addEventListener('keydown', onDeckKeys);
    return () => window.removeEventListener('keydown', onDeckKeys);
  }, []);

  useLayoutEffect(() => {
    const timelineViewport = timelineViewportRef.current;
    const timelineTrack = timelineTrackRef.current;
    if (!timelineViewport || !timelineTrack) return undefined;

    timelineViewport.scrollLeft = 0;
    gsap.set(timelineTrack, { x: 0 });

    const matchMedia = gsap.matchMedia();
    const context = gsap.context(() => {
        matchMedia.add('(min-width: 701px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
        const projectsFrame = projectsFrameRef.current;
        const projectStage = projectsStageRef.current;
        const projectList = projectListRef.current;
        const timelineSection = timelineSectionRef.current;
        if (!projectsFrame || !projectStage || !projectList || !timelineSection) return undefined;

          const projectCards = gsap.utils.toArray<HTMLElement>('.project-card', projectList);
          const projectCardContents = projectCards.map((card) => card.querySelector<HTMLElement>('.project-card-content')).filter((content): content is HTMLElement => Boolean(content));
          if (projectCards.length > 1) {
            const getProjectDistance = () => (projectCards.length - 1) * Math.max(projectStage.clientHeight * 1.15, 500);

            // STEP 3: canonical states — fully defined per card relative to
            // the active index. Active: autoAlpha 1 / scale 1 / zIndex 30.
            // Passed cards rest offset-left; upcoming cards rest stacked.
            const canonicalCardState = (cardIndex: number, activeIndex: number) => {
              if (cardIndex === activeIndex) {
                return { autoAlpha: 1, x: 0, y: 0, scale: 1, rotation: 0, zIndex: 30 };
              }
              if (cardIndex < activeIndex) {
                return { autoAlpha: 1, x: -34, y: -16, scale: 0.93, rotation: -2.5, zIndex: 0 };
              }
              const depth = cardIndex - activeIndex;
              return {
                autoAlpha: 1,
                x: 0,
                y: depth === 1 ? 12 : 24,
                scale: depth === 1 ? 0.965 : depth === 2 ? 0.935 : 0.94,
                rotation: 0,
                zIndex: depth === 1 ? 20 : depth === 2 ? 10 : 0,
              };
            };

            // Idempotent: every card always ends in its canonical state.
            // overwrite:true kills in-flight tweens, so fast flings and
            // reverse scrolls can't strand autoAlpha at 0.2-0.8.
            const setActiveCard = (activeIndex: number, duration: number) => {
              deckIndexRef.current = activeIndex;
              projectCards.forEach((card, cardIndex) => {
                const content = projectCardContents[cardIndex];
                gsap.to(card, { ...canonicalCardState(cardIndex, activeIndex), duration, ease: 'power2.out', overwrite: true });
                if (content) gsap.to(content, { autoAlpha: cardIndex === activeIndex ? 1 : 0, duration, ease: 'power2.out', overwrite: true });
              });
            };

            // Target is always derived from current progress (position),
            // never from tween progress.
            const indexFromProgress = (progress: number) => {
              const count = projectCards.length;
              const raw = Math.round(progress * (count - 1));
              return Math.max(0, Math.min(count - 1, raw));
            };

          gsap.set(projectCards, { autoAlpha: 1, x: 0, y: 0, scale: 0.94, rotation: 0, zIndex: 0 });
          gsap.set(projectCardContents, { autoAlpha: 0 });
          setActiveCard(0, 0);
          deckSettleRef.current = () => setActiveCard(indexFromProgress(projectsTriggerRef.current?.progress ?? 0), 0);
          // Scrub now drives ONLY pin/progress. Card visuals are set by
          // setActiveCard from onUpdate (position-derived), not by timeline
          // interpolation — the old .to()/.set() staging is gone.
          const projectTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: projectsFrame,
              start: PROJECTS_PIN_START,
              end: () => `+=${getProjectDistance()}`,
              pin: true,
              pinSpacing: true,
              scrub: 0.35,
              snap: {
                snapTo: 1 / Math.max(projectCards.length - 1, 1),
                duration: { min: 0.12, max: 0.2 },
                delay: 0.08,
                ease: 'power2.out',
                directional: false,
                onComplete: () => deckSettleRef.current?.(),
              },
              onUpdate: (self) => {
                const next = indexFromProgress(self.progress);
                if (next !== deckIndexRef.current) setActiveCard(next, 0.35);
              },
              // STEP 4: settle safety net — force the exact canonical state
              // once scrub catches up and whenever geometry is recomputed.
              onScrubComplete: () => deckSettleRef.current?.(),
              onRefresh: () => deckSettleRef.current?.(),
              invalidateOnRefresh: true,
              anticipatePin: 1,
              refreshPriority: 2,
              id: 'projects-reveal',
            },
          });
          projectsTriggerRef.current = projectTimeline.scrollTrigger ?? null;
          ScrollTrigger.refresh();
        } else {
          // 0 or 1 card: no pin, no snap. Strip any inline visuals the
          // previous deck wrote (React reuses DOM nodes across filters, so
          // a kept card could otherwise stay at autoAlpha 0 or an old
          // transform) and park the active index at the start.
          projectsTriggerRef.current = null;
          deckSettleRef.current = null;
          deckIndexRef.current = 0;
          gsap.set(projectCards, { clearProps: 'all' });
          gsap.set(projectCardContents, { clearProps: 'all' });
        }

        timelineViewport.scrollLeft = 0;
        gsap.set(timelineTrack, { x: 0 });
        // Travel so the LAST entry's center lands on the viewport center at
        // progress 1. Measured from the last card's true center (offsetLeft +
        // half width), not from scrollWidth: the track translates past its
        // own right edge and the trailing paper gap reads as end padding.
        // Function-based x + end with invalidateOnRefresh (below) recompute
        // exact centers on resize, fonts, and late images.
        const getLastEntryCenter = () => {
          const entries = timelineTrack.querySelectorAll<HTMLElement>('.timeline-entry');
          const last = entries[entries.length - 1];
          if (!last) return 0;
          return last.offsetLeft + last.offsetWidth / 2;
        };
        const getTimelineDistance = () => Math.max(getLastEntryCenter() - timelineViewport.clientWidth / 2, 0);
        // Marker-anchored progress fill driven by the existing horizontal
        // ScrollTrigger — no second trigger. Geometry note: a literal
        // `fill = readingLine - trackX` head cannot satisfy both end stops
        // (at progress 1 it would fall ~a viewport short of the end cap, and
        // a 35%-placed line contradicts starting exactly on the first dot),
        // so the head interpolates through the MEASURED marker centers
        // instead: exact on every dot, on the first dot at progress 0, on the
        // end cap at progress 1. The reading-line origin is the first
        // marker's rest position — the fill grows from there as the track
        // moves left underneath it. Active state derives from fill coverage
        // (a marker turns current the moment the fill covers its center), so
        // head and state can never decouple the way time-segment math did.
        // Transform-only per frame; every layout read lives in measure
        // (refresh / resize / fonts), never in onUpdate.
        let timelineAnchors: number[] = [];
        let timelineBarWidth = 0;
        const measureTimelineAnchors = () => {
          const entries = timelineTrack.querySelectorAll<HTMLElement>('.timeline-entry');
          const end = timelineTrack.querySelector<HTMLElement>('.timeline-end');
          const bar = timelineTrack.querySelector<HTMLElement>('.timeline-progress');
          const width = timelineTrack.scrollWidth;
          if (!entries.length || width <= 0 || !bar) {
            timelineAnchors = [];
            timelineBarWidth = 0;
            return;
          }
          const markers = Array.from(entries, (entry) => entry.offsetLeft);
          markers.push(end ? end.offsetLeft : width);
          timelineAnchors = markers;
          timelineBarWidth = bar.clientWidth || width;
        };
        // Track-coordinate x of the fill head for a ScrollTrigger progress.
        // Piecewise-linear through the measured anchors: exact on dots/caps.
        const fillXForProgress = (progress: number) => {
          const p = Math.min(1, Math.max(0, progress));
          const points = timelineAnchors;
          const segments = points.length - 1; // markers + END cap
          const t = Math.min(segments, Math.max(0, p * segments));
          const k = Math.min(segments - 1, Math.floor(t));
          const frac = t - k;
          return points[k] + (points[k + 1] - points[k]) * frac;
        };
        const paintTimelineProgress = (progress: number) => {
          const bar = timelineTrack.querySelector<HTMLElement>('.timeline-progress');
          if (!bar) return;
          const p = Math.min(1, Math.max(0, progress));
          if (!timelineAnchors.length || timelineBarWidth <= 0) {
            bar.style.transform = `scaleX(${p})`;
            return;
          }
          const first = timelineAnchors[0];
          const last = timelineAnchors[timelineAnchors.length - 1];
          const fillX = Math.min(last, Math.max(first, fillXForProgress(p)));
          bar.style.transform = `scaleX(${Math.min(1, Math.max(0, fillX / timelineBarWidth))})`;
        };
        // Marker states from fill coverage: covered markers are reached, the
        // last covered one is current. Scrolling back retracts the line in
        // reverse for free. Attributes toggle only when the index changes.
        let lastTimelineIndex = -1;
        const syncTimelineStates = (progress: number) => {
          const entries = timelineTrack.querySelectorAll<HTMLElement>('.timeline-entry');
          if (!entries.length) return;
          let active: number;
          if (!timelineAnchors.length) {
            const p = Math.min(1, Math.max(0, progress));
            active = Math.max(0, Math.min(entries.length - 1, Math.floor(p * entries.length)));
          } else {
            const fillX = fillXForProgress(progress);
            active = 0;
            for (let i = 0; i < entries.length; i += 1) {
              if (timelineAnchors[i] <= fillX + 0.5) active = i;
              else break;
            }
          }
          if (active === lastTimelineIndex) return;
          lastTimelineIndex = active;
          entries.forEach((entry, i) => {
            entry.dataset.state = i < active ? 'reached' : i === active ? 'current' : 'upcoming';
          });
          // Mono counter tied to the same activeIndex.
          const counter = timelineSection.querySelector<HTMLElement>('[data-timeline-counter]');
          if (counter) counter.textContent = `${String(active + 1).padStart(2, '0')} / ${String(entries.length).padStart(2, '0')}`;
        };
        measureTimelineAnchors();
        paintTimelineProgress(0);
        syncTimelineStates(0);
        if (getTimelineDistance() > 0) {
          gsap.to(timelineTrack, {
            x: () => -getTimelineDistance(),
            ease: 'none',
            scrollTrigger: {
              trigger: timelineSection,
              start: 'top top',
              end: () => `+=${getTimelineDistance()}`,
              pin: true,
              pinSpacing: true,
              scrub: true,
              onUpdate: (self) => {
                paintTimelineProgress(self.progress);
                syncTimelineStates(self.progress);
              },
              // Hide the fixed section rail while this pin owns the viewport
              // (its ticks read as stray marks over the paper line). Display
              // only — scroll geometry is unaffected.
              onToggle: (self) => {
                document.body.classList.toggle('timeline-pin-active', self.isActive);
              },
              onRefresh: (self) => {
                measureTimelineAnchors();
                paintTimelineProgress(self.progress);
                lastTimelineIndex = -1;
                syncTimelineStates(self.progress);
              },
              invalidateOnRefresh: true,
              anticipatePin: 1,
              refreshPriority: 1,
              id: 'timeline-horizontal',
            },
          });
        }

        const refresh = () => ScrollTrigger.refresh();
        window.addEventListener('resize', refresh);
        // Late font loads shift marker x positions (stale anchors put the
        // fill head far past the active dot). onRefresh re-measures and
        // repaints, so one extra refresh once fonts are in is enough.
        let timelineDisposed = false;
        if (typeof document !== 'undefined' && document.fonts) {
          document.fonts.ready.then(() => {
            if (!timelineDisposed) ScrollTrigger.refresh();
          }).catch(() => undefined);
        }
        // Late assets below the fold (the lazy GitHub chart above both pins,
        // the offline fallback swap) shift every pin start after the initial
        // refresh. One debounced refresh absorbs window load plus each late
        // image settling (load OR error — the error path swaps the box
        // height). No per-image work; the debounce collapses bursts.
        let layoutSettleTimer = 0;
        const scheduleRefresh = () => {
          window.clearTimeout(layoutSettleTimer);
          layoutSettleTimer = window.setTimeout(() => {
            if (!timelineDisposed) ScrollTrigger.refresh();
          }, 120);
        };
        window.addEventListener('load', scheduleRefresh);
        const lateImages = Array.from(document.querySelectorAll<HTMLImageElement>('img.github-chart-img'));
        lateImages.forEach((img) => {
          if (img.complete) return;
          img.addEventListener('load', scheduleRefresh);
          img.addEventListener('error', scheduleRefresh);
        });
        ScrollTrigger.refresh();
        const refreshFrame = window.requestAnimationFrame(refresh);
        return () => {
          timelineDisposed = true;
          document.body.classList.remove('timeline-pin-active');
          window.removeEventListener('resize', refresh);
          window.removeEventListener('load', scheduleRefresh);
          lateImages.forEach((img) => {
            img.removeEventListener('load', scheduleRefresh);
            img.removeEventListener('error', scheduleRefresh);
          });
          window.clearTimeout(layoutSettleTimer);
          window.cancelAnimationFrame(refreshFrame);
          if (projectsTriggerRef.current?.vars.id === 'projects-reveal') projectsTriggerRef.current = null;
          // Deck owns no visuals off-desktop: drop the settle closure so no
          // fallback can re-hide card contents on mobile, and strip every
          // inline style the deck wrote so a desktop -> mobile switch never
          // strands invisible or offset cards.
          deckSettleRef.current = null;
          gsap.set(projectCards, { clearProps: 'all' });
          gsap.set(projectCardContents, { clearProps: 'all' });
        };
      });
      ScrollTrigger.refresh();
    });

    return () => {
      matchMedia.revert();
      context.revert();
      projectsTriggerRef.current = null;
      deckSettleRef.current = null;
      timelineViewport.scrollLeft = 0;
      gsap.set(timelineTrack, { clearProps: 'transform' });
    };
  }, [filter]);

  // Restore scroll after a filter swap without a visible shift. Declared
  // after the deck rebuild above so it runs later in the same commit, still
  // pre-paint, and no frame ever shows the unrestored position. Inside the
  // pin: land on the same relative progress of the new range, so the pinned
  // frame sits exactly where it was. Outside it: keep the same scrollY,
  // clamped to the new document height. Mount-safe: pending is null until
  // a filter click sets it.
  useLayoutEffect(() => {
    const saved = pendingFilterRestoreRef.current;
    pendingFilterRestoreRef.current = null;
    if (!saved) return;
    const section = document.getElementById('projects');
    const freeze = filterFreezeRef.current;
    filterFreezeRef.current = null;
    if (section && freeze) section.style.minHeight = freeze.minHeight;
    document.body.style.overflowAnchor = freeze ? freeze.anchor : '';
    if (freeze) document.documentElement.style.scrollBehavior = freeze.behavior;
    ScrollTrigger.refresh();
    const st = projectsTriggerRef.current;
    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    let target = saved.y;
    if (saved.wasInside && st && isDesktopDeck()) {
      target = st.start + saved.progress * (st.end - st.start);
    }
    if (st && isDesktopDeck()) {
      // Any landing strictly inside the new pin range is rounded to the
      // nearest card slot, so the shown card is exact and the deck snap
      // has nothing left to drift toward. Landings outside the range keep
      // the same scrollY untouched.
      const count = projectListRef.current?.querySelectorAll('.project-card').length ?? 0;
      const span = st.end - st.start;
      if (count > 1 && span > 0 && target > st.start + 2 && target < st.end - 2) {
        const slot = Math.round(((target - st.start) / span) * (count - 1));
        target = st.start + (slot / (count - 1)) * span;
      }
    }
    target = Math.min(Math.max(0, target), maxY);
    if (Math.abs(window.scrollY - target) > 1) {
      window.scrollTo({ top: target, behavior: 'instant' as ScrollBehavior });
      ScrollTrigger.update();
    }
    if (isDesktopDeck()) deckSettleRef.current?.();
  }, [filter]);

  // Native horizontal-scroll timeline progress (mobile / touch / reduced
  // motion). The pinned GSAP ScrollTrigger above only exists on
  // min-width:701px + hover:hover + fine pointer — everywhere else the
  // viewport scrolls natively (overflow-x:auto) and nothing updated the
  // progress fill or entry states. This effect owns exactly that case:
  // it early-returns while the desktop pin is active, so desktop geometry,
  // scrub, and snap are untouched.
  useEffect(() => {
    const viewport = timelineViewportRef.current;
    const track = timelineTrackRef.current;
    const section = timelineSectionRef.current;
    if (!viewport || !track) return undefined;
    const desktopQuery = window.matchMedia('(min-width: 701px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');

    let anchors: number[] = [];
    let barWidth = 0;
    let lastIndex = -1;

    const measure = () => {
      const entries = track.querySelectorAll<HTMLElement>('.timeline-entry');
      const end = track.querySelector<HTMLElement>('.timeline-end');
      const bar = track.querySelector<HTMLElement>('.timeline-progress');
      const width = track.scrollWidth;
      if (!entries.length || width <= 0 || !bar) {
        anchors = [];
        barWidth = 0;
        return;
      }
      const markers = Array.from(entries, (entry) => entry.offsetLeft);
      markers.push(end ? end.offsetLeft : width);
      anchors = markers;
      barWidth = bar.clientWidth || width;
    };

    const fillXForProgress = (progress: number) => {
      const p = Math.min(1, Math.max(0, progress));
      if (anchors.length < 2) return p * barWidth;
      const segments = anchors.length - 1;
      const t = Math.min(segments, Math.max(0, p * segments));
      const k = Math.min(segments - 1, Math.floor(t));
      const frac = t - k;
      return anchors[k] + (anchors[k + 1] - anchors[k]) * frac;
    };

    const paint = (progress: number) => {
      const bar = track.querySelector<HTMLElement>('.timeline-progress');
      if (!bar) return;
      const p = Math.min(1, Math.max(0, progress));
      if (!anchors.length || barWidth <= 0) {
        bar.style.transform = `scaleX(${p})`;
        return;
      }
      const first = anchors[0];
      const last = anchors[anchors.length - 1];
      const fillX = Math.min(last, Math.max(first, fillXForProgress(p)));
      bar.style.transform = `scaleX(${Math.min(1, Math.max(0, fillX / barWidth))})`;
    };

    const syncStates = (progress: number) => {
      const entries = track.querySelectorAll<HTMLElement>('.timeline-entry');
      if (!entries.length) return;
      let active: number;
      if (!anchors.length) {
        const p = Math.min(1, Math.max(0, progress));
        active = Math.max(0, Math.min(entries.length - 1, Math.floor(p * entries.length)));
      } else {
        const fillX = fillXForProgress(progress);
        active = 0;
        for (let i = 0; i < entries.length; i += 1) {
          if (anchors[i] <= fillX + 0.5) active = i;
          else break;
        }
      }
      if (active === lastIndex) return;
      lastIndex = active;
      entries.forEach((entry, i) => {
        entry.dataset.state = i < active ? 'reached' : i === active ? 'current' : 'upcoming';
      });
      const counter = section?.querySelector<HTMLElement>('[data-timeline-counter]');
      if (counter) counter.textContent = `${String(active + 1).padStart(2, '0')} / ${String(entries.length).padStart(2, '0')}`;
    };

    const progressFromViewport = () => {
      const max = track.scrollWidth - viewport.clientWidth;
      if (max <= 0) return 0;
      return Math.min(1, Math.max(0, viewport.scrollLeft / max));
    };

    let raf = 0;
    const render = () => {
      raf = 0;
      if (desktopQuery.matches) return;
      // The desktop pin translates the track; native mode must stay at x:0
      // so offsetLeft anchors and scrollLeft stay in the same space.
      if (track.style.transform) track.style.transform = '';
      const p = progressFromViewport();
      paint(p);
      syncStates(p);
    };
    const schedule = () => {
      if (!raf) raf = window.requestAnimationFrame(render);
    };

    const handleMediaChange = () => {
      if (desktopQuery.matches) return;
      measure();
      lastIndex = -1;
      schedule();
    };

    measure();
    schedule();
    viewport.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', handleMediaChange);
    if (typeof desktopQuery.addEventListener === 'function') desktopQuery.addEventListener('change', handleMediaChange);
    let fontsSettled = false;
    document.fonts?.ready.then(() => {
      if (!fontsSettled) {
        fontsSettled = true;
        if (!desktopQuery.matches) {
          measure();
          lastIndex = -1;
          schedule();
        }
      }
    }).catch(() => undefined);

    return () => {
      window.cancelAnimationFrame(raf);
      viewport.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', handleMediaChange);
      if (typeof desktopQuery.removeEventListener === 'function') desktopQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  const commands: PaletteCommand[] = [
    ...navItems.map((item) => ({ id: `jump-${item.id}`, label: item.label, group: 'Jump to', hint: `/${item.id}`, action: () => scrollToSection(item.id, item.label) })),
    { id: 'jump-skills', label: 'Skills', group: 'Jump to', hint: '/skills', action: () => scrollToSection('skills', 'Skills') },
    { id: 'theme-system', label: 'Theme: System', group: 'Actions', hint: 'theme', action: () => applyTheme('system', 'center') },
    { id: 'theme-light', label: 'Theme: Light', group: 'Actions', hint: 'theme', action: () => applyTheme('light', 'center') },
    { id: 'theme-dark', label: 'Theme: Dark', group: 'Actions', hint: 'theme', action: () => applyTheme('dark', 'center') },
    { id: 'copy-email', label: 'Copy email address', group: 'Actions', hint: 'copy', action: copyEmail },
    { id: 'download-resume', label: 'Download résumé', group: 'Actions', hint: 'save', action: downloadResume },
    ...projects.map((project) => ({ id: `project-${project.id}`, label: project.title, group: 'Projects', hint: project.status, action: () => openProject(project) })),
  ];

  const matchingCommands = commands.filter((command) => `${command.label} ${command.group} ${command.hint ?? ''}`.toLowerCase().includes(paletteQuery.toLowerCase()));

  const handlePaletteKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedCommand((current) => Math.min(current + 1, Math.max(matchingCommands.length - 1, 0)));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedCommand((current) => Math.max(current - 1, 0));
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      matchingCommands[selectedCommand]?.action();
    }
  };

  return (
    <div className="site-shell">
      <div className="noise-layer" aria-hidden="true" />
      <SectionRail activeSection={activeSection} scrollToSection={scrollToSection} />
      <Header activeSection={activeSection} mobileNavOpen={mobileNavOpen} setMobileNavOpen={setMobileNavOpen} openPalette={() => setPaletteOpen(true)} scrollToSection={scrollToSection} themeMode={themeMode} onTheme={applyTheme} />

      {route.kind === 'missing' ? (
      <main aria-label="Not found">
        <NotFoundScreen path={route.path} onHome={goHome} onNavigate={goToSlug} onPalette={openPaletteFrom404} />
      </main>
      ) : (
      <main>
        <ErrorBoundary name="Hero" variant="section">
        <section className="hero-section" id="hero" aria-labelledby="hero-title">
          <div className="hero-grid" aria-hidden="true" />
          <div className="container hero-content">
            <div className="hero-copy reveal-on-load">
              <div className="hero-kicker">Available for new projects <span className="kicker-rule" /> Nasugbu / Remote</div>
              <p className="hero-index">7 / SYSTEMS SHIPPED <span>·</span> 5 / CLIENTS SERVED</p>
              <h1 id="hero-title">John Eduard<br /><em>De Villa</em></h1>
              <div className="hero-role"><span>Full-stack Developer, solo and end-to-end</span><span className="hero-location">Nasugbu, Batangas, Philippines</span></div>
              <p className="hero-intro">7 systems shipped for 5 clients. HILOM EHR now encrypts 28 tables with AES-256-GCM for a live medical center. From auth workflows to offline poultry sensors, I own the stack solo, end-to-end, while finishing my BSIT.</p>
              <HeroPortrait variant="inline" />
              <div className="hero-actions">
                <button className="button button-primary" onClick={() => scrollToSection('projects', 'Projects')}>See production work <ArrowUpRight /></button>
              </div>
            </div>
            <HeroPortrait variant="side" />
          </div>
          <div className="hero-footer container" aria-hidden="true"><span>INTRODUCTION</span><span>SCROLL TO INSPECT <span className="scroll-cue">↓</span></span></div>
        </section>
        </ErrorBoundary>

        <ErrorBoundary name="About" variant="section">
        <section className="about-section" id="about" aria-labelledby="about-title">
          <div className="container">
            <div className="section-heading-row">
              <div><h2 id="about-title">What I do &amp;<br /><em>how I work</em></h2></div>
            </div>
            <div className="about-layout">
              <div className="about-statement"><p>I ship systems people depend on. HILOM handles patient records. LayRate counts eggs without internet. I design the schema, write the auth, wire the sensor, and answer for it. I do this solo while finishing my BSIT.</p></div>
              <div className="about-approach"><p>I scope, schema-design, build, and ship myself. To move fast without cutting corners I run an AI-assisted loop: <strong>Opencode</strong> for codebase analysis, <strong>Claude Code</strong> for implementation, <strong>Cursor</strong> for review. I verify everything manually. Same hands wire the hardware: Linux Hyprland/Omarchy, Raspberry Pi 5 + Arduino (DHT22, IR break-beam) for the farm.</p></div>
              <StatusPanel />
            </div>
          </div>
        </section>
        </ErrorBoundary>

        <ErrorBoundary name="Skills" variant="section">
        <section className="stack-section" id="skills" aria-labelledby="skills-title">
          <div className="container">
            <div className="section-heading-row">
              <div><h2 id="skills-title">Stack<br /><em>inventory</em></h2></div>
            </div>
            <div className="skills-grid">{skillGroups.map((group) => <SkillGroup key={group.label} label={group.label} items={group.items} />)}</div>
          </div>
        </section>
        </ErrorBoundary>

        <ErrorBoundary name="GitHub activity" variant="section">
        <GitHubActivity />
        </ErrorBoundary>

        <ErrorBoundary name="Projects" variant="section">
        <section className="ink-section projects-section" id="projects" aria-labelledby="projects-title">
            <div ref={projectsFrameRef} className="container projects-pin-frame">
              <div className="projects-intro">
              <div className="section-heading-row projects-heading"><div><h2 id="projects-title">Production systems<br /><em>I’ve built</em></h2></div><div className="heading-side"><SectionLabel>Featured Projects</SectionLabel><p className="section-subheading">Evidence over adjectives.<br />Open a case file.</p></div></div>
              </div><div className="filter-bar" role="tablist" aria-label="Filter projects by status">{filters.map((option) => <button key={option} className={`filter-button ${filter === option ? 'is-selected' : ''}`} role="tab" aria-selected={filter === option} onPointerDown={(event) => { if (event.pointerType === 'mouse') handleFilterChange(option, event.currentTarget); }} onClick={(event) => handleFilterChange(option, event.currentTarget)}><span className="filter-count">{option === 'All' ? projects.length : projects.filter((project) => project.status === option).length}</span>{option}</button>)}</div><div className="projects-scroll-stage" ref={projectsStageRef}><div className="project-list project-deck" ref={projectListRef}>{visibleProjects.map((project) => <ProjectCard key={project.id} project={project} inspectProject={openInspection} />)}{visibleProjects.length === 0 && <EmptyDeckCard resetFilter={() => handleFilterChange('All')} />}</div></div>
</div>
        </section>
        </ErrorBoundary>

        <ErrorBoundary name="Experience" variant="section">
        <TimelineSection scrollToSection={scrollToSection} sectionRef={timelineSectionRef} viewportRef={timelineViewportRef} trackRef={timelineTrackRef} />
        </ErrorBoundary>

        <ErrorBoundary name="Certifications" variant="section">
        <CertificationsSection />
        </ErrorBoundary>

        <ErrorBoundary name="Contact" variant="section">
        <section className="contact-section" id="contact" aria-labelledby="contact-title">
          <div className="container contact-layout"><div><h2 id="contact-title">Let’s talk about<br /><em>your system</em></h2></div><div className="contact-copy"><p>If you have a system that needs shipping, email me with what it has to do and when it has to work.</p><button className="email-button" onClick={copyEmail} aria-label={`Copy ${email}`}><span className="email-prefix">mailto://</span>{email}<ArrowUpRight /></button><div className="contact-meta"><span>Nasugbu, Batangas, Philippines</span><div className="social-row" aria-label="Social links"><a className="social-link" href="https://github.com/23-74173-cpu" target="_blank" rel="noreferrer"><SocialIcon network="github" />GitHub</a><a className="social-link" href="https://web.facebook.com/joed.devilla/" target="_blank" rel="noreferrer"><SocialIcon network="facebook" />Facebook</a><a className="social-link" href="https://www.linkedin.com/in/john-eduard-de-villa-78689935a/" target="_blank" rel="noreferrer"><SocialIcon network="linkedin" />LinkedIn</a></div></div><button className="resume-button" onClick={downloadResume}>{resumeState === 'preparing' ? 'Preparing…' : resumeState === 'saved' ? '✓ Saved' : 'Download Résumé'}<ArrowUpRight /></button></div></div>
        </section>
        </ErrorBoundary>
      </main>
      )}

      <footer className="site-footer"><div className="container footer-content"><span>© 2026 John Eduard De Villa</span><span className="footer-built">Built with React <span className="footer-separator">·</span> Vite <span className="footer-separator">·</span> Tailwind</span><span className="footer-mark" aria-label="JEDV">JEDV<span className="wordmark-cursor">_</span></span></div></footer>

      <div className="toast-region" aria-live="polite" aria-atomic="true">{toasts.map((toast) => <div className="toast" key={toast.id}><span className="toast-mark">✓</span>{toast.message}</div>)}</div>

      {paletteOpen && <CommandPalette inputRef={paletteInputRef} query={paletteQuery} setQuery={setPaletteQuery} selectedCommand={selectedCommand} setSelectedCommand={setSelectedCommand} commands={matchingCommands} onKeyDown={handlePaletteKeyDown} close={() => setPaletteOpen(false)} />}
      {inspectionProject && <InspectionModal project={inspectionProject} close={() => closeInspection()} />}
    </div>
  );
}

function SectionRail({ activeSection, scrollToSection }: { activeSection: string; scrollToSection: (id: string, label: string) => void }) {
  return (
    <nav className="section-rail" aria-label="Section navigation">
      {railItems.map((item) => (
        <button
          key={item.id}
          className={`rail-tick${activeSection === item.id ? ' is-active' : ''}`}
          onClick={() => scrollToSection(item.id, item.label)}
          aria-label={`Go to ${item.label}`}
          aria-current={activeSection === item.id ? 'true' : undefined}
        >
          <span className="rail-label" aria-hidden="true">{item.label}</span>
          <span className="tick-bar" aria-hidden="true" />
        </button>
      ))}
    </nav>
  );
}

function Header({ activeSection, mobileNavOpen, setMobileNavOpen, openPalette, scrollToSection, themeMode, onTheme }: { activeSection: string; mobileNavOpen: boolean; setMobileNavOpen: (open: boolean) => void; openPalette: () => void; scrollToSection: (id: string, label: string) => void; themeMode: ThemeMode; onTheme: (mode: ThemeMode, anchor?: HTMLElement | 'center' | null) => void }) {
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  return <header className="site-header"><div className="container header-inner"><button className="wordmark" onClick={() => scrollToSection('about', 'About')} aria-label="Go to top">JEDV<span className="wordmark-cursor">_</span></button><nav className="desktop-nav" aria-label="Primary navigation">{navItems.map((item) => <button key={item.id} className={activeSection === item.id ? 'active' : ''} onClick={() => scrollToSection(item.id, item.label)}>{item.label}</button>)}</nav><div className="header-actions"><ThemeControl mode={themeMode} onSelect={(mode, el) => onTheme(mode, el)} /><button className="jump-button" onClick={openPalette}>Jump <kbd>⌘K</kbd></button><button ref={menuButtonRef} className="mobile-menu-button" aria-expanded={mobileNavOpen} aria-controls="mobile-nav" onClick={() => setMobileNavOpen(!mobileNavOpen)}><span className="sr-only">{mobileNavOpen ? 'Close menu' : 'Open menu'}</span><span className="menu-lines" aria-hidden="true"><i /><i /></span></button></div></div>{mobileNavOpen && <nav id="mobile-nav" className="mobile-nav" aria-label="Mobile navigation">{navItems.map((item) => <button key={item.id} className={activeSection === item.id ? 'active' : ''} onClick={() => scrollToSection(item.id, item.label)}>{item.label}<ArrowUpRight /></button>)}<button onClick={openPalette}>Open command palette <kbd>⌘K</kbd></button><div className="mobile-theme-row"><span>Theme</span><ThemeControl mode={themeMode} onSelect={(mode) => onTheme(mode, menuButtonRef.current)} /></div></nav>}</header>;
}

function HeroPortrait({ variant }: { variant: 'side' | 'inline' }) {
  // The halftone portrait is the photo — no crossfade, no loader. The hero
  // intro tween (y + fade on .hero-portrait) is the entrance reveal.
  return (
    <figure className={`hero-portrait hero-portrait--${variant}`} aria-label="Portrait of John Eduard De Villa">
      <div className="hero-portrait-top"><span>JEDV / PORTRAIT</span><span>SOLO</span></div>
      <div className="hero-portrait-frame" onContextMenu={(event) => event.preventDefault()}>
        <picture className="hero-portrait-img">
          <source srcSet="/PixProfilePic.avif" type="image/avif" />
          <source srcSet="/PixProfilePic.webp" type="image/webp" />
          <img
            src="/PixProfilePic.png"
            alt="Halftone black-and-white portrait of John Eduard De Villa"
            width={1087}
            height={1447}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            draggable={false}
            className="no-copy-img"
          />
        </picture>
        <span className="hero-portrait-veil" aria-hidden="true" />
      </div>
    </figure>
  );
}

function GitHubActivity() {
  const [chartFailed, setChartFailed] = useState(false);
  // Contribution cells embedded at build time (see scripts/prerender.mjs):
  // [column, row, level 0-4, date, count]. Null on SSR or when the build
  // fetch failed, in which case the live fetch or upstream image is used.
  const chartData = useMemo(() => {
    if (typeof document === 'undefined') return null;
    try {
      const node = document.getElementById('gh-data');
      if (!node || !node.textContent) return null;
      const parsed = JSON.parse(node.textContent) as {
        total: number; start: string; end: string; cells: Array<[number, number, number, string, number]>;
      };
      if (!Array.isArray(parsed.cells) || parsed.cells.length === 0) return null;
      return parsed;
    } catch {
      return null;
    }
  }, []);
  // Live data keeps the grid fresh daily and works where the build embed
  // is absent (notably `vite dev`, whose index.html has no gh-data tag).
  // Levels come straight from GitHub's own 0-4 scale.
  const [liveData, setLiveData] = useState<typeof chartData>(null);
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 10000);
    fetch('https://github-contributions-api.jogruber.de/v4/23-74173-cpu?y=last', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`contributions HTTP ${response.status}`);
        return response.json() as Promise<{
          total: { lastYear: number };
          contributions: Array<{ date: string; count: number; level: number }>;
        }>;
      })
      .then((payload) => {
        if (cancelled || !Array.isArray(payload.contributions) || payload.contributions.length === 0) return;
        const day = 86400000;
        const first = Date.parse(`${payload.contributions[0].date}T00:00:00Z`);
        const firstSunday = first - new Date(first).getUTCDay() * day;
        const cells = payload.contributions.map((entry) => {
          const time = Date.parse(`${entry.date}T00:00:00Z`);
          const col = Math.round((time - firstSunday) / day / 7);
          const row = new Date(time).getUTCDay();
          const level = Math.min(4, Math.max(0, Math.round(entry.level)));
          const count = Number.isFinite(entry.count) ? entry.count : 0;
          return [col, row, level, entry.date, count] as [number, number, number, string, number];
        });
        const dates = payload.contributions.map((entry) => entry.date).sort();
        setLiveData({
          total: payload.total?.lastYear ?? cells.reduce((sum, cell) => sum + cell[4], 0),
          start: dates[0],
          end: dates[dates.length - 1],
          cells,
        });
      })
      .catch(() => {
        // Fall through to embedded data or the upstream image.
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, []);
  const effectiveData = liveData ?? chartData;
  // GitHub pitch: 10px squares, 3px gaps, square corners. Month labels sit
  // in the top strip, weekday labels in the left gutter.
  const chartLayout = useMemo(() => {
    if (!effectiveData) return null;
    const step = 13;
    const size = 10;
    const x0 = 32;
    const y0 = 24;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const maxCol = effectiveData.cells.reduce((max, cell) => Math.max(max, cell[0]), 0);
    const colMonth = new Map<number, number>();
    effectiveData.cells.forEach(([col, , , date]) => {
      if (!colMonth.has(col)) colMonth.set(col, Number(date.slice(5, 7)) - 1);
    });
    const months: Array<{ col: number; text: string }> = [];
    let lastMonth = -1;
    let lastCol = -99;
    for (let col = 0; col <= maxCol; col += 1) {
      const month = colMonth.get(col);
      if (month === undefined) continue;
      if (month !== lastMonth && col - lastCol >= 3) {
        months.push({ col, text: monthNames[month] });
        lastMonth = month;
        lastCol = col;
      }
    }
    return {
      step, size, x0, y0,
      width: x0 + maxCol * step + size + 14,
      height: y0 + 6 * step + size + 8,
      months,
      weekdays: [
        { row: 1, text: 'Mon' },
        { row: 3, text: 'Wed' },
        { row: 5, text: 'Fri' },
      ],
    };
  }, [effectiveData]);
  const formatCellDate = (date: string) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const parts = date.split('-');
    return `${monthNames[Number(parts[1]) - 1]} ${Number(parts[2])}`;
  };
  const formatCellCount = (count: number) => (
    count <= 0 ? 'No contributions' : count === 1 ? '1 contribution' : `${count} contributions`
  );
  return (
      <section className="github-section" id="github" aria-labelledby="github-title">
      <div className="container">
        <div className="section-heading-row">
          <div><h2 id="github-title">Commit<br /><em>activity</em></h2></div>
        </div>
        <div className="github-grid-wrap">
          <div className="github-chart-frame">
            <div className="github-chart-header">
              <span className="palette-lights" aria-hidden="true"><i /><i /><i /></span>
              <span>23-74173-cpu / contributions</span>
              <a href="https://github.com/23-74173-cpu" target="_blank" rel="noreferrer">View profile ↗</a>
            </div>
            <div className="github-chart-link">
              {chartFailed ? (
                <div className="github-chart-fallback" role="status">
                  <span>Contribution chart unavailable offline.</span>
                  <a href="https://github.com/23-74173-cpu" target="_blank" rel="noreferrer">View profile ↗</a>
                </div>
              ) : effectiveData && chartLayout ? (
                <a href="https://github.com/23-74173-cpu" target="_blank" rel="noreferrer" aria-label={`View GitHub profile, ${effectiveData.total} contributions from ${effectiveData.start} to ${effectiveData.end}`}>
                  {/* Width and height attrs reserve the exact ratio before
                      paint, so pin starts below this section never shift. */}
                  <svg
                    className="github-chart-svg no-copy-img"
                    viewBox={`0 0 ${chartLayout.width} ${chartLayout.height}`}
                    width={chartLayout.width}
                    height={chartLayout.height}
                    role="img"
                    aria-label={`${effectiveData.total} contributions from ${effectiveData.start} to ${effectiveData.end}`}
                  >
                    {chartLayout.months.map((month) => (
                      <text
                        key={`m${month.col}`}
                        className="gh-axis"
                        x={chartLayout.x0 + month.col * chartLayout.step}
                        y="13"
                      >
                        {month.text}
                      </text>
                    ))}
                    {chartLayout.weekdays.map((day) => (
                      <text
                        key={day.text}
                        className="gh-axis"
                        x={chartLayout.x0 - 6}
                        y={chartLayout.y0 + day.row * chartLayout.step + chartLayout.size / 2}
                        textAnchor="end"
                        dominantBaseline="central"
                      >
                        {day.text}
                      </text>
                    ))}
                    {effectiveData.cells.map(([col, row, level, date, count]) => (
                      <rect
                        key={date}
                        className="gh-cell"
                        data-level={Math.min(4, Math.max(0, level))}
                        x={chartLayout.x0 + col * chartLayout.step}
                        y={chartLayout.y0 + row * chartLayout.step}
                        width={chartLayout.size}
                        height={chartLayout.size}
                      >
                        <title>{`${formatCellCount(count)} on ${formatCellDate(date)}`}</title>
                      </rect>
                    ))}
                  </svg>
                </a>
              ) : (
                <a href="https://github.com/23-74173-cpu" target="_blank" rel="noreferrer" aria-label="View GitHub profile">
                  <img
                    src="https://ghchart.rshah.org/23-74173-cpu"
                    alt="GitHub contributions chart for 23-74173-cpu"
                    loading="lazy"
                    decoding="async"
                    // Must match the upstream asset's true ratio (measured
                    // 663x104): the browser reserves height from these before
                    // the lazy image arrives, so a wrong ratio shifts every
                    // pin start below this section. Re-measure if upstream
                    // changes the canvas; the debounced refresh in the scroll
                    // effect absorbs any residual drift.
                    width="663"
                    height="104"
                    className="github-chart-img no-copy-img"
                    draggable={false}
                    onError={() => setChartFailed(true)}
                  />
                </a>
              )}
            </div>
            {effectiveData && chartLayout && !chartFailed && (
              <div className="github-legend" aria-hidden="true">
                <span>Less</span>
                {[0, 1, 2, 3, 4].map((level) => (
                  <i key={level} className="gh-swatch" data-level={level} />
                ))}
                <span>More</span>
              </div>
            )}
          </div>
          <div className="github-meta">
            <span>github.com/23-74173-cpu</span>
            <span className="github-meta-dot" aria-hidden="true" />
            <span>updated daily via ghchart</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusPanel() {
  return <div className="status-panel"><dl><div><dt>Education</dt><dd>4th-year BSIT, Business Analytics<br />Batangas State University, ARASOF Nasugbu</dd></div><div><dt>Location</dt><dd>Nasugbu, Batangas, Philippines</dd></div><div><dt>Workflow</dt><dd>Solo, end-to-end, AI-assisted</dd></div></dl></div>;
}

function SkillGroup({ label, items }: { label: string; items: SkillItem[] }) {
  return <div className="skill-group"><h3>{label}</h3><div className="pill-list">{items.map((item) => {
    const style = item.brand
      ? ({ '--brand': item.brand, ...(item.brandDark ? { '--brand-dark': item.brandDark } : {}) } as CSSProperties)
      : undefined;
    return <span className={item.brand ? 'skill-pill' : 'skill-pill no-brand'} key={item.name} style={style}><SkillIcon name={item.name} />{item.name}</span>;
  })}</div></div>;
}

function ProjectCard({ project, inspectProject }: { project: Project; inspectProject: (project: Project) => void }) {
  const longTitle = project.title.length > 24;
  return <article className={`project-card project-${project.status.toLowerCase().replace(' ', '-')}`} id={project.id}><div className="project-card-content"><div className="project-number" aria-hidden="true">{project.number}</div><div className="project-main"><div className="project-topline"><StatusBadge status={project.status} /><span className="project-repo">Repo coming soon</span></div><h3 className={longTitle ? 'project-title-long' : undefined}>{project.title}</h3>{project.subtitle && <p className="project-subtitle">{project.subtitle}</p>}{project.impact && <div className="project-impact"><span>Impact</span><p>{project.impact}</p></div>}{project.stack.length > 0 && <div className="stack-row" aria-label={`${project.title} technology stack`}>{project.stack.map((item) => <span key={item}>{item}</span>)}</div>}</div><div className="project-controls"><button className="project-jump" onClick={() => inspectProject(project)} aria-label={`Inspect ${project.title}`}>Inspect <ArrowUpRight /></button></div>{project.details.length > 0 && <div className="project-details"><div className="details-label">CASE FILE / BUILD NOTES</div><ul>{project.details.map((detail) => <li key={detail}>{detail}</li>)}</ul></div>}</div></article>;
}

// Placeholder deck card for the 0-result filter. Same markup, size and
// classes as a real card (so the deck query and layout stay stable), but
// inert: no project number, no case file, not counted anywhere.
function EmptyDeckCard({ resetFilter }: { resetFilter: () => void }) {
  const pressRef = useRef(false);
  return <article className="project-card project-card-empty" aria-label="No projects match this filter"><div className="project-card-content"><div className="project-number" aria-hidden="true" /><div className="project-main"><div className="project-topline"><span className="project-repo">NO RESULTS</span></div><h3>Nothing here yet</h3><p className="project-subtitle">No projects match this filter right now. Check back soon.</p></div><div className="project-controls"><button className="details-button" onPointerDown={(event) => { if (event.pointerType === 'mouse') { pressRef.current = true; resetFilter(); } }} onClick={() => { if (pressRef.current) pressRef.current = false; else resetFilter(); }}>Show all projects <ArrowUpRight /></button></div></div></article>;
}

// Timeline reads oldest → newest, left to right. Sorted here by the explicit
// `date` field — never a blind reversal — and only for this section. The
// pinned project deck and every other consumer keep their own order.
const timelineOrdered = [...timeline].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

function TimelineSection({ scrollToSection, sectionRef, viewportRef, trackRef }: { scrollToSection: (id: string, label: string) => void; sectionRef: RefObject<HTMLElement | null>; viewportRef: RefObject<HTMLDivElement | null>; trackRef: RefObject<HTMLDivElement | null> }) {
  return <section ref={sectionRef} className="timeline-section" id="experience" aria-labelledby="experience-title"><div className="container"><div className="section-heading-row"><h2 id="experience-title">Timeline</h2><div className="heading-side"><SectionLabel>Experience</SectionLabel><p className="section-subheading timeline-hint">Scroll horizontally <span aria-hidden="true">→</span></p></div></div><div className="timeline-badges"><span>Education</span><span>Freelance</span></div><div className="timeline-viewport" ref={viewportRef} dir="ltr"><div className="timeline-track" ref={trackRef}><div className="timeline-progress" aria-hidden="true" /><div className="timeline-start" aria-hidden="true" />{timelineOrdered.map((entry, index) => <article className="timeline-entry" data-state={index === 0 ? 'current' : 'upcoming'} key={`${entry.date}-${entry.title}`}><div className="timeline-year">{entry.year}</div><div className="timeline-entry-body"><span className={`timeline-badge badge-${entry.badge.toLowerCase()}`}>{entry.badge}</span><h3>{entry.title}</h3><p className="timeline-role">{entry.role} <span>·</span> {entry.organization}</p><p>{entry.description}</p></div></article>)}<div className="timeline-end" aria-hidden="true"><span className="timeline-end-square" /><span className="timeline-end-label">NOW</span></div></div></div><div className="timeline-footer"><button className="timeline-cta" onClick={() => scrollToSection('contact', 'Contact')}>Start a conversation <ArrowUpRight /></button><span className="timeline-counter" data-timeline-counter aria-hidden="true">01 / {String(timelineOrdered.length).padStart(2, '0')}</span></div></div></section>;
}

function CertificationsSection() {
  const [activeCert, setActiveCert] = useState<{ issuer: string; label: string; image: string; issued?: string } | null>(null);

  useEffect(() => {
    if (!activeCert) return undefined;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setActiveCert(null); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, [activeCert]);

  return <><section className="ink-section certifications-section" id="certifications" aria-labelledby="certifications-title"><div className="container"><div className="section-heading-row"><h2 id="certifications-title">Industry<br /><em>credentials</em></h2></div><div className="certification-grid">{certifications.map((certification) => <article className="certification-card" key={certification.issuer}><h3>{certification.issuer}</h3><ul>{certification.items.map((item) => <li key={item.label}><button type="button" className="cert-item-button" onClick={() => setActiveCert({ issuer: certification.issuer, label: item.label, image: item.image, issued: item.issued })} aria-haspopup="dialog"><span aria-hidden="true">↳</span>{item.label}</button></li>)}</ul><div className="certification-seal" aria-hidden="true">VERIFIED<br />FIELD<br />SIGNAL</div></article>)}</div></div></section>
  {activeCert && <CertModal cert={activeCert} close={() => setActiveCert(null)} />}</>;
}

function CertModal({ cert, close }: { cert: { issuer: string; label: string; image: string; issued?: string }; close: () => void }) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  return <div className="inspection-backdrop cert-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }} onWheel={(event) => event.stopPropagation()}><section className="inspection-dialog cert-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}><div className="inspection-chrome"><span className="palette-lights" aria-hidden="true"><i /><i /><i /></span><span>CREDENTIAL / {cert.issuer}</span><button ref={closeButtonRef} className="inspection-close" onClick={close} aria-label="Close certificate dialog">×</button></div><div className="inspection-content cert-content"><h2 id={titleId}>{cert.label}</h2>{cert.issued && <div className="inspection-meta"><span>Issued</span><p>{cert.issued}</p></div>}{failed ? <p className="cert-placeholder">Certificate preview unavailable.</p> : <img className="cert-image no-copy-img" src={cert.image} alt={`${cert.label} certificate`} draggable={false} onError={() => setFailed(true)} />}<button className="inspection-action" onClick={close}>Close credential <span aria-hidden="true">↗</span></button></div></section></div>;
}

function InspectionModal({ project, close }: { project: Project; close: () => void }) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // preventScroll: focusing must never move the page under a pinned deck.
    closeButtonRef.current?.focus({ preventScroll: true });
    // Layout-neutral lock: html already reserves the scrollbar gutter
    // (scrollbar-gutter: stable), so hiding overflow shifts neither content
    // nor scroll position. Cleanup is the single restore funnel for every
    // close path, including unmount. No refresh() here: remeasuring while
    // locked would bake wrong pin geometry; one update() re-syncs state.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
      ScrollTrigger.update();
    };
  }, []);

  return <div className="inspection-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }} onWheel={(event) => event.stopPropagation()}><section className="inspection-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}><div className="inspection-chrome"><span className="palette-lights" aria-hidden="true"><i /><i /><i /></span><span>CASE FILE / {project.number}</span><button ref={closeButtonRef} className="inspection-close" onClick={close} aria-label="Close inspection dialog">×</button></div><div className="inspection-content"><StatusBadge status={project.status} /><h2 id={titleId}>{project.title}</h2>{project.subtitle && <p className="inspection-subtitle">{project.subtitle}</p>}{project.impact && <div className="inspection-meta"><span>Impact</span><p>{project.impact}</p></div>}{project.stack.length > 0 && <div className="inspection-meta"><span>Stack</span><p>{project.stack.join(' / ')}</p></div>}{project.details.length > 0 && <ul className="inspection-details">{project.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>}<button className="inspection-action" onClick={close}>Close case file <span aria-hidden="true">↗</span></button></div></section></div>;
}

function CommandPalette({ inputRef, query, setQuery, selectedCommand, setSelectedCommand, commands, onKeyDown, close }: { inputRef: React.RefObject<HTMLInputElement | null>; query: string; setQuery: (value: string) => void; selectedCommand: number; setSelectedCommand: (value: number) => void; commands: PaletteCommand[]; onKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void; close: () => void }) {
  const labelId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const [fadeTop, setFadeTop] = useState(false);
  const [fadeBottom, setFadeBottom] = useState(false);

  // STEP 2: edge fades appear only when more content exists in that direction.
  const updateFades = () => {
    const el = listRef.current;
    if (!el) return;
    const canScroll = el.scrollHeight - el.clientHeight > 2;
    setFadeTop(canScroll && el.scrollTop > 2);
    setFadeBottom(canScroll && el.scrollTop + el.clientHeight < el.scrollHeight - 2);
  };

  useEffect(() => {
    updateFades();
  }, [commands.length, query]);

  // STEP 2: keyboard nav keeps the active row visible (nearest = no page jump).
  useEffect(() => {
    listRef.current
      ?.querySelectorAll('.command-row')[selectedCommand]
      ?.scrollIntoView({ block: 'nearest' });
  }, [selectedCommand, commands.length]);

  return <div className="palette-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><section className="command-palette" role="dialog" aria-modal="true" aria-labelledby={labelId}><div className="palette-chrome"><span className="palette-lights" aria-hidden="true"><i /><i /><i /></span><span id={labelId}>JEDV COMMAND PALETTE</span><button className="palette-close" onClick={close} aria-label="Close command palette">Esc</button></div><div className="palette-input-row"><span aria-hidden="true" className="palette-prompt">›</span><input ref={inputRef} value={query} onChange={(event) => { setQuery(event.target.value); setSelectedCommand(0); }} onKeyDown={onKeyDown} placeholder="Type a command or search…" aria-label="Search commands" role="combobox" aria-controls="command-list" aria-autocomplete="list" aria-expanded="true" /><kbd>ESC</kbd></div><div ref={listRef} onScroll={updateFades} className={`command-list${fadeTop ? ' can-fade-top' : ''}${fadeBottom ? ' can-fade-bottom' : ''}`} id="command-list" role="listbox" aria-label="Commands">{commands.length === 0 ? <p className="empty-command">No matching command. Try a section, project, or action.</p> : commands.map((command, index) => <button className={`command-row ${selectedCommand === index ? 'is-selected' : ''}`} key={command.id} role="option" aria-selected={selectedCommand === index} onMouseEnter={() => setSelectedCommand(index)} onClick={command.action}><span className="command-icon" aria-hidden="true">{command.group === 'Projects' ? '▣' : command.group === 'Actions' ? '↯' : '→'}</span><span className="command-label"><strong>{command.label}</strong><small>{command.group}</small></span><span className="command-hint">{command.hint}</span></button>)}</div><div className="palette-footer"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> select</span><span><kbd>esc</kbd> close</span></div></section></div>;
}

export default App;
