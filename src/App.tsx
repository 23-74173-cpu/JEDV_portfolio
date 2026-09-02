import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { certifications, email, projects, skillGroups, technologies, timeline, type Project, type ProjectStatus } from './data';
import { resumeText } from './resume';

type Theme = 'dark' | 'light';
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
  const [activeSection, setActiveSection] = useState('about');
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
  const paletteInputRef = useRef<HTMLInputElement>(null);
  const toastId = useRef(0);

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
    setExpandedProjects((current) => current.includes(project.id) ? current : [...current, project.id]);
    scrollToSection('projects', 'Projects', false);
    window.setTimeout(() => document.getElementById(project.id)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' }), 80);
    setPaletteOpen(false);
    notify(`Opening ${project.title}`);
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
    const sections = navItems.map((item) => document.getElementById(item.id)).filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveSection(visible.target.id);
    }, { rootMargin: '-20% 0px -60% 0px', threshold: [0.1, 0.25, 0.5] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
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

  const commands: PaletteCommand[] = [
    ...navItems.map((item) => ({ id: `jump-${item.id}`, label: item.label, group: 'Jump to', hint: `/${item.id}`, action: () => scrollToSection(item.id, item.label) })),
    { id: 'jump-skills', label: 'Skills', group: 'Jump to', hint: '/skills', action: () => scrollToSection('skills', 'Skills') },
    { id: 'theme', label: `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`, group: 'Actions', hint: 'theme', action: toggleTheme },
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
      <Header activeSection={activeSection} mobileNavOpen={mobileNavOpen} setMobileNavOpen={setMobileNavOpen} openPalette={() => setPaletteOpen(true)} scrollToSection={scrollToSection} />

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

        <section className="ink-section projects-section" id="projects" aria-labelledby="projects-title">
          <div className="container">
            <SectionLabel>Featured Projects</SectionLabel>
            <div className="section-heading-row projects-heading"><div><h2 id="projects-title">Production systems<br /><em>I’ve built</em></h2></div><p className="section-subheading">Evidence over adjectives.<br />Open a case file.</p></div>
            <div className="filter-bar" role="tablist" aria-label="Filter projects by status">{filters.map((option) => <button key={option} className={`filter-button ${filter === option ? 'is-selected' : ''}`} role="tab" aria-selected={filter === option} onClick={() => setFilter(option)}><span className="filter-count">{option === 'All' ? projects.length : projects.filter((project) => project.status === option).length}</span>{option}</button>)}</div>
            <div className="project-list">{projects.filter((project) => filter === 'All' || project.status === filter).map((project) => <ProjectCard key={project.id} project={project} expanded={expandedProjects.includes(project.id)} toggleProject={toggleProject} openProject={openProject} />)}</div>
          </div>
        </section>

        <TimelineSection scrollToSection={scrollToSection} />
        <CertificationsSection />

        <section className="contact-section" id="contact" aria-labelledby="contact-title">
          <div className="container contact-layout"><div><SectionLabel>Contact</SectionLabel><h2 id="contact-title">Let’s talk about<br /><em>your system</em></h2></div><div className="contact-copy"><p>I&apos;m available for new projects, freelance work, and collaborations. Email works best. I reply within 24 hours.</p><button className="email-button" onClick={copyEmail} aria-label={`Copy ${email}`}><span className="email-prefix">mailto://</span>{email}<ArrowUpRight /></button><div className="contact-meta"><span>Nasugbu, Batangas, Philippines</span><div className="social-row" aria-label="Social links unavailable"><span className="social-disabled">GitHub</span><span className="social-disabled">LinkedIn</span><span className="social-disabled">Facebook</span></div></div><button className="resume-button" onClick={downloadResume}>{resumeState === 'preparing' ? 'Preparing…' : resumeState === 'saved' ? '✓ Saved' : 'Download Résumé'}<ArrowUpRight /></button></div></div>
        </section>
      </main>

      <footer className="site-footer"><div className="container footer-content"><span>© 2026 John Eduard De Villa</span><span>Built with React <span className="footer-separator">·</span> Vite <span className="footer-separator">·</span> Tailwind</span><span>JEDV / END OF LOG</span></div></footer>

      <div className="toast-region" aria-live="polite" aria-atomic="true">{toasts.map((toast) => <div className="toast" key={toast.id}><span className="toast-mark">✓</span>{toast.message}</div>)}</div>

      {paletteOpen && <CommandPalette inputRef={paletteInputRef} query={paletteQuery} setQuery={setPaletteQuery} selectedCommand={selectedCommand} setSelectedCommand={setSelectedCommand} commands={matchingCommands} onKeyDown={handlePaletteKeyDown} close={() => setPaletteOpen(false)} />}
    </div>
  );
}

