import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode, RefObject } from 'react';
import { certifications, email, projects, skillGroups, technologies, timeline, type Project, type ProjectStatus } from './data';
import { resumeText } from './resume';

type Theme = 'dark' | 'light';
type HeaderTone = 'dark' | 'light';
type Toast = { id: number; message: string };
type PaletteCommand = { id: string; label: string; group: string; hint?: string; action: () => void };

const navItems = [
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'contact', label: 'Contact' },
];

const filters: Array<'All' | ProjectStatus> = ['All', 'Shipped', 'In Progress', 'Active'];
const DESKTOP_SCROLL_LOCK_QUERY = '(min-width: 901px) and (prefers-reduced-motion: no-preference)';
const LIGHT_HEADER_SECTIONS = new Set(['about', 'experience', 'contact']);

function isDesktopScrollLockEnabled() {
  return typeof window !== 'undefined' && window.matchMedia(DESKTOP_SCROLL_LOCK_QUERY).matches;
}

function ArrowUpRight() {
  return <span aria-hidden="true" className="arrow-icon">↗</span>;
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
  const [reducedMotion, setReducedMotion] = useState(false);
  const [inspectionProject, setInspectionProject] = useState<Project | null>(null);
  const [scrollLockEnabled, setScrollLockEnabled] = useState(isDesktopScrollLockEnabled);
  const [revealedProjectCount, setRevealedProjectCount] = useState(() => isDesktopScrollLockEnabled() ? 1 : projects.length);
  const paletteInputRef = useRef<HTMLInputElement>(null);
  const projectsSectionRef = useRef<HTMLElement>(null);
  const timelineSectionRef = useRef<HTMLElement>(null);
  const timelineTrackRef = useRef<HTMLDivElement>(null);
  const touchLastY = useRef<number | null>(null);
  const lastProjectReveal = useRef(0);
  const toastId = useRef(0);
  const visibleProjects = projects.filter((project) => filter === 'All' || project.status === filter);

  const notify = (message: string) => {
    const id = toastId.current + 1;
    toastId.current = id;
    setToasts((current) => [...current, { id, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3200);
  };

  const scrollToSection = (id: string, label: string, shouldNotify = true) => {
    document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
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
    setRevealedProjectCount(projects.length);
    setExpandedProjects((current) => current.includes(project.id) ? current : [...current, project.id]);
    scrollToSection('projects', 'Projects', false);
    window.setTimeout(() => document.getElementById(project.id)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' }), 80);
    setPaletteOpen(false);
    notify(`Opening ${project.title}`);
  };

  const openInspection = (project: Project) => {
    setInspectionProject(project);
    setPaletteOpen(false);
  };

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
    const mediaQuery = window.matchMedia(DESKTOP_SCROLL_LOCK_QUERY);
    const updateScrollLock = () => {
      const enabled = mediaQuery.matches;
      setScrollLockEnabled(enabled);
      setRevealedProjectCount(enabled ? 1 : projects.length);
    };
    updateScrollLock();
    mediaQuery.addEventListener('change', updateScrollLock);
    return () => mediaQuery.removeEventListener('change', updateScrollLock);
  }, []);

  useLayoutEffect(() => {
    if (timelineTrackRef.current) timelineTrackRef.current.scrollLeft = 0;
  }, []);

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
      window.setTimeout(() => paletteInputRef.current?.focus(), 40);
    }
  }, [paletteOpen]);

  useEffect(() => {
    if (!scrollLockEnabled) return undefined;

    const headerOffset = 74;
    const isProjectLockZone = () => {
      const section = projectsSectionRef.current;
      if (!section) return false;
      const rect = section.getBoundingClientRect();
      return rect.top <= headerOffset && rect.bottom > headerOffset;
    };
    const isTimelineLockZone = () => {
      const section = timelineSectionRef.current;
      const track = timelineTrackRef.current;
      if (!section || !track) return false;
      const sectionRect = section.getBoundingClientRect();
      const trackRect = track.getBoundingClientRect();
      return sectionRect.top <= headerOffset && sectionRect.bottom > headerOffset && trackRect.top <= window.innerHeight && trackRect.bottom > headerOffset;
    };
    const revealNextProject = () => {
      const now = performance.now();
      if (now - lastProjectReveal.current < 110) return;
      lastProjectReveal.current = now;
      setRevealedProjectCount((current) => Math.min(current + 1, visibleProjects.length));
    };
    const moveTimeline = (delta: number) => {
      const track = timelineTrackRef.current;
      if (!track || !delta) return false;
      const maximum = Math.max(track.scrollWidth - track.clientWidth, 0);
      const nextScrollLeft = Math.max(0, Math.min(track.scrollLeft + delta, maximum));
      if (nextScrollLeft === track.scrollLeft) return false;
      track.scrollLeft = nextScrollLeft;
      return true;
    };
    const handleWheel = (event: WheelEvent) => {
      if (paletteOpen || inspectionProject) return;
      if (event.deltaY > 0 && isProjectLockZone() && revealedProjectCount < visibleProjects.length) {
        event.preventDefault();
        revealNextProject();
        return;
      }
      if (!isTimelineLockZone()) return;
      const delta = event.deltaY || event.deltaX;
      const track = timelineTrackRef.current;
      if (!track || !delta) return;
      const maximum = Math.max(track.scrollWidth - track.clientWidth, 0);
      const movingRight = delta > 0;
      const canMove = movingRight ? track.scrollLeft < maximum - 1 : track.scrollLeft > 0;
      if (canMove) {
        event.preventDefault();
        moveTimeline(delta);
      }
    };
    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) touchLastY.current = event.touches[0].clientY;
    };
    const handleTouchMove = (event: TouchEvent) => {
      if (paletteOpen || inspectionProject || event.touches.length !== 1 || touchLastY.current === null) return;
      const currentY = event.touches[0].clientY;
      const delta = touchLastY.current - currentY;
      if (delta > 0 && isProjectLockZone() && revealedProjectCount < visibleProjects.length) {
        event.preventDefault();
        touchLastY.current = currentY;
        if (Math.abs(delta) >= 18) revealNextProject();
        return;
      }
      if (isTimelineLockZone() && moveTimeline(delta)) {
        event.preventDefault();
        touchLastY.current = currentY;
      }
    };
    const resetTouch = () => { touchLastY.current = null; };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', resetTouch, { passive: true });
    window.addEventListener('touchcancel', resetTouch, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', resetTouch);
      window.removeEventListener('touchcancel', resetTouch);
    };
  }, [inspectionProject, paletteOpen, revealedProjectCount, scrollLockEnabled, visibleProjects.length]);

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
      <Header tone={headerTone} activeSection={activeSection} mobileNavOpen={mobileNavOpen} setMobileNavOpen={setMobileNavOpen} openPalette={() => setPaletteOpen(true)} scrollToSection={scrollToSection} />

      <main>
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-grid" aria-hidden="true" />
          <div className="container hero-content">
            <div className="hero-copy reveal-on-load">
              <div className="hero-kicker"><span className="live-signal" />Available for new systems <span className="kicker-rule" /> 09.2026</div>
              <p className="hero-index">7 / SYSTEMS SHIPPED <span>·</span> 5 / CLIENTS SERVED</p>
              <h1 id="hero-title">John Eduard<br /><em>De Villa</em></h1>
              <p className="hero-role">Full-stack Developer <span>·</span> Nasugbu, Batangas, Philippines</p>
              <p className="hero-intro">From EHR schema design to IoT sensor pipelines. I build production systems for real clients while finishing my degree.</p>
              <div className="hero-actions">
                <button className="button button-primary" onClick={() => scrollToSection('projects', 'Projects')}>See production work <ArrowUpRight /></button>
                <button className="button button-console" onClick={() => setPaletteOpen(true)}><span className="button-prompt">$</span> Open command palette <kbd>⌘K</kbd></button>
              </div>
            </div>
            <HeroReadout />
          </div>
          <div className="hero-footer container" aria-hidden="true"><span>01 / INTRODUCTION</span><span>SCROLL TO INSPECT <span className="scroll-cue">↓</span></span></div>
        </section>

        <TechMarquee paused={marqueePaused} setPaused={setMarqueePaused} />

        <section className="paper-section about-section" id="about" aria-labelledby="about-title">
          <div className="container">
            <SectionLabel>About &amp; Stack</SectionLabel>
            <div className="section-heading-row">
              <div><h2 id="about-title">What I do &amp;<br /><em>how I work</em></h2></div>
              <p className="section-subheading">I build for clients, not grades</p>
            </div>
            <div className="about-layout">
              <div className="about-statement"><p>I build real, deployed systems for actual clients, not just class exercises. From EHR schema design to IoT sensor pipelines, I work solo, end-to-end, delivering production software while finishing my degree.</p><span className="margin-note">FIELD NOTE 001</span></div>
              <div className="about-approach"><div className="mini-heading">Approach / 02</div><p>I use an AI-assisted workflow (OpenCode for codebase analysis, Claude Code &amp; GitHub Copilot for implementation) to move fast without cutting corners. I also tinker with hardware, run Linux (Hyprland, Omarchy), and wire up Arduinos and Raspberry Pis.</p></div>
              <StatusPanel />
            </div>
            <div id="skills" className="skills-block"><div className="mini-heading">Stack inventory / 07 groups</div><div className="skills-grid">{skillGroups.map((group) => <SkillGroup key={group.label} label={group.label} items={group.items} />)}</div></div>
          </div>
        </section>

        <section ref={projectsSectionRef} className="ink-section projects-section" id="projects" aria-labelledby="projects-title">
          <div className="container">
            <SectionLabel>Featured Projects</SectionLabel>
            <div className="section-heading-row projects-heading"><div><h2 id="projects-title">Production systems<br /><em>I’ve built</em></h2></div><p className="section-subheading">Evidence over adjectives.<br />Open a case file.</p></div>
             <div className="filter-bar" role="tablist" aria-label="Filter projects by status">{filters.map((option) => <button key={option} className={`filter-button ${filter === option ? 'is-selected' : ''}`} role="tab" aria-selected={filter === option} onClick={() => { setFilter(option); setRevealedProjectCount(projects.length); }}><span className="filter-count">{option === 'All' ? projects.length : projects.filter((project) => project.status === option).length}</span>{option}</button>)}</div>
             <div className="project-list">{visibleProjects.map((project, index) => <ProjectCard key={project.id} project={project} expanded={expandedProjects.includes(project.id)} toggleProject={toggleProject} inspectProject={openInspection} revealed={!scrollLockEnabled || reducedMotion || index < revealedProjectCount} />)}</div>
          </div>
        </section>

        <TimelineSection scrollToSection={scrollToSection} sectionRef={timelineSectionRef} trackRef={timelineTrackRef} />
        <CertificationsSection />

        <section className="contact-section" id="contact" aria-labelledby="contact-title">
          <div className="container contact-layout"><div><SectionLabel>Contact</SectionLabel><h2 id="contact-title">Let’s talk about<br /><em>your system</em></h2></div><div className="contact-copy"><p>I&apos;m available for new projects, freelance work, and collaborations. Email works best. I reply within 24 hours.</p><button className="email-button" onClick={copyEmail} aria-label={`Copy ${email}`}><span className="email-prefix">mailto://</span>{email}<ArrowUpRight /></button><div className="contact-meta"><span>Nasugbu, Batangas, Philippines</span><div className="social-row" aria-label="Social links unavailable"><span className="social-disabled">GitHub</span><span className="social-disabled">LinkedIn</span><span className="social-disabled">Facebook</span></div></div><button className="resume-button" onClick={downloadResume}>{resumeState === 'preparing' ? 'Preparing…' : resumeState === 'saved' ? '✓ Saved' : 'Download Résumé'}<ArrowUpRight /></button></div></div>
        </section>
      </main>

      <footer className="site-footer"><div className="container footer-content"><span>© 2026 John Eduard De Villa</span><span>Built with React <span className="footer-separator">·</span> Vite <span className="footer-separator">·</span> Tailwind</span><span>JEDV / END OF LOG</span></div></footer>

      <div className="toast-region" aria-live="polite" aria-atomic="true">{toasts.map((toast) => <div className="toast" key={toast.id}><span className="toast-mark">✓</span>{toast.message}</div>)}</div>

      {paletteOpen && <CommandPalette inputRef={paletteInputRef} query={paletteQuery} setQuery={setPaletteQuery} selectedCommand={selectedCommand} setSelectedCommand={setSelectedCommand} commands={matchingCommands} onKeyDown={handlePaletteKeyDown} close={() => setPaletteOpen(false)} />}
      {inspectionProject && <InspectionModal project={inspectionProject} close={() => setInspectionProject(null)} />}
    </div>
  );
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

