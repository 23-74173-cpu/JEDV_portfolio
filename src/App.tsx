import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode, RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { certifications, email, projects, skillGroups, technologies, timeline, type Project, type ProjectStatus } from './data';
import { resumeText } from './resume';
// import SpinWheelSection from './SpinWheel'; // temporarily disabled — uncomment to re-enable wheel
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
  SiFigma,
  SiOpenjdk,
  SiPhp,
  SiExpo,
  SiCplusplus,
  SiSharp,
} from 'react-icons/si';
import { FaWindows } from 'react-icons/fa';
import { VscSymbolMethod, VscServerProcess } from 'react-icons/vsc';
import { TbChartBar, TbLock, TbNetwork } from 'react-icons/tb';
import { MdOutlineTableChart, MdOutlineSecurity } from 'react-icons/md';
import { FiDatabase, FiTerminal, FiBox, FiCpu } from 'react-icons/fi';

gsap.registerPlugin(ScrollTrigger);

type Theme = 'dark' | 'light';
type HeaderTone = 'dark' | 'light';
type Toast = { id: number; message: string };
type PaletteCommand = { id: string; label: string; group: string; hint?: string; action: () => void };

const navItems = [
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'certifications', label: 'Certifications' },
  // { id: 'spin', label: 'Spin the Wheel' }, // temporarily disabled
  { id: 'contact', label: 'Contact' },
];

const filters: Array<'All' | ProjectStatus> = ['All', 'Shipped', 'In Progress', 'Active'];
const LIGHT_HEADER_SECTIONS = new Set(['about', 'experience', 'contact']);

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
  return <svg className="figma-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#f24e1e" d="M7 2h5v6H7a3 3 0 1 1 0-6Z" /><path fill="#ff7262" d="M12 2h3a3 3 0 1 1 0 6h-3V2Z" /><path fill="#a259ff" d="M7 8h5v6H7a3 3 0 1 1 0-6Z" /><path fill="#1abcfe" d="M12 8h3a3 3 0 1 1 0 6h-3V8Z" /><path fill="#0acf83" d="M7 14h5v3a3 3 0 1 1-5-3Z" /></svg>;
}

function SkillIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  // helper to wrap icon with consistent size/color
  const wrap = (icon: ReactNode) => <span className="skill-icon" aria-hidden="true">{icon}</span>;
  if (n.includes('javascript') && !n.includes('typescript')) return wrap(<SiJavascript color="#F7DF1E" />);
  if (n.includes('typescript')) return wrap(<SiTypescript color="#3178C6" />);
  if (n === 'java' || n.includes('java swing')) return wrap(<SiOpenjdk color="#5382A1" />);
  if (n === 'c#' || n.includes('c#')) return wrap(<SiSharp color="#239120" />);
  if (n.includes('c++')) return wrap(<SiCplusplus color="#00599C" />);
  if (n.includes('python')) return wrap(<SiPython color="#3776AB" />);
  if (n === 'php') return wrap(<SiPhp color="#777BB4" />);
  if (n.includes('html')) return wrap(<SiHtml5 color="#E34F26" />);
  if (n.includes('css') && n.includes('tailwind')) return wrap(<SiTailwindcss color="#06B6D4" />);
  if (n.includes('css')) return wrap(<SiCss color="#1572B6" />);
  if (n.includes('react native')) return wrap(<SiExpo color="#000020" />);
  if (n.includes('react')) return wrap(<SiReact color="#61DAFB" />);
  if (n.includes('next.js')) return wrap(<SiNextdotjs color="currentColor" />);
  if (n.includes('node')) return wrap(<SiNodedotjs color="#339933" />);
  if (n.includes('laravel')) return wrap(<SiLaravel color="#FF2D20" />);
  if (n.includes('codeigniter')) return wrap(<SiCodeigniter color="#EF4223" />);
  if (n.includes('jwt')) return wrap(<SiJsonwebtokens color="#000000" />);
  if (n.includes('bcrypt')) return wrap(<TbLock color="#FF6B3D" />);
  if (n === 'mysql') return wrap(<SiMysql color="#4479A1" />);
  if (n.includes('mariadb')) return wrap(<SiMariadb color="#003545" />);
  if (n.includes('sqlite')) return wrap(<SiSqlite color="#003B57" />);
  if (n.includes('aes') || n.includes('encryption')) return wrap(<MdOutlineSecurity color="#60D7E4" />);
  if (n.includes('docker')) return wrap(<SiDocker color="#2496ED" />);
  if (n === 'git / github') return wrap(<span style={{display:'inline-flex',gap:'2px'}}><SiGit color="#F05032" /><SiGithub color="currentColor" /></span>);
  if (n.includes('github')) return wrap(<SiGithub color="currentColor" />);
  if (n.includes('git')) return wrap(<SiGit color="#F05032" />);
  if (n.includes('railway')) return wrap(<SiRailway color="currentColor" />);
  if (n.includes('vercel')) return wrap(<SiVercel color="currentColor" />);
  if (n.includes('linux')) return wrap(<SiLinux color="#FCC624" />);
  if (n.includes('windows')) return wrap(<FaWindows color="#00A4EF" />);
  if (n.includes('figma')) return wrap(<SiFigma color="#F24E1E" />);
  if (n.includes('power bi')) return wrap(<TbChartBar color="#F2C811" />);
  if (n.includes('tableau')) return wrap(<TbChartBar color="#E97627" />);
  if (n.includes('docker')) return wrap(<SiDocker color="#2496ED" />);
  if (n.includes('xampp') || n.includes('lampp')) return wrap(<VscServerProcess color="#FB7A24" />);
  if (n.includes('network')) return wrap(<TbNetwork color="#60D7E4" />);
  if (n.includes('data model')) return wrap(<FiDatabase color="#1a7f37" />);
  if (n.includes('forecast') || n.includes('sarima') || n.includes('xgboost')) return wrap(<TbChartBar color="#60D7E4" />);
  if (n.includes('claude')) return wrap(<FiTerminal color="#D97706" />);
  if (n.includes('opencode')) return wrap(<FiBox color="#7C3AED" />);
  if (n.includes('cursor')) return wrap(<FiCpu color="#0EA5E9" />);
  if (n.includes('hostinger')) return wrap(<SiRailway color="#673DE6" />); // fallback purple
  // generic fallback — first letter in a tiny badge
  return wrap(<span style={{width:'100%',height:'100%',display:'grid',placeItems:'center',background:'color-mix(in srgb, var(--paper) 8%, transparent)',border:'1px solid color-mix(in srgb, var(--paper) 14%, transparent)',fontSize:'0.62em',fontWeight:800,lineHeight:1}}>{name.trim()[0]?.toUpperCase()}</span>);
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="section-label"><span className="label-dot" aria-hidden="true" />{children}</p>;
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  return <span className={`status-badge status-${status.toLowerCase().replace(' ', '-')}`}><span className="status-dot" aria-hidden="true" />{status}</span>;
}

