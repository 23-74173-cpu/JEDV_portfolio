import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';

type Prize = {
  id: string;
  label: string;
  shortLabel: string;
  weight: number; // percent
  tier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'jackpot';
};

const PRIZES: Prize[] = [
  { id: '5off', label: '5% OFF your project', shortLabel: '5% OFF', weight: 50, tier: 'common' },
  { id: 'seo', label: 'Free basic SEO setup', shortLabel: 'FREE SEO', weight: 25, tier: 'uncommon' },
  { id: '10off', label: '10% OFF your project', shortLabel: '10% OFF', weight: 12, tier: 'rare' },
  { id: 'chat', label: 'Free chat widget', shortLabel: 'CHAT WIDGET', weight: 7, tier: 'epic' },
  { id: 'priority', label: 'Priority queue', shortLabel: 'PRIORITY', weight: 4, tier: 'legendary' },
  { id: '15off', label: '15% OFF + 1 free revision', shortLabel: '15% OFF+', weight: 1.5, tier: 'mythic' },
  { id: 'landing', label: 'Free 1-page landing site', shortLabel: 'FREE SITE', weight: 0.5, tier: 'jackpot' },
];

type StoredSpin = {
  prizeId: string;
  prizeLabel: string;
  code: string;
  timestamp: number;
};