function StatusPanel() {
  return <div className="status-panel"><div className="mini-heading">Current status / 03</div><dl><div><dt>Education</dt><dd>4th-year BSIT, Business Analytics<br />Batangas State University, ARASOF Nasugbu</dd></div><div><dt>Location</dt><dd>Nasugbu, Batangas, Philippines</dd></div><div><dt>Workflow</dt><dd>Solo, end-to-end, AI-assisted</dd></div></dl></div>;
}

function SkillGroup({ label, items }: { label: string; items: string[] }) {
  return <div className="skill-group"><h3>{label}</h3><div className="pill-list">{items.map((item) => <span className="skill-pill" key={item}>{item}</span>)}</div></div>;
}

function ProjectCard({ project, expanded, toggleProject, inspectProject, revealed }: { project: Project; expanded: boolean; toggleProject: (id: string) => void; inspectProject: (project: Project) => void; revealed: boolean }) {
  const detailId = `${project.id}-details`;
  return <article className={`project-card project-${project.status.toLowerCase().replace(' ', '-')} ${revealed ? 'is-revealed' : ''}`} id={project.id} aria-hidden={!revealed} inert={!revealed}><div className="project-number" aria-hidden="true">{project.number}</div><div className="project-main"><div className="project-topline"><StatusBadge status={project.status} /><span className="project-repo">Repo coming soon</span></div><h3>{project.title}</h3><p className="project-subtitle">{project.subtitle}</p><div className="project-impact"><span>Impact</span><p>{project.impact}</p></div><div className="stack-row" aria-label={`${project.title} technology stack`}>{project.stack.map((item) => <span key={item}>{item}</span>)}</div></div><div className="project-controls"><button className="details-button" aria-expanded={expanded} aria-controls={detailId} onClick={() => toggleProject(project.id)}>{expanded ? 'Close case file' : 'Read case file'}<span className="plus-icon" aria-hidden="true">{expanded ? '−' : '+'}</span></button><button className="project-jump" onClick={() => inspectProject(project)} aria-label={`Inspect ${project.title}`}>Inspect <ArrowUpRight /></button></div>{expanded && <div className="project-details" id={detailId}><div className="details-label">CASE FILE / BUILD NOTES</div><ul>{project.details.map((detail) => <li key={detail}>{detail}</li>)}</ul></div>}</article>;
}