function App() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('jedv-theme') as Theme | null) ?? 'dark');
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [selectedCommand, setSelectedCommand] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [filter, setFilter] = useState<'All' | ProjectStatus>('All');
  const [expandedProjects, setExpandedProjects] = useState<string[]>(['hilom-ehr']);
  const [marqueePaused, setMarqueePaused] = useState(false);
  const [resumeState, setResumeState] = useState<'idle' | 'preparing' | 'saved'>('idle');
  const [hasOpenedPalette, setHasOpenedPalette] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [booting, setBooting] = useState(true);
  const [typedRole, setTypedRole] = useState('');
  const [inspectionProject, setInspectionProject] = useState<Project | null>(null);
  const paletteInputRef = useRef<HTMLInputElement>(null);
  const projectsSectionRef = useRef<HTMLElement>(null);
  const projectsFrameRef = useRef<HTMLDivElement>(null);
  const projectsStageRef = useRef<HTMLDivElement>(null);
  const projectListRef = useRef<HTMLDivElement>(null);
  const timelineSectionRef = useRef<HTMLElement>(null);
  const timelineViewportRef = useRef<HTMLDivElement>(null);
  const timelineTrackRef = useRef<HTMLDivElement>(null);
  const toastId = useRef(0);
  const visibleProjects = projects.filter((project) => filter === 'All' || project.status === filter);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const projectsProgressRef = useRef(0);

  const notify = (message: string) => {
    const id = toastId.current + 1;
    toastId.current = id;
    setToasts((current) => [...current, { id, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3200);
  };

  const scrollToSection = (id: string, label: string, shouldNotify = true) => {
    const el = document.getElementById(id);
    if (el) {
      // Immediate jump — no GSAP scrub / smooth delay
      const headerOffset = 74;
      const top = el.getBoundingClientRect().top + window.scrollY - headerOffset + 1;
      window.scrollTo({ top, behavior: 'auto' });
      // Force ScrollTrigger to sync immediately instead of scrubbing
      ScrollTrigger.refresh();
      // Nudge GSAP ticker to update pins without easing lag
      gsap.delayedCall(0.02, () => ScrollTrigger.update());
    }
    setMobileNavOpen(false);
    setPaletteOpen(false);
    if (shouldNotify) notify(`Moved to ${label}`);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('jedv-theme', nextTheme);
    notify('Theme switched');
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
    const blob = new Blob([resumeText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'john-eduard-de-villa-resume.txt';
    link.click();
    URL.revokeObjectURL(url);
    window.setTimeout(() => setResumeState('saved'), 700);
    window.setTimeout(() => setResumeState('idle'), 3200);
  };

  const toggleProject = (id: string) => {
    setExpandedProjects((current) => current.includes(id) ? current.filter((projectId) => projectId !== id) : [...current, id]);
  };

  const openProject = (project: Project) => {
    setExpandedProjects((current) => current.includes(project.id) ? current : [...current, project.id]);
    scrollToSection('projects', 'Projects', false);
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

  const handleNextCard = () => {
    const n = visibleProjects.length;
    if (n <= 1) return;
    const st = ScrollTrigger.getById('projects-reveal') as unknown as { progress: number; start: number; end: number } | null;
    if (st && typeof st.start === 'number' && typeof st.end === 'number') {
      const progress = st.progress;
      const currentIdx = Math.round(progress * (n - 1));
      const nextIdx = Math.min(currentIdx + 1, n - 1);
      if (nextIdx === currentIdx && progress >= 0.99) return;
      const targetProgress = nextIdx / (n - 1);
      const targetScroll = st.start + targetProgress * (st.end - st.start);
      window.scrollTo({ top: targetScroll, behavior: 'auto' });
      notify(`Card ${nextIdx + 1} of ${n}`);
    } else {
      // Fallback for mobile / no pin (stacked cards) — find currently centered card via DOM
      const cards = visibleProjects.map((p) => document.getElementById(p.id)).filter(Boolean) as HTMLElement[];
      let currentIdx = currentProjectIndex;
      // Try to detect which card is most in view
      let bestIdx = -1;
      let bestDist = Infinity;
      const viewportCenter = window.innerHeight * 0.5;
      for (let i = 0; i < cards.length; i++) {
        const rect = cards[i].getBoundingClientRect();
        const dist = Math.abs(rect.top + rect.height / 2 - viewportCenter);
        if (rect.top < window.innerHeight && rect.bottom > 0 && dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }
      if (bestIdx !== -1) currentIdx = bestIdx;
      const nextIdx = Math.min(currentIdx + 1, n - 1);
      if (nextIdx === currentIdx && currentIdx >= n - 1) return;
      const nextId = visibleProjects[nextIdx]?.id;
      if (nextId) {
        document.getElementById(nextId)?.scrollIntoView({ behavior: 'auto', block: 'center' });
        setCurrentProjectIndex(nextIdx);
        notify(`Card ${nextIdx + 1} of ${n}`);
      }
    }
  };

  useEffect(() => {
    setCurrentProjectIndex(0);
    projectsProgressRef.current = 0;
  }, [filter, visibleProjects.length]);

  // Keep currentProjectIndex in sync on mobile / non-pinned (stacked) layout
  useEffect(() => {
    const st = ScrollTrigger.getById('projects-reveal');
    if (st) return;
    const cards = visibleProjects.map((p) => document.getElementById(p.id)).filter(Boolean) as HTMLElement[];
    if (!cards.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        let bestIdx = -1;
        let bestRatio = 0;
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            const idx = cards.indexOf(entry.target as HTMLElement);
            if (idx !== -1) {
              bestRatio = entry.intersectionRatio;
              bestIdx = idx;
            }
          }
        }
        if (bestIdx !== -1 && bestIdx !== projectsProgressRef.current) {
          projectsProgressRef.current = bestIdx;
          setCurrentProjectIndex(bestIdx);
        }
      },
      { rootMargin: '-35% 0px -35% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, [visibleProjects, filter]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(mediaQuery.matches);
    updateMotion();
    mediaQuery.addEventListener('change', updateMotion);
    return () => mediaQuery.removeEventListener('change', updateMotion);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => setBooting(false), reducedMotion ? 700 : 1250);
    return () => window.clearTimeout(timeout);
  }, [reducedMotion]);

  // Hero intro — runs once right after boot screen lifts, no delay
  useEffect(() => {
    if (booting) return;
    if (reducedMotion) {
      gsap.set(['.hero-kicker', '.hero-index', '#hero-title', '.hero-role', '.hero-intro', '.hero-actions .button', '.hero-readout', '.hero-footer'], { clearProps: 'all' });
      return;
    }
    const ctx = gsap.context(() => {
      // ensure starting state is hidden (in case CSS left it visible)
      gsap.set(['.hero-kicker', '.hero-index', '#hero-title', '.hero-role', '.hero-intro', '.hero-actions .button', '.hero-readout', '.hero-footer'], { autoAlpha: 1 });
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.hero-kicker', { y: 14, autoAlpha: 0, duration: 0.45 }, 0)
        .from('.hero-index', { y: 14, autoAlpha: 0, duration: 0.45 }, 0.07)
        .from('#hero-title', { y: 32, autoAlpha: 0, duration: 0.7 }, 0.1)
        .from('.hero-role', { y: 12, autoAlpha: 0, duration: 0.45 }, 0.28)
        .from('.hero-intro', { y: 14, autoAlpha: 0, duration: 0.5 }, 0.34)
        .from('.hero-actions .button', { y: 12, autoAlpha: 0, duration: 0.4, stagger: 0.07 }, 0.42)
        .from('.hero-readout', { y: 22, autoAlpha: 0, scale: 0.97, duration: 0.6 }, 0.22)
        .from('.hero-footer', { autoAlpha: 0, duration: 0.35 }, 0.55);
    });
    return () => ctx.revert();
  }, [booting, reducedMotion]);

  useEffect(() => {
    const role = 'Full-stack Developer';
    if (reducedMotion) {
      setTypedRole(role);
      return undefined;
    }
    setTypedRole('');
    let index = 0;
    const interval = window.setInterval(() => {
      index += 1;
      setTypedRole(role.slice(0, index));
      if (index === role.length) window.clearInterval(interval);
    }, 68);
    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  useEffect(() => {
    const updateActiveSection = () => {
      const headerLine = 74;
      const currentSection = navItems.map((item) => document.getElementById(item.id)).find((section) => {
        if (!section) return false;
        const rect = section.getBoundingClientRect();
        return rect.top <= headerLine && rect.bottom > headerLine;
      });
      setActiveSection(currentSection?.id ?? 'hero');
    };
    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    return () => window.removeEventListener('scroll', updateActiveSection);
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
        setInspectionProject(null);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    if (paletteOpen) {
      setPaletteQuery('');
      setSelectedCommand(0);
      setHasOpenedPalette(true);
      window.setTimeout(() => paletteInputRef.current?.focus(), 40);
    }
  }, [paletteOpen]);

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
    return () => window.cancelAnimationFrame(resetFrame);
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
          gsap.set(projectCards, { autoAlpha: 1, x: 0, y: 0, scale: 0.94, rotation: 0, zIndex: 0 });
          gsap.set(projectCardContents, { autoAlpha: 0 });
          gsap.set(projectCards[0], { scale: 1, zIndex: 30 });
          gsap.set(projectCardContents[0], { autoAlpha: 1 });
          if (projectCards[1]) gsap.set(projectCards[1], { scale: 0.965, y: 12, zIndex: 20 });
          if (projectCards[2]) gsap.set(projectCards[2], { scale: 0.935, y: 24, zIndex: 10 });
          const projectTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: projectsFrame,
              start: 'top top',
              end: () => `+=${getProjectDistance()}`,
              pin: true,
              pinSpacing: true,
              scrub: 0.35,
              snap: {
                snapTo: 1 / Math.max(projectCards.length - 1, 1),
                duration: { min: 0.12, max: 0.2 },
                delay: 0,
                ease: 'power2.out',
              },
              onUpdate: (self) => {
                const idx = Math.round(self.progress * Math.max(projectCards.length - 1, 1));
                if (projectsProgressRef.current !== idx) {
                  projectsProgressRef.current = idx;
                  setCurrentProjectIndex(idx);
                }
              },
              invalidateOnRefresh: true,
              anticipatePin: 1,
              refreshPriority: 2,
              id: 'projects-reveal',
            },
          });
          projectCards.slice(1).forEach((card, index) => {
            const position = 0.35 + index * 1.55;
            const currentContent = projectCardContents[index];
            const nextContent = projectCardContents[index + 1];
            projectTimeline
              .to(currentContent, { autoAlpha: 0, duration: 0.45, ease: 'power2.inOut' }, position)
              .to(projectCards[index], { x: -34, y: -16, scale: 0.93, rotation: -2.5, duration: 0.55, ease: 'power2.inOut' }, position)
              .to(card, { x: 0, y: 0, scale: 1, rotation: 0, zIndex: 30, duration: 0.55, ease: 'power2.inOut' }, position + 0.55)
              .to(nextContent, { autoAlpha: 1, duration: 0.45, ease: 'power2.inOut' }, position + 1.1)
              .set(projectCards[index], { zIndex: 0 }, position + 1.1);
            if (projectCards[index + 2]) {
              projectTimeline.set(projectCards[index + 2], { scale: 0.965, y: 12, rotation: 0, zIndex: 20 }, position + 1.1);
            }
            if (projectCards[index + 3]) {
              projectTimeline.set(projectCards[index + 3], { scale: 0.935, y: 24, rotation: 0, zIndex: 10 }, position + 1.1);
            }
          });
          ScrollTrigger.refresh();
        }

        timelineViewport.scrollLeft = 0;
        gsap.set(timelineTrack, { x: 0 });
        const getTimelineDistance = () => Math.max(timelineTrack.scrollWidth - timelineViewport.clientWidth, 0);
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
              invalidateOnRefresh: true,
              anticipatePin: 1,
              refreshPriority: 1,
              id: 'timeline-horizontal',
            },
          });
        }

        const refresh = () => ScrollTrigger.refresh();
        window.addEventListener('resize', refresh);
        ScrollTrigger.refresh();
        const refreshFrame = window.requestAnimationFrame(refresh);
        return () => {
          window.removeEventListener('resize', refresh);
          window.cancelAnimationFrame(refreshFrame);
        };
      });
      matchMedia.add('(prefers-reduced-motion: no-preference)', () => {
        const revealTargets = gsap.utils.toArray<HTMLElement>('.section-scroll-reveal');
        if (!revealTargets.length) return undefined;
        gsap.set(revealTargets, { autoAlpha: 0, y: 20 });
        ScrollTrigger.batch(revealTargets, {
          start: 'top 88%',
          onEnter: (elements) => gsap.to(elements, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.08, ease: 'power2.out', overwrite: 'auto' }),
          onEnterBack: (elements) => gsap.to(elements, { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out', overwrite: 'auto' }),
        });
      });
      ScrollTrigger.refresh();
    });

    return () => {
      matchMedia.revert();
      context.revert();
      timelineViewport.scrollLeft = 0;
      gsap.set(timelineTrack, { clearProps: 'transform' });
    };
  }, [filter]);

  const commands: PaletteCommand[] = [
    ...navItems.map((item) => ({ id: `jump-${item.id}`, label: item.label, group: 'Jump to', hint: `/${item.id}`, action: () => scrollToSection(item.id, item.label) })),
    { id: 'jump-skills', label: 'Skills', group: 'Jump to', hint: '/skills', action: () => scrollToSection('skills', 'Skills') },
    { id: 'theme', label: `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`, group: 'Actions', hint: 'theme', action: toggleTheme },
    { id: 'copy-email', label: 'Copy email address', group: 'Actions', hint: 'copy', action: copyEmail },
    { id: 'download-resume', label: 'Download résumé', group: 'Actions', hint: 'save', action: downloadResume },
    ...projects.map((project) => ({ id: `project-${project.id}`, label: project.title, group: 'Projects', hint: project.status, action: () => openProject(project) })),
  ];

  const matchingCommands = commands.filter((command) => `${command.label} ${command.group} ${command.hint ?? ''}`.toLowerCase().includes(paletteQuery.toLowerCase()));
  const headerTone: HeaderTone = LIGHT_HEADER_SECTIONS.has(activeSection) ? 'light' : 'dark';

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
      {booting && <BootScreen />}
      <Header tone={headerTone} activeSection={activeSection} mobileNavOpen={mobileNavOpen} setMobileNavOpen={setMobileNavOpen} openPalette={() => setPaletteOpen(true)} scrollToSection={scrollToSection} />

      <main>
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-grid" aria-hidden="true" />
          <div className="container hero-content">
            <div className="hero-copy reveal-on-load">
              <div className="hero-kicker"><span className="live-signal" />Available for new systems <span className="kicker-rule" /> 09.2026</div>
              <p className="hero-index">7 / SYSTEMS SHIPPED <span>·</span> 5 / CLIENTS SERVED</p>
              <h1 id="hero-title">John Eduard<br /><em>De Villa</em></h1>
              <div className="hero-role"><span className="typewriter" aria-label="Full-stack Developer"><span aria-hidden="true">{typedRole}</span><span className="type-caret" aria-hidden="true" /></span><span className="hero-location">Nasugbu, Batangas, Philippines</span></div>
              <p className="hero-intro">7 systems shipped for 5 clients — HILOM EHR now encrypts 28 tables with AES-256-GCM for a live medical center. From auth workflows to offline poultry sensors, I own the stack solo, end-to-end, while finishing my BSIT.</p>
              <div className="hero-actions">
                <button className="button button-primary" onClick={() => scrollToSection('projects', 'Projects')}>See production work <ArrowUpRight /></button>
                <button className={`button button-console ${!hasOpenedPalette ? 'palette-hint' : ''}`} onClick={() => setPaletteOpen(true)}><span className="button-prompt">$</span> Open command palette <kbd>⌘K</kbd></button>
              </div>
            </div>
            <HeroReadout />
          </div>
          <div className="hero-footer container" aria-hidden="true"><span>01 / INTRODUCTION</span><span>SCROLL TO INSPECT <span className="scroll-cue">↓</span></span></div>
        </section>

        <TechMarquee paused={marqueePaused} setPaused={setMarqueePaused} />

        <section className="paper-section about-section" id="about" aria-labelledby="about-title">
          <div className="container">
            <div className="section-heading-row">
              <div><h2 id="about-title">What I do &amp;<br /><em>how I work</em></h2></div>
              <div className="heading-side">
                <SectionLabel>About &amp; Stack</SectionLabel>
                <p className="section-subheading">I build for clients, not grades</p>
              </div>
            </div>
            <div className="about-layout">
              <div className="about-statement"><p>I build real, deployed systems for actual clients, not just class exercises. From EHR schema design to IoT sensor pipelines, I work solo, end-to-end, delivering production software while finishing my degree.</p><span className="margin-note">FIELD NOTE 001</span></div>
              <div className="about-approach"><div className="mini-heading">Approach / 02 — solo, end-to-end</div><p>I scope, schema-design, build, and ship myself. To move fast without cutting corners I run an AI-assisted loop — <strong>Opencode</strong> for codebase analysis, <strong>Claude Code</strong> for implementation, <strong>Cursor</strong> for review — then verify manually. Same hands wire the hardware: Linux Hyprland/Omarchy, Raspberry Pi 5 + Arduino (DHT22, IR break-beam) for the farm.</p></div>
              <StatusPanel />
            </div>
          </div>
        </section>

        <section className="paper-section stack-section" id="skills" aria-labelledby="skills-title">
          <div className="container">
            <div className="section-heading-row">
              <div><h2 id="skills-title">Stack<br /><em>inventory</em></h2></div>
              <div className="heading-side">
                <p className="section-label"><span className="label-dot" aria-hidden="true" />08 groups</p>
                <p className="section-subheading">Tools in the field</p>
              </div>
            </div>
            <div className="skills-grid">{skillGroups.map((group) => <SkillGroup key={group.label} label={group.label} items={group.items} />)}</div>
          </div>
        </section>

        <GitHubActivity />

        <section ref={projectsSectionRef} className="ink-section projects-section" id="projects" aria-labelledby="projects-title">
            <div ref={projectsFrameRef} className="container projects-pin-frame">
              <div className="projects-intro">
              <div className="section-heading-row projects-heading"><div><h2 id="projects-title">Production systems<br /><em>I’ve built</em></h2></div><div className="heading-side"><SectionLabel>Featured Projects</SectionLabel><p className="section-subheading">Evidence over adjectives.<br />Open a case file.</p></div></div>
              <div className="filter-bar" role="tablist" aria-label="Filter projects by status">{filters.map((option) => <button key={option} className={`filter-button ${filter === option ? 'is-selected' : ''}`} role="tab" aria-selected={filter === option} onClick={() => setFilter(option)}><span className="filter-count">{option === 'All' ? projects.length : projects.filter((project) => project.status === option).length}</span>{option}</button>)}</div>
              </div><div className="projects-scroll-stage" ref={projectsStageRef}><div className="project-list project-deck" ref={projectListRef}>{visibleProjects.map((project) => <ProjectCard key={project.id} project={project} expanded={expandedProjects.includes(project.id)} toggleProject={toggleProject} inspectProject={openInspection} />)}</div></div>