function Header({ activeSection, mobileNavOpen, setMobileNavOpen, openPalette, scrollToSection }: { activeSection: string; mobileNavOpen: boolean; setMobileNavOpen: (open: boolean) => void; openPalette: () => void; scrollToSection: (id: string, label: string) => void }) {
  return <header className="site-header"><div className="container header-inner"><button className="wordmark" onClick={() => scrollToSection('about', 'About')} aria-label="Go to top">JEDV<span className="wordmark-cursor">_</span></button><nav className="desktop-nav" aria-label="Primary navigation">{navItems.map((item) => <button key={item.id} className={activeSection === item.id ? 'active' : ''} onClick={() => scrollToSection(item.id, item.label)}>{item.label}</button>)}</nav><div className="header-actions"><button className="jump-button" onClick={openPalette}>Jump <kbd>⌘K</kbd></button><button className="mobile-menu-button" aria-expanded={mobileNavOpen} aria-controls="mobile-nav" onClick={() => setMobileNavOpen(!mobileNavOpen)}><span className="sr-only">{mobileNavOpen ? 'Close menu' : 'Open menu'}</span><span className="menu-lines" aria-hidden="true"><i /><i /></span></button></div></div>{mobileNavOpen && <nav id="mobile-nav" className="mobile-nav" aria-label="Mobile navigation">{navItems.map((item) => <button key={item.id} className={activeSection === item.id ? 'active' : ''} onClick={() => scrollToSection(item.id, item.label)}>{item.label}<ArrowUpRight /></button>)}<button onClick={openPalette}>Open command palette <kbd>⌘K</kbd></button></nav>}</header>;
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

function ProjectCard({ project, expanded, toggleProject, openProject }: { project: Project; expanded: boolean; toggleProject: (id: string) => void; openProject: (project: Project) => void }) {
  const detailId = `${project.id}-details`;
  return <article className={`project-card project-${project.status.toLowerCase().replace(' ', '-')}`} id={project.id}><div className="project-number" aria-hidden="true">{project.number}</div><div className="project-main"><div className="project-topline"><StatusBadge status={project.status} /><span className="project-repo">Repo coming soon</span></div><h3>{project.title}</h3><p className="project-subtitle">{project.subtitle}</p><div className="project-impact"><span>Impact</span><p>{project.impact}</p></div><div className="stack-row" aria-label={`${project.title} technology stack`}>{project.stack.map((item) => <span key={item}>{item}</span>)}</div></div><div className="project-controls"><button className="details-button" aria-expanded={expanded} aria-controls={detailId} onClick={() => toggleProject(project.id)}>{expanded ? 'Close case file' : 'Read case file'}<span className="plus-icon" aria-hidden="true">{expanded ? '−' : '+'}</span></button><button className="project-jump" onClick={() => openProject(project)} aria-label={`Open ${project.title}`}>Inspect <ArrowUpRight /></button></div>{expanded && <div className="project-details" id={detailId}><div className="details-label">CASE FILE / BUILD NOTES</div><ul>{project.details.map((detail) => <li key={detail}>{detail}</li>)}</ul></div>}</article>;
}

function TimelineSection({ scrollToSection }: { scrollToSection: (id: string, label: string) => void }) {
  return <section className="paper-section timeline-section" id="experience" aria-labelledby="experience-title"><div className="container"><SectionLabel>Experience</SectionLabel><div className="section-heading-row"><h2 id="experience-title">Timeline</h2><p className="section-subheading timeline-hint">Scroll horizontally <span aria-hidden="true">→</span></p></div><div className="timeline-badges"><span>Education</span><span>Freelance</span></div><div className="timeline-track">{timeline.map((entry, index) => <article className="timeline-entry" key={`${entry.year}-${entry.title}`}><div className="timeline-marker"><span>{String(index + 1).padStart(2, '0')}</span></div><div className="timeline-year">{entry.year}</div><div className="timeline-entry-body"><span className={`timeline-badge badge-${entry.badge.toLowerCase()}`}>{entry.badge}</span><h3>{entry.title}</h3><p className="timeline-role">{entry.role} <span>·</span> {entry.organization}</p><p>{entry.description}</p></div></article>)}</div><button className="timeline-cta" onClick={() => scrollToSection('contact', 'Contact')}>Start a conversation <ArrowUpRight /></button></div></section>;
}

function CertificationsSection() {
  return <section className="ink-section certifications-section" id="certifications" aria-labelledby="certifications-title"><div className="container"><SectionLabel>Certifications</SectionLabel><div className="section-heading-row"><h2 id="certifications-title">Industry<br /><em>credentials</em></h2><p className="section-subheading">Signals of curiosity,<br />not just completion.</p></div><div className="certification-grid">{certifications.map((certification, index) => <article className="certification-card" key={certification.issuer}><div className="certification-index">0{index + 1} / CREDENTIAL</div><h3>{certification.issuer}</h3><ul>{certification.items.map((item) => <li key={item}><span aria-hidden="true">↳</span>{item}</li>)}</ul><div className="certification-seal" aria-hidden="true">VERIFIED<br />FIELD<br />SIGNAL</div></article>)}</div></div></section>;
}

function CommandPalette({ inputRef, query, setQuery, selectedCommand, setSelectedCommand, commands, onKeyDown, close }: { inputRef: React.RefObject<HTMLInputElement | null>; query: string; setQuery: (value: string) => void; selectedCommand: number; setSelectedCommand: (value: number) => void; commands: PaletteCommand[]; onKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void; close: () => void }) {
  const labelId = useId();
  return <div className="palette-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><section className="command-palette" role="dialog" aria-modal="true" aria-labelledby={labelId}><div className="palette-chrome"><span className="palette-lights" aria-hidden="true"><i /><i /><i /></span><span id={labelId}>JEDV COMMAND PALETTE</span><button className="palette-close" onClick={close} aria-label="Close command palette">Esc</button></div><div className="palette-input-row"><span aria-hidden="true" className="palette-prompt">›</span><input ref={inputRef} value={query} onChange={(event) => { setQuery(event.target.value); setSelectedCommand(0); }} onKeyDown={onKeyDown} placeholder="Type a command or search…" aria-label="Search commands" role="combobox" aria-controls="command-list" aria-autocomplete="list" aria-expanded="true" /><kbd>ESC</kbd></div><div className="command-list" id="command-list" role="listbox" aria-label="Commands">{commands.length === 0 ? <p className="empty-command">No matching command. Try a section, project, or action.</p> : commands.map((command, index) => <button className={`command-row ${selectedCommand === index ? 'is-selected' : ''}`} key={command.id} role="option" aria-selected={selectedCommand === index} onMouseEnter={() => setSelectedCommand(index)} onClick={command.action}><span className="command-icon" aria-hidden="true">{command.group === 'Projects' ? '▣' : command.group === 'Actions' ? '↯' : '→'}</span><span className="command-label"><strong>{command.label}</strong><small>{command.group}</small></span><span className="command-hint">{command.hint}</span></button>)}</div><div className="palette-footer"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> select</span><span><kbd>esc</kbd> close</span></div></section></div>;
}

export default App;