function TimelineSection({ scrollToSection, sectionRef, trackRef }: { scrollToSection: (id: string, label: string) => void; sectionRef: RefObject<HTMLElement | null>; trackRef: RefObject<HTMLDivElement | null> }) {
  return <section ref={sectionRef} className="paper-section timeline-section" id="experience" aria-labelledby="experience-title"><div className="container"><SectionLabel>Experience</SectionLabel><div className="section-heading-row"><h2 id="experience-title">Timeline</h2><p className="section-subheading timeline-hint">Scroll horizontally <span aria-hidden="true">→</span></p></div><div className="timeline-badges"><span>Education</span><span>Freelance</span></div><div className="timeline-track" ref={trackRef}>{timeline.map((entry, index) => <article className="timeline-entry" key={`${entry.year}-${entry.title}`}><div className="timeline-marker"><span>{String(index + 1).padStart(2, '0')}</span></div><div className="timeline-year">{entry.year}</div><div className="timeline-entry-body"><span className={`timeline-badge badge-${entry.badge.toLowerCase()}`}>{entry.badge}</span><h3>{entry.title}</h3><p className="timeline-role">{entry.role} <span>·</span> {entry.organization}</p><p>{entry.description}</p></div></article>)}</div><button className="timeline-cta" onClick={() => scrollToSection('contact', 'Contact')}>Start a conversation <ArrowUpRight /></button></div></section>;
}

function CertificationsSection() {
  return <section className="ink-section certifications-section" id="certifications" aria-labelledby="certifications-title"><div className="container"><SectionLabel>Certifications</SectionLabel><div className="section-heading-row"><h2 id="certifications-title">Industry<br /><em>credentials</em></h2><p className="section-subheading">Signals of curiosity,<br />not just completion.</p></div><div className="certification-grid">{certifications.map((certification, index) => <article className="certification-card" key={certification.issuer}><div className="certification-index">0{index + 1} / CREDENTIAL</div><h3>{certification.issuer}</h3><ul>{certification.items.map((item) => <li key={item}><span aria-hidden="true">↳</span>{item}</li>)}</ul><div className="certification-seal" aria-hidden="true">VERIFIED<br />FIELD<br />SIGNAL</div></article>)}</div></div></section>;
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