</div>
        </section>

        <TimelineSection scrollToSection={scrollToSection} sectionRef={timelineSectionRef} viewportRef={timelineViewportRef} trackRef={timelineTrackRef} />
        <CertificationsSection />
        {/* <SpinWheelSection /> — temporarily disabled */}

        <section className="contact-section" id="contact" aria-labelledby="contact-title">
          <div className="container contact-layout"><div><SectionLabel>Contact</SectionLabel><h2 id="contact-title">Let’s talk about<br /><em>your system</em></h2></div><div className="contact-copy section-scroll-reveal"><p>I&apos;m available for new projects, freelance work, and collaborations. Email works best. I reply within 24 hours.</p><button className="email-button" onClick={copyEmail} aria-label={`Copy ${email}`}><span className="email-prefix">mailto://</span>{email}<ArrowUpRight /></button><div className="contact-meta"><span>Nasugbu, Batangas, Philippines</span><div className="social-row" aria-label="Social links"><a className="social-link" href="https://github.com/23-74173-cpu" target="_blank" rel="noreferrer"><SocialIcon network="github" />GitHub</a><a className="social-link" href="https://web.facebook.com/joed.devilla/" target="_blank" rel="noreferrer"><SocialIcon network="facebook" />Facebook</a><a className="social-link" href="https://www.linkedin.com/in/john-eduard-de-villa-78689935a/" target="_blank" rel="noreferrer"><SocialIcon network="linkedin" />LinkedIn</a></div></div><button className="resume-button" onClick={downloadResume}>{resumeState === 'preparing' ? 'Preparing…' : resumeState === 'saved' ? '✓ Saved' : 'Download Résumé'}<ArrowUpRight /></button></div></div>
        </section>
      </main>

      <footer className="site-footer"><div className="container footer-content"><span>© 2026 John Eduard De Villa</span><span>Built with React <span className="footer-separator">·</span> Vite <span className="footer-separator">·</span> Tailwind</span><span>JEDV / END OF LOG</span></div></footer>

      <div className="toast-region" aria-live="polite" aria-atomic="true">{toasts.map((toast) => <div className="toast" key={toast.id}><span className="toast-mark">✓</span>{toast.message}</div>)}</div>

      {paletteOpen && <CommandPalette inputRef={paletteInputRef} query={paletteQuery} setQuery={setPaletteQuery} selectedCommand={selectedCommand} setSelectedCommand={setSelectedCommand} commands={matchingCommands} onKeyDown={handlePaletteKeyDown} close={() => setPaletteOpen(false)} />}
      {inspectionProject && <InspectionModal project={inspectionProject} close={() => setInspectionProject(null)} />}
    </div>
  );
}