const STORAGE_KEY = 'jedv-spin-state';
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = 'JEDV-';
  for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function weightedPick(): Prize {
  const r = Math.random() * 100;
  let acc = 0;
  for (const p of PRIZES) {
    acc += p.weight;
    if (r < acc) return p;
  }
  return PRIZES[0];
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Ready now';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function loadStored(): StoredSpin | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSpin;
    if (!parsed?.prizeId || !parsed?.code || typeof parsed.timestamp !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveStored(s: StoredSpin) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch { /* quota / disabled */ }
}

// Build segment layout: sizes proportional to weight (full 360deg)
// Each segment's angular width = (weight / 100) * 360, cumulative start/end, ending exactly at 360.
type Segment = Prize & { startDeg: number; endDeg: number; midDeg: number; sizeDeg: number };
function buildSegments(): Segment[] {
  let cursor = 0;
  const segs = PRIZES.map((p, idx) => {
    let sizeDeg = (p.weight / 100) * 360;
    const startDeg = cursor;
    let endDeg = cursor + sizeDeg;
    // Force last segment to end exactly at 360 to avoid floating-point gap
    if (idx === PRIZES.length - 1) {
      endDeg = 360;
      sizeDeg = endDeg - startDeg;
    }
    const midDeg = startDeg + sizeDeg / 2;
    const seg: Segment = { ...p, startDeg, endDeg, midDeg, sizeDeg };
    cursor = endDeg;
    return seg;
  });
  // Safety: verify total 360
  const total = segs.reduce((s, v) => s + v.sizeDeg, 0);
  if (Math.abs(total - 360) > 0.01) console.warn('Segment total != 360:', total);
  return segs;
}

const SEGMENTS = buildSegments();

// GSAP ease for spin: fast start, slow finish
// We'll use gsap tween with power4.out-ish via custom ease: "power4.out" or "expo.out"
// Using gsap's built-in power4.out is good for this.

function rotationForPrize(prizeId: string): number {
  const seg = SEGMENTS.find((s) => s.id === prizeId);
  if (!seg) return 0;
  const pointerAngle = -90;
  return pointerAngle - seg.midDeg;
}

export default function SpinWheelSection() {
  const wheelRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const [stored, setStored] = useState<StoredSpin | null>(() => loadStored());
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(() => {
    const s = loadStored();
    if (!s) return 0;
    if (Date.now() - s.timestamp >= COOLDOWN_MS) return 0;
    return rotationForPrize(s.prizeId);
  });
  const [winningPrize, setWinningPrize] = useState<Prize | null>(() => {
    const s = loadStored();
    if (!s) return null;
    return PRIZES.find((p) => p.id === s.prizeId) ?? null;
  });
  const [revealed, setRevealed] = useState(() => {
    const s = loadStored();
    if (!s) return false;
    return Date.now() - s.timestamp < COOLDOWN_MS;
  });
  const [countdownMs, setCountdownMs] = useState(() => {
    const s = loadStored();
    if (!s) return 0;
    return Math.max(0, s.timestamp + COOLDOWN_MS - Date.now());
  });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [tickKey, setTickKey] = useState(0);

  const isOnCooldown = stored !== null && Date.now() - stored.timestamp < COOLDOWN_MS;

  // Live countdown
  useEffect(() => {
    if (!isOnCooldown || !stored) return;
    const iv = window.setInterval(() => {
      const remain = Math.max(0, stored.timestamp + COOLDOWN_MS - Date.now());
      setCountdownMs(remain);
      setTickKey((k) => k + 1);
      if (remain <= 0) {
        // expired — clear revealed but keep stored for code display until next spin
        // Actually per spec we should disable button only during cooldown; when expired, allow spin again
      }
    }, 1000);
    return () => window.clearInterval(iv);
  }, [isOnCooldown, stored]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const upd = () => setReducedMotion(mq.matches);
    upd();
    mq.addEventListener('change', upd);
    return () => mq.removeEventListener('change', upd);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)');
    const upd = () => setIsMobile(mq.matches);
    upd();
    mq.addEventListener('change', upd);
    return () => mq.removeEventListener('change', upd);
  }, []);

  // Ensure wheel starts at correct rotation on mount (persist rotation or 0)
  const spinCountRef = useRef(0);

  const handleSpin = useCallback(() => {
    if (isSpinning || isOnCooldown || !wheelRef.current) return;

    const prize = weightedPick();
    const targetSegment = SEGMENTS.find((s) => s.id === prize.id)!;

    // Calculate rotation needed so that prize's midpoint lands at pointer (12 o'clock = 0deg / 360deg top)
    // Our wheel segments start at 0deg at 3 o'clock? We define 0deg as 3 o'clock standard SVG.
    // Pointer is at top (12 o'clock) = 270deg in standard SVG (or -90deg).
    // Wheel rotation is applied to whole wheel. When wheel rotates clockwise by R, segment at original angle A moves to A+R.
    // We want target mid to end at pointer angle (270deg or -90deg).
    // So R = pointerAngle - midDeg. Then add full spins.
    // Use currentRotation as starting point.

    const pointerAngle = -90; // 12 o'clock in SVG/canvas coords where 0deg = 3 o'clock, clockwise positive
    // Normalize segment mids: our SEGMENTS 0..360 correspond to same coordinate system (0 at 3 o'clock, clockwise).
    // So targetMid = targetSegment.midDeg

    // Add jitter within segment so wins don't always hit exact center (but stay inside segment, 20% margin)
    const jitterMargin = targetSegment.sizeDeg * 0.2;
    const jitterRange = targetSegment.sizeDeg - jitterMargin * 2;
    const jitter = jitterRange > 0 ? (Math.random() - 0.5) * jitterRange : 0;
    const targetMidWithJitter = targetSegment.midDeg + jitter;

    const spins = reducedMotion ? 2 : 5 + Math.floor(Math.random() * 3); // 5-7 full rotations
    // We want finalRotation such that (targetMidWithJitter + finalRotation) % 360 ≈ pointerAngle (mod 360)
    // Solve: finalRotation = pointerAngle - targetMidWithJitter + spins*360 + k*360 where we choose k so finalRotation > currentRotation

    let desired = pointerAngle - targetMidWithJitter + spins * 360;
    // Normalize to be greater than currentRotation
    while (desired <= currentRotation) desired += 360;
    // Also add extra full rotations to ensure minimum spins even if currentRotation is large
    // Force at least spins*360 ahead
    if (desired - currentRotation < spins * 360 - 30) {
      desired += 360 * Math.ceil((spins * 360 - (desired - currentRotation)) / 360);
    }

    const finalRotation = desired;
    const duration = reducedMotion ? 1.2 : 3.6 + Math.random() * 0.4; // 3.6-4.0s

    setIsSpinning(true);

    // gsap tween on a plain object to drive rotation
    const obj = { rot: currentRotation };
    gsap.to(obj, {
      rot: finalRotation,
      duration,
      ease: reducedMotion ? 'power2.out' : 'power4.out',
      onUpdate: () => {
        if (wheelRef.current) {
          wheelRef.current.style.transform = `rotate(${obj.rot}deg)`;
        }
        // tick effect: subtle pointer wobble when crossing segment boundaries could be added
      },
      onComplete: () => {
        setCurrentRotation(finalRotation);
        // Generate code and persist
        const code = generateCode();
        const newStored: StoredSpin = { prizeId: prize.id, prizeLabel: prize.label, code, timestamp: Date.now() };
        saveStored(newStored);
        setStored(newStored);
        setWinningPrize(prize);
        setRevealed(true);
        setIsSpinning(false);
        setCountdownMs(COOLDOWN_MS);
        // pulse winning segment
        // trigger glow via class
        if (wheelRef.current) {
          wheelRef.current.setAttribute('data-winning', prize.id);
        }
        // pointer bump
        if (pointerRef.current) {
          gsap.fromTo(pointerRef.current, { scaleY: 1.15, y: -2 }, { scaleY: 1, y: 0, duration: 0.35, ease: 'elastic.out(1, 0.5)' });
        }
      },
    });
    spinCountRef.current += 1;
  }, [isSpinning, isOnCooldown, currentRotation, reducedMotion]);

  // Initial wheel transform — reflect persisted rotation if any
  useEffect(() => {
    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${currentRotation}deg)`;
    }
  }, [currentRotation]);

  const displayedPrize = winningPrize;
  const displayedCode = stored?.code ?? null;
  const canSpin = !isSpinning && !isOnCooldown;

  return (
    <section className="spin-section" id="spin" aria-labelledby="spin-title">
      <div className="spin-grid" aria-hidden="true" />
      <div className="container spin-container">
        <div className="spin-header">
          <p className="section-label spin-label"><span className="label-dot" aria-hidden="true" />Perks &amp; Bonuses</p>
          <h2 id="spin-title"><span className="spin-title-line">SPIN THE</span> <em>WHEEL</em></h2>
          <p className="spin-intro">SPIN FOR A PERK — Unlock a discount or bonus for your project.</p>
          <p className="spin-explainer">Land a prize and it&apos;s yours when you message me — just screenshot your result and send it via Facebook or the contact form to redeem.</p>
        </div>

        <div className="spin-stage">
          {/* HUD frame */}
          <div className="spin-hud-frame" aria-hidden="true">
            <span className="hud-corner hud-corner-tl" />
            <span className="hud-corner hud-corner-tr" />
            <span className="hud-corner hud-corner-bl" />
            <span className="hud-corner hud-corner-br" />
            <span className="hud-label hud-label-top">JEDV // PERK_ENGINE v1.0</span>
            <span className="hud-label hud-label-bottom">RNG // LOCAL_ONLY</span>
          </div>

          <div className="spin-wheel-wrap">
            {/* Wheel */}
            <div className="spin-wheel-outer">
              {/* Pointer — centered over wheel */}
              <div ref={pointerRef} className="spin-pointer" aria-hidden="true">
                <span className="pointer-body" />
                <span className="pointer-dot" />
              </div>
              <div
                ref={wheelRef}
                className={`spin-wheel ${isSpinning ? 'is-spinning' : ''} ${revealed && displayedPrize ? `winning-${displayedPrize.id}` : ''}`}
                role="img"
                aria-label={revealed && displayedPrize ? `Wheel landed on ${displayedPrize.label}` : 'Prize wheel with 7 segments'}
                style={{ transform: `rotate(${currentRotation}deg)` }}
              >
                {/* SVG wheel */}
                <svg className="spin-wheel-svg" viewBox="0 0 200 200" aria-hidden="true">
                  <defs>
                    <radialGradient id="spin-center-grad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#1e2320" />
                      <stop offset="100%" stopColor="#111412" />
                    </radialGradient>
                    <pattern id="spin-hatch" width="4" height="4" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="0" x2="0" y2="4" stroke="rgba(255,107,61,0.07)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  {/* base */}
                  <circle cx="100" cy="100" r="99" fill="#0e1110" stroke="rgba(255,107,61,0.35)" strokeWidth="1.2" />
                  <circle cx="100" cy="100" r="97.5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.7" />
                  {/* segments — exact proportional arcs: (weight/100)*360 */}
                  {SEGMENTS.map((seg) => {
                    const isWinning = revealed && displayedPrize?.id === seg.id;
                    return (
                      <g key={seg.id} className={`wheel-seg seg-${seg.id} ${isWinning ? 'is-winning' : ''}`}>
                        <path
                          d={describeArc(100, 100, 97, seg.startDeg, seg.endDeg)}
                          fill={segFill(seg)}
                          stroke="#0a0e0d"
                          strokeWidth="1.35"
                          strokeLinejoin="round"
                          className="wheel-seg-path"
                        />
                        {/* accent divider glow for rarity — subtle */}
                        {seg.tier !== 'common' && (
                          <path
                            d={describeArc(100, 100, 97, seg.startDeg, seg.endDeg)}
                            fill="none"
                            stroke={tierGlow(seg.tier)}
                            strokeWidth={seg.tier === 'jackpot' ? 1.2 : seg.tier === 'mythic' ? 0.9 : 0.6}
                            opacity={seg.tier === 'jackpot' ? 0.5 : seg.tier === 'mythic' ? 0.35 : 0.22}
                            className="wheel-seg-glow"
                          />
                        )}
                      </g>
                    );
                  })}
                  {/* crisp divider lines at every boundary for visual clarity */}
                  {SEGMENTS.map((seg) => {
                    const a = polarToCartesian(100, 100, 97, seg.startDeg);
                    const c = polarToCartesian(100, 100, 32, seg.startDeg);
                    return <line key={`divider-${seg.id}`} x1={c.x} y1={c.y} x2={a.x} y2={a.y} stroke="rgba(255,107,61,0.58)" strokeWidth="1.0" opacity="0.95" />;
                  })}
                  {/* outer tick marks */}
                  {SEGMENTS.map((seg) => {
                    const a = polarToCartesian(100, 100, 97, seg.startDeg);
                    const b = polarToCartesian(100, 100, 91.5, seg.startDeg);
                    return <line key={`tick-${seg.id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(255,231,212,0.9)" strokeWidth="1.15" strokeLinecap="round" />;
                  })}
                  {/* leader lines for tiny segments (<10deg) — desktop only to avoid mobile overflow */}
                  {!isMobile &&
                    SEGMENTS.filter((s) => s.sizeDeg < 10).map((seg) => {
                      const inner = polarToCartesian(100, 100, 97, seg.midDeg);
                      const outer = polarToCartesian(100, 100, 112, seg.midDeg);
                      return <line key={`leader-${seg.id}`} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="rgba(255,107,61,0.72)" strokeWidth="1.1" strokeDasharray="3 2" opacity="0.9" />;
                    })}
                  {/* center hub */}
                  <circle cx="100" cy="100" r="32" fill="url(#spin-center-grad)" stroke="rgba(255,107,61,0.9)" strokeWidth="1.3" />
                  <circle cx="100" cy="100" r="29" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.7" strokeDasharray="2 3" />
                  <circle cx="100" cy="100" r="4.5" fill="#ff6b3d" />
                  <circle cx="100" cy="100" r="1.7" fill="#111412" />
                </svg>

                {/* Segment labels — standard pie-chart style: 60-70% radius inside slice, bigger, per-segment scaling */}
                {SEGMENTS.map((seg) => {
                  const svgMid = seg.midDeg;
                  const cssMid = (svgMid + 90) % 360; // align SVG 0°=east to CSS 0°=north
                  const isOutside = !isMobile && seg.sizeDeg < 16; // thin slices outside with leader (desktop)
                  if (isOutside) {
                    let outerR = 116;
                    let angleOffset = 0;
                    if (seg.id === 'landing') { outerR = 120; angleOffset = 1.5; }
                    if (seg.id === '15off') { outerR = 114; angleOffset = -0.6; }
                    if (seg.id === 'priority') { outerR = 112; angleOffset = 0.4; }
                    const pos = polarToCartesian(100, 100, outerR, svgMid + angleOffset);
                    const leftPct = (pos.x / 200) * 100;
                    const topPct = (pos.y / 200) * 100;
                    return (
                      <div
                        key={`label-${seg.id}`}
                        className={`wheel-label wheel-label-outside tier-${seg.tier}`}
                        style={{ left: `${leftPct}%`, top: `${topPct}%` } as React.CSSProperties}
                      >
                        <span className="wheel-label-inner">
                          <span className="wheel-label-short">{seg.shortLabel}</span>
                          <span className="wheel-label-pct">{seg.weight}%</span>
                        </span>
                      </div>
                    );
                  }
                  // Inside: 60-70% radius, bigger font per segment. Use horizontal for large, radial for narrow to avoid overlap.
                  let labelRadius = 63; // 65% of 97
                  let fontShort = '0.62rem';
                  let fontPct = '0.44rem';
                  let useRadial = false;
                  if (seg.id === '5off') { labelRadius = 64; fontShort = '0.74rem'; fontPct = '0.54rem'; useRadial = false; }
                  else if (seg.id === 'seo') { labelRadius = 64; fontShort = '0.64rem'; fontPct = '0.48rem'; useRadial = false; }
                  else if (seg.id === '10off') { labelRadius = 67; fontShort = '0.58rem'; fontPct = '0.44rem'; useRadial = false; }
                  else if (seg.id === 'chat') { labelRadius = 58; fontShort = '0.52rem'; fontPct = '0.40rem'; useRadial = true; } // narrow 25° -> radial to reduce tangential overlap
                  if (isMobile && seg.sizeDeg < 16) {
                    labelRadius = 50;
                    fontShort = '0.44rem';
                    fontPct = '0.36rem';
                    useRadial = false;
                  }
                  let innerRot: number;
                  if (useRadial) {
                    const radialViewport = (cssMid + 90) % 360;
                    const isFlippedRadial = radialViewport > 90 && radialViewport < 270;
                    innerRot = -cssMid + 90 + (isFlippedRadial ? 180 : 0);
                  } else {
                    const isFlipped = cssMid > 90 && cssMid < 270;
                    innerRot = -cssMid + (isFlipped ? 180 : 0);
                  }
                  return (
                    <div
                      key={`label-${seg.id}`}
                      className={`wheel-label wheel-label-inside wheel-label-${seg.id} tier-${seg.tier}`}
                      style={
                        {
                          '--mid': `${cssMid}deg`,
                          '--radius': `${labelRadius}px`,
                          '--fs-short': fontShort,
                          '--fs-pct': fontPct,
                        } as React.CSSProperties
                      }
                    >
                      <span className="wheel-label-inner" style={{ transform: `rotate(${innerRot}deg)` } as React.CSSProperties}>
                        <span className="wheel-label-short">{seg.shortLabel}</span>
                        <span className="wheel-label-pct">{seg.weight}%</span>
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Center spin button overlay */}
              <div className="spin-center-btn-wrap">
                <button
                  className={`spin-center-btn ${!canSpin ? 'is-disabled' : ''} ${isSpinning ? 'is-spinning' : ''}`}
                  onClick={handleSpin}
                  disabled={!canSpin}
                  aria-label={isOnCooldown ? `Next spin in ${formatCountdown(countdownMs)}` : isSpinning ? 'Spinning' : 'Spin the wheel'}
                >
                  <span className="spin-btn-ring" aria-hidden="true" />
                  <span className="spin-btn-text">{isSpinning ? '...' : 'SPIN'}</span>
                </button>
              </div>
            </div>

            {/* Legend / odds - HUD style */}
            <div className="spin-legend" aria-label="Prize odds">
              <div className="legend-head">
                <span>PRIZE_TABLE</span>
                <span className="legend-head-meta">7 SEGMENTS // WEIGHTED</span>
              </div>
              <ul className="legend-list">
                {SEGMENTS.map((seg) => {
                  const active = revealed && displayedPrize?.id === seg.id;
                  return (
                    <li key={seg.id} className={`legend-row tier-${seg.tier} ${active ? 'is-active' : ''}`}>
                      <span className="legend-swatch" aria-hidden="true" style={{ background: segFill(seg), boxShadow: `0 0 6px ${tierGlow(seg.tier)}` }} />
                      <span className="legend-name">{seg.label}</span>
                      <span className="legend-odds">{seg.weight}%</span>
                      {active && <span className="legend-hit">◀ WIN</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Result / CTA area */}
          <div className="spin-result-area">
            {!revealed || !displayedPrize ? (
              <>
                <button
                  className={`spin-main-btn ${!canSpin ? 'is-disabled' : ''}`}
                  onClick={handleSpin}
                  disabled={!canSpin}
                >
                  <span className="spin-main-btn-ico" aria-hidden="true">↻</span>
                  {isSpinning ? 'SPINNING…' : 'SPIN THE WHEEL'}
                  {!isSpinning && <span className="spin-main-btn-sub">ONE SPIN / 24 HRS • LOCAL ONLY</span>}
                </button>
                <p className="spin-hint">No email required. Stored only on this device. No tracking.</p>
              </>
            ) : (
              <div className="spin-win-card" role="status" aria-live="polite">
                <div className="win-card-top">
                  <span className="win-badge">★ YOU WON</span>
                  <span className="win-tier">{displayedPrize.tier.toUpperCase()}</span>
                </div>
                <h3 className="win-prize">{displayedPrize.label}</h3>
                {displayedCode && (
                  <div className="win-code-row">
                    <span className="win-code-label">REDEMPTION CODE</span>
                    <code className="win-code">{displayedCode}</code>
                    <button
                      className="win-copy-btn"
                      onClick={async () => {
                        try { await navigator.clipboard.writeText(displayedCode); } catch { /* fallback */ }
                      }}
                      aria-label="Copy redemption code"
                    >
                      COPY
                    </button>
                  </div>
                )}
                <p className="win-instructions">Screenshot this and message me on Facebook or the contact form to redeem.</p>
                <div className="win-actions">
                  <a className="win-action win-action-primary" href="#contact" onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}>
                    Redeem via Contact <span aria-hidden="true">↗</span>
                  </a>
                  <a className="win-action" href="https://web.facebook.com/joed.devilla/" target="_blank" rel="noreferrer">Message on Facebook <span aria-hidden="true">↗</span></a>
                </div>
                {isOnCooldown ? (
                  <p key={tickKey} className="win-cooldown">Next spin available in <strong>{formatCountdown(countdownMs)}</strong></p>
                ) : (
                  <p className="win-cooldown">Cooldown ended — you can spin again.</p>
                )}
              </div>
            )}

            {isOnCooldown && revealed && (
              <p className="spin-cooldown-note" key={`note-${tickKey}`}>One spin per device per 24 hours. Your prize is saved locally.</p>
            )}
          </div>
        </div>

        <div className="spin-footer-meta">
          <span>JEDV // END PERK_STREAM</span>
          <span className="spin-footer-dot" aria-hidden="true" />
          <span>{new Date().getFullYear()} // REDEEMABLE ONCE PER PERK</span>
        </div>
      </div>
    </section>
  );
}

// SVG helpers: 0deg = 3 o'clock (east), positive clockwise (SVG standard)
function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const theta = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta) };
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const startPt = polarToCartesian(cx, cy, r, startDeg);
  const endPt = polarToCartesian(cx, cy, r, endDeg);
  const delta = endDeg - startDeg;
  const largeArc = delta > 180 ? 1 : delta < -180 ? 1 : 0;
  // sweep 1 = clockwise
  return [`M ${cx} ${cy}`, `L ${startPt.x} ${startPt.y}`, `A ${r} ${r} 0 ${largeArc} 1 ${endPt.x} ${endPt.y}`, 'Z'].join(' ');
}

function segFill(seg: Segment): string {
  // Moody palette — differentiate by luminance/border, not rainbow.
  // Use near-black bases with subtle tint per tier, keep cohesive.
  switch (seg.tier) {
    case 'jackpot': return '#1b1e1a'; // will have strong orange glow
    case 'mythic': return '#161b19';
    case 'legendary': return '#131818';
    case 'epic': return '#14181b';
    case 'rare': return '#131614';
    case 'uncommon': return '#111412';
    case 'common':
    default: return '#0f1210';
  }
}

function tierGlow(tier: Prize['tier']): string {
  switch (tier) {
    case 'jackpot': return '#ff6b3d';
    case 'mythic': return '#ff8c42';
    case 'legendary': return '#60d7e4';
    case 'epic': return '#c4ef55';
    case 'rare': return '#ff6b3d';
    case 'uncommon': return 'rgba(255,107,61,0.5)';
    case 'common':
    default: return 'rgba(255,107,61,0.22)';
  }
}