function BootScreen() {
  return <div className="boot-screen" role="status" aria-label="Initializing JEDV portfolio"><div className="boot-console"><div className="boot-console-top"><span className="palette-lights" aria-hidden="true"><i /><i /><i /></span><span>JEDV / SYSTEM MAP</span><span>BOOT 01</span></div><div className="boot-mark">JEDV<span>_</span></div><div className="boot-lines"><p><span>&gt;</span> Establishing field connection</p><p><span>&gt;</span> Loading production archive</p><p><span>&gt;</span> Mounting interface</p></div><div className="boot-progress"><span /></div><div className="boot-status"><span>INITIALIZING</span><span>PLEASE WAIT</span></div></div></div>;
}

function Header({ tone, activeSection, mobileNavOpen, setMobileNavOpen, openPalette, scrollToSection }: { tone: HeaderTone; activeSection: string; mobileNavOpen: boolean; setMobileNavOpen: (open: boolean) => void; openPalette: () => void; scrollToSection: (id: string, label: string) => void }) {
  return <header className={`site-header header-${tone}`}><div className="container header-inner"><button className="wordmark" onClick={() => scrollToSection('about', 'About')} aria-label="Go to top">JEDV<span className="wordmark-cursor">_</span></button><nav className="desktop-nav" aria-label="Primary navigation">{navItems.map((item) => <button key={item.id} className={activeSection === item.id ? 'active' : ''} onClick={() => scrollToSection(item.id, item.label)}>{item.label}</button>)}</nav><div className="header-actions"><button className="jump-button" onClick={openPalette}>Jump <kbd>⌘K</kbd></button><button className="mobile-menu-button" aria-expanded={mobileNavOpen} aria-controls="mobile-nav" onClick={() => setMobileNavOpen(!mobileNavOpen)}><span className="sr-only">{mobileNavOpen ? 'Close menu' : 'Open menu'}</span><span className="menu-lines" aria-hidden="true"><i /><i /></span></button></div></div>{mobileNavOpen && <nav id="mobile-nav" className="mobile-nav" aria-label="Mobile navigation">{navItems.map((item) => <button key={item.id} className={activeSection === item.id ? 'active' : ''} onClick={() => scrollToSection(item.id, item.label)}>{item.label}<ArrowUpRight /></button>)}<button onClick={openPalette}>Open command palette <kbd>⌘K</kbd></button></nav>}</header>;
}

function HeroReadout() {
  return <div className="hero-readout" aria-label="System readout"><div className="readout-top"><span>JEDV / SYSTEM MAP</span><span className="readout-status"><span className="live-signal" />ONLINE</span></div><div className="readout-map"><div className="map-line map-line-one" /><div className="map-line map-line-two" /><div className="map-node node-origin"><span>ORIGIN</span><strong>NASUGBU</strong></div><div className="map-node node-stack"><span>STACK</span><strong>FULL / END</strong></div><div className="map-node node-output"><span>OUTPUT</span><strong>SHIPPED</strong></div><div className="map-core"><span>07</span><small>SYSTEMS</small></div></div><div className="readout-bottom"><span>BUILD MODE: SOLO</span><span>LAT 14.0667° N / LONG 120.6318° E</span></div></div>;
}

function TechMarquee({ paused, setPaused }: { paused: boolean; setPaused: (paused: boolean) => void }) {
  return <section className="marquee-section" aria-label="Technology stack"><div className="marquee-header"><span>TOOLS IN THE FIELD</span><button className="marquee-toggle" onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? 'Play strip' : 'Pause strip'} <span aria-hidden="true">{paused ? '▶' : 'Ⅱ'}</span></button></div><div className={`marquee-viewport ${paused ? 'is-paused' : ''}`}><div className="marquee-track">{technologies.map((technology) => <span className="tech-item" key={technology}><span className="tech-mark" aria-hidden="true">+</span>{technology}</span>)}{technologies.map((technology) => <span className="tech-item" key={`${technology}-duplicate`} aria-hidden="true"><span className="tech-mark" aria-hidden="true">+</span>{technology}</span>)}</div></div></section>;
}

function GitHubActivity() {
  return (
    <section className="github-section" aria-labelledby="github-title">
      <div className="container">
        <div className="section-heading-row">
          <div><h2 id="github-title">Commit<br /><em>activity</em></h2></div>
          <div className="heading-side">
            <p className="section-label"><span className="label-dot" aria-hidden="true" />GitHub</p>
            <p className="section-subheading">Daily pushes — live from Git</p>
          </div>
        </div>
        <div className="github-grid-wrap">
          <div className="github-chart-frame">
            <div className="github-chart-header">
              <span className="palette-lights" aria-hidden="true"><i /><i /><i /></span>
              <span>23-74173-cpu / contributions</span>
              <a href="https://github.com/23-74173-cpu" target="_blank" rel="noreferrer">View profile ↗</a>
            </div>
            <a href="https://github.com/23-74173-cpu" target="_blank" rel="noreferrer" className="github-chart-link">
              <img
                src="https://ghchart.rshah.org/23-74173-cpu"
                alt="GitHub contributions chart for 23-74173-cpu"
                loading="lazy"
                className="github-chart-img"
              />
            </a>
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
  return <div className="status-panel"><div className="mini-heading">Current status / 03</div><dl><div><dt>Education</dt><dd>4th-year BSIT, Business Analytics<br />Batangas State University, ARASOF Nasugbu</dd></div><div><dt>Location</dt><dd>Nasugbu, Batangas, Philippines</dd></div><div><dt>Workflow</dt><dd>Solo, end-to-end, AI-assisted</dd></div></dl></div>;
}

function SkillGroup({ label, items }: { label: string; items: string[] }) {
  return <div className="skill-group"><h3>{label}</h3><div className="pill-list">{items.map((item) => <span className="skill-pill" key={item}><SkillIcon name={item} />{item}</span>)}</div></div>;
}

function ProjectCard({ project, expanded, toggleProject, inspectProject }: { project: Project; expanded: boolean; toggleProject: (id: string) => void; inspectProject: (project: Project) => void }) {
  const detailId = `${project.id}-details`;
  const isHilom = project.id === 'hilom-ehr';
  return <article className={`project-card project-${project.status.toLowerCase().replace(' ', '-')}`} id={project.id}><div className="project-card-content"><div className="project-number" aria-hidden="true">{project.number}</div><div className="project-main"><div className="project-topline"><StatusBadge status={project.status} /><span className="project-repo">{isHilom ? <a href="#contact" onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '3px', textDecorationColor: 'var(--orange)' }}>Private repo · Case file on request ↗</a> : project.status === 'Shipped' ? 'Shipped · Private repo' : 'Private repo'}</span></div><h3>{project.title}</h3><p className="project-subtitle">{project.subtitle}</p><div className="project-impact"><span>Impact</span><p>{project.impact}</p></div><div className="stack-row" aria-label={`${project.title} technology stack`}>{project.stack.map((item) => <span key={item}>{item}</span>)}</div></div><div className="project-controls"><button className="details-button" aria-expanded={expanded} aria-controls={detailId} onClick={() => toggleProject(project.id)}>{expanded ? 'Close case file' : 'Read case file'}<span className="plus-icon" aria-hidden="true">{expanded ? '−' : '+'}</span></button><button className="project-jump" onClick={() => inspectProject(project)} aria-label={`Inspect ${project.title}`}>Inspect <ArrowUpRight /></button></div>{expanded && <div className="project-details" id={detailId}><div className="details-label">CASE FILE / BUILD NOTES</div><ul>{project.details.map((detail) => <li key={detail}>{detail}</li>)}</ul></div>}</div></article>;
}

function TimelineSection({ scrollToSection, sectionRef, viewportRef, trackRef }: { scrollToSection: (id: string, label: string) => void; sectionRef: RefObject<HTMLElement | null>; viewportRef: RefObject<HTMLDivElement | null>; trackRef: RefObject<HTMLDivElement | null> }) {
  return <section ref={sectionRef} className="paper-section timeline-section" id="experience" aria-labelledby="experience-title"><div className="container"><div className="section-heading-row"><h2 id="experience-title">Timeline</h2><div className="heading-side"><SectionLabel>Experience</SectionLabel><p className="section-subheading timeline-hint">Scroll horizontally <span aria-hidden="true">→</span></p></div></div><div className="timeline-badges"><span>Education</span><span>Freelance</span></div><div className="timeline-viewport" ref={viewportRef} dir="ltr"><div className="timeline-track" ref={trackRef}>{timeline.map((entry, index) => <article className="timeline-entry" key={`${entry.year}-${entry.title}`}><div className="timeline-marker"><span>{String(index + 1).padStart(2, '0')}</span></div><div className="timeline-year">{entry.year}</div><div className="timeline-entry-body"><span className={`timeline-badge badge-${entry.badge.toLowerCase()}`}>{entry.badge}</span><h3>{entry.title}</h3><p className="timeline-role">{entry.role} <span>·</span> {entry.organization}</p><p>{entry.description}</p></div></article>)}</div></div><button className="timeline-cta" onClick={() => scrollToSection('contact', 'Contact')}>Start a conversation <ArrowUpRight /></button></div></section>;
}

function CertificationsSection() {
  return <section className="ink-section certifications-section" id="certifications" aria-labelledby="certifications-title"><div className="container"><div className="section-heading-row"><h2 id="certifications-title">Industry<br /><em>credentials</em></h2><div className="heading-side"><SectionLabel>Certifications</SectionLabel><p className="section-subheading">Signals of curiosity,<br />not just completion.</p></div></div><div className="certification-grid">{certifications.map((certification, index) => <article className="certification-card section-scroll-reveal" key={certification.issuer}><div className="certification-index">0{index + 1} / CREDENTIAL</div><h3>{certification.issuer}</h3><ul>{certification.items.map((item) => <li key={item}><span aria-hidden="true">↳</span>{item}</li>)}</ul><div className="certification-seal" aria-hidden="true">VERIFIED<br />FIELD<br />SIGNAL</div></article>)}</div></div></section>;
}

function InspectionModal({ project, close }: { project: Project; close: () => void }) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  return <div className="inspection-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }} onWheel={(event) => event.stopPropagation()}><section className="inspection-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}><div className="inspection-chrome"><span className="palette-lights" aria-hidden="true"><i /><i /><i /></span><span>CASE FILE / {project.number}</span><button ref={closeButtonRef} className="inspection-close" onClick={close} aria-label="Close inspection dialog">×</button></div><div className="inspection-content"><StatusBadge status={project.status} /><h2 id={titleId}>Inspection<br /><em>coming soon</em></h2><p>Case file inspection for {project.title} is not available yet.</p><button className="inspection-action" onClick={close}>Close case file <span aria-hidden="true">↗</span></button></div></section></div>;
}

function CommandPalette({ inputRef, query, setQuery, selectedCommand, setSelectedCommand, commands, onKeyDown, close }: { inputRef: React.RefObject<HTMLInputElement | null>; query: string; setQuery: (value: string) => void; selectedCommand: number; setSelectedCommand: (value: number) => void; commands: PaletteCommand[]; onKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void; close: () => void }) {
  const labelId = useId();
  return <div className="palette-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><section className="command-palette" role="dialog" aria-modal="true" aria-labelledby={labelId}><div className="palette-chrome"><span className="palette-lights" aria-hidden="true"><i /><i /><i /></span><span id={labelId}>JEDV COMMAND PALETTE</span><button className="palette-close" onClick={close} aria-label="Close command palette">Esc</button></div><div className="palette-input-row"><span aria-hidden="true" className="palette-prompt">›</span><input ref={inputRef} value={query} onChange={(event) => { setQuery(event.target.value); setSelectedCommand(0); }} onKeyDown={onKeyDown} placeholder="Type a command or search…" aria-label="Search commands" role="combobox" aria-controls="command-list" aria-autocomplete="list" aria-expanded="true" /><kbd>ESC</kbd></div><div className="command-list" id="command-list" role="listbox" aria-label="Commands">{commands.length === 0 ? <p className="empty-command">No matching command. Try a section, project, or action.</p> : commands.map((command, index) => <button className={`command-row ${selectedCommand === index ? 'is-selected' : ''}`} key={command.id} role="option" aria-selected={selectedCommand === index} onMouseEnter={() => setSelectedCommand(index)} onClick={command.action}><span className="command-icon" aria-hidden="true">{command.group === 'Projects' ? '▣' : command.group === 'Actions' ? '↯' : '→'}</span><span className="command-label"><strong>{command.label}</strong><small>{command.group}</small></span><span className="command-hint">{command.hint}</span></button>)}</div><div className="palette-footer"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> select</span><span><kbd>esc</kbd> close</span></div></section></div>;
}

export default App;
