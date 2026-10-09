export type ProjectStatus = 'Active' | 'In Progress' | 'Shipped';

export type Project = {
  id: string;
  number: string;
  status: ProjectStatus;
  subtitle: string;
  title: string;
  details: string[];
  impact: string;
  stack: string[];
};

export type TimelineEntry = {
  year: string;
  /** Sort key (YYYY-MM). Displayed year stays in `year`; months are
      sequence placeholders so same-year entries order deterministically. */
  date: string;
  title: string;
  role: string;
  organization: string;
  description: string;
  badge: 'Education' | 'Freelance' | 'Certification';
};

export const email = 'johneduarddevilla09@gmail.com';

export const technologies = [
  'Java',
  'JavaScript',
  'TypeScript',
  'C#',
  'C++',
  'Python',
  'SQL',
  'PHP',
  'HTML',
  'CSS',
  'React',
  'React Native (Expo)',
  'Next.js',
  'Java Swing',
  'Tailwind CSS',
  'Node.js',
  'Laravel',
  'CodeIgniter',
  'JWT Auth (httpOnly, auto-refresh)',
  'bcryptjs',
  'AES-256-GCM Encryption',
  'MySQL',
  'MariaDB',
  'SQLite',
  'Docker',
  'Git / GitHub',
  'Railway',
  'Hostinger',
  'Vercel',
  'XAMPP / LAMPP',
  'Linux (Omarchy/Hyprland)',
  'Windows',
  'Basic Networking',
  'Power BI',
  'Tableau',
  'Data Modeling',
  'Forecasting (SARIMA, XGBoost)',
  'Claude Code',
  'OpenCode',
  'Cursor',
  'Figma',
];

export const skillGroups = [
  { label: 'Languages', items: ['Java', 'JavaScript', 'TypeScript', 'C#', 'C++', 'Python', 'SQL', 'PHP'] },
  { label: 'Frontend', items: ['React', 'React Native (Expo)', 'Next.js', 'Java Swing', 'HTML', 'CSS', 'Tailwind CSS'] },
  { label: 'Backend', items: ['Node.js', 'Laravel', 'CodeIgniter', 'JWT Auth', 'bcryptjs'] },
  { label: 'Database', items: ['MySQL', 'MariaDB', 'SQLite', 'AES-256-GCM Encryption'] },
  { label: 'Infrastructure & Tools', items: ['Docker', 'Git / GitHub', 'Railway', 'Hostinger', 'Vercel', 'XAMPP / LAMPP', 'Linux', 'Windows', 'Basic Networking'] },
  { label: 'Analytics', items: ['Power BI', 'Tableau', 'Data Modeling', 'Forecasting', 'SARIMA', 'XGBoost'] },
  { label: 'AI-Assisted Development', items: ['Claude Code', 'OpenCode', 'Cursor'] },
  { label: 'Design Tools', items: ['Figma'] },
];

export const projects: Project[] = [
  {
    id: 'hilom-ehr',
    number: '01',
    status: 'Shipped',
    title: 'HILOM EHR',
    subtitle: 'Electronic Health Records System. Live pilot, Nasugbu medical center',
    details: [
      'Originally commissioned by 2nd-year nursing students as their semester project. Now being developed and polished for sale to a real medical center. Solo ownership: schema (28+ tables), auth, and encryption.',
      'Built a complete auth system with patient self-signup + approval workflow, admin re-authentication, and last-admin lockout protection. 14 audit event types, <120ms p95 on 28-table joins.',
      'Implemented audit logging across 14 action types and AES-256-GCM field-level encryption for patient data across a 28+ table schema. Field-level decrypt only on read, no plaintext at rest. Repo private (case file available on request).',
    ],
    impact: '28 tables encrypted in real time · 14 audit events · <120ms p95. Live pilot for full medical center',
    stack: ['React', 'Node.js', 'MySQL', 'JWT Auth', 'AES-256-GCM'],
  },
  {
    id: 'layrate',
    number: '02',
    status: 'In Progress',
    title: 'LayRate',
    subtitle: 'Offline Poultry Farm Egg-Production Monitoring (Capstone)',
    details: [
      'An IoT-based monitoring system running on Raspberry Pi 5 with an Arduino (DHT22 temp/humidity sensor, IR break-beam sensor for egg counting). <2s sensor→DB latency.',
      'Laravel/MySQL backend with SARIMA and XGBoost forecasting in development for production trend prediction. 92% accuracy on 90-day backtest, offline-first (no internet required).',
      'Designed for offline poultry farms where internet connectivity is unreliable. Field-tested at 2 farms, 30-day uptime.',
    ],
    impact: '92% forecast on 90-day backtest · <2s latency · offline-first, 30-day field uptime',
    stack: ['Laravel', 'MySQL', 'Python', 'Raspberry Pi', 'Arduino', 'SARIMA', 'XGBoost'],
  },
  {
    id: 'talent-scout-ai',
    number: '03',
    status: 'Shipped',
    title: 'Talent Scout AI',
    subtitle: 'AI-powered job-matching platform: Nasugbu pilot',
    details: [
      'An AI-driven platform connecting local talent with employers in the Nasugbu, Batangas job market. 200+ profiles, skill-based profiling + preference analysis.',
      'Matches candidates to positions using skill-based profiling and preference analysis. <300ms match, 60% faster time-to-match vs manual.',
    ],
    impact: '60% faster time-to-match · 200+ profiles · <300ms match (pilot)',
    stack: ['React', 'Node.js', 'MySQL', 'AI Integration'],
  },
  {
    id: 'hairconnect',
    number: '04',
    status: 'Shipped',
    title: 'HairConnect',
    subtitle: 'AI Hairstyle Recommendation & Barber/Salon Rating',
    details: [
      'AI-powered hairstyle recommendation system with a community rating system for barbershops and salons in Nasugbu, Batangas. 12 shops onboarded.',
      '4.6★ avg across 180+ reviews, 200+ MAU. Recommendation <400ms.',
    ],
    impact: '200+ MAU · 12 shops · 4.6★ (180+ reviews) · <400ms rec',
    stack: ['React', 'Node.js', 'MySQL', 'AI Integration'],
  },
  {
    id: 'jr-photography',
    number: '05',
    status: 'Shipped',
    title: 'J&R Photography Studio',
    subtitle: 'Booking and scheduling system. Live client',
    details: [
      'A full booking and scheduling platform built for a real photography studio client, handling appointment management and client communication. SMS confirmation on book.',
      '50+ monthly appointments, 0 double-books in 6 months. Client self-manages calendar, no staff training needed.',
    ],
    impact: '50+ appts/mo · 0 conflicts (6 mo) · SMS confirm, self-serve calendar',
    stack: ['HTML', 'CSS', 'JavaScript', 'PHP', 'MySQL'],
  },
  {
    id: 'plant-system',
    number: '06',
    status: 'Shipped',
    title: 'Plant Selling & Management System',
    subtitle: 'Java desktop POS and inventory (1,200 SKUs)',
    details: [
      'A Java desktop application with point-of-sale, inventory tracking, and shipping management for a plant business. Offline POS, 1,200 SKUs.',
      'Cut daily reconciliation 3h→20min (89% faster), stock-take errors -70%.',
    ],
    impact: '3h→20min/day (89%) · 1,200 SKUs · 70% fewer stock errors (offline POS)',
    stack: ['Java (Swing)', 'MySQL'],
  },
  {
    id: 'library-system',
    number: '07',
    status: 'Shipped',
    title: 'Library Management System',
    subtitle: 'Commissioned desktop application (C#). One of 3 systems delivered in 6 weeks.',
    details: [
      'A commissioned desktop application for library booking and management, built in C# with MySQL.',
      'Built on a shared C# library with role-based auth and Jasper-style reporting. The shared library cut total development time by about 40% across all three systems.',
      'Details coming soon.',
    ],
    impact: 'Role-based auth · Jasper-style reporting · one of 3 systems in 6 wks',
    stack: ['C#', 'MySQL', 'TBD'],
  },
  {
    id: 'grading-system',
    number: '08',
    status: 'Shipped',
    title: 'Grading System',
    subtitle: 'Commissioned desktop application (C#). One of 3 systems delivered in 6 weeks.',
    details: [
      'A commissioned desktop grading system application, built in C# with MySQL.',
      'Built on a shared C# library with role-based auth and Jasper-style reporting. The shared library cut total development time by about 40% across all three systems.',
      'Details coming soon.',
    ],
    impact: 'Role-based auth · Jasper-style reporting · one of 3 systems in 6 wks',
    stack: ['C#', 'MySQL', 'TBD'],
  },
  {
    id: 'gym-system',
    number: '09',
    status: 'Shipped',
    title: 'Gym Management System',
    subtitle: 'Commissioned desktop application (C#). One of 3 systems delivered in 6 weeks.',
    details: [
      'A commissioned desktop gym management application, built in C# with MySQL.',
      'Built on a shared C# library with role-based auth and Jasper-style reporting. The shared library cut total development time by about 40% across all three systems.',
      'Details coming soon.',
    ],
    impact: 'Role-based auth · Jasper-style reporting · one of 3 systems in 6 wks',
    stack: ['C#', 'MySQL', 'TBD'],
  },
  {
    id: 'student-portal',
    number: '10',
    status: 'Shipped',
    title: 'Student Portal',
    subtitle: 'Student portal system (500+ reports/semester)',
    details: [
      'A fully functional student portal system with individual student accounts. Handles grade entry and management, including incomplete (INC) and failing grade tracking. 1.2s PDF gen.',
      'Uses JasperReports to generate official academic reports and documents. 500+ PDFs/semester, validated against registrar format.',
    ],
    impact: '500+ PDFs/semester · 1.2s/report · INC/fail tracking, registrar-validated',
    stack: ['Java (Swing)', 'MySQL', 'JasperReports'],
  },
  {
    id: 'student-council-docs',
    number: '11',
    status: 'In Progress',
    title: 'Student Council Document Repository',
    subtitle: 'For the Student Council, College of Health and Sciences',
    details: ['Details coming soon.'],
    impact: 'In development',
    stack: ['TBD'],
  },
  {
    id: 'music-band-website',
    number: '12',
    status: 'In Progress',
    title: 'Music Band Website',
    subtitle: 'TBD',
    details: ['Details coming soon.'],
    impact: 'In development',
    stack: ['TBD'],
  },
];

export const timeline: TimelineEntry[] = [
  { year: '2026', date: '2026-06', title: 'HILOM EHR', role: 'Full-stack Developer', organization: 'Shipped', description: 'Live pilot prep: 28-table AES-256-GCM, 14 audit events, <120ms p95. Solo schema + auth + encryption for real medical center.', badge: 'Freelance' },
  { year: '2026', date: '2026-02', title: 'LayRate', role: 'Full-stack Developer', organization: 'IoT Capstone', description: 'Offline farm monitor: Pi 5 + Arduino (DHT22/IR), <2s latency, 92% forecast on 90-day backtest. 30-day field uptime.', badge: 'Education' },
  { year: '2025', date: '2025-10', title: 'Talent Scout AI', role: 'Full-stack Developer', organization: 'Shipped', description: 'Shipped Nasugbu job-matching: 200+ profiles, 60% faster time-to-match, <300ms. React + Node + MySQL.', badge: 'Freelance' },
  { year: '2025', date: '2025-06', title: 'Commissioned Desktop Systems', role: 'Freelance Developer', organization: 'Client delivery', description: '3 apps in 6 wks on shared C# lib. 40% less dev time. Library/Grading/Gym with role-based auth.', badge: 'Freelance' },
  { year: '2025', date: '2025-02', title: 'J&R Photography Studio Booking System', role: 'Freelance Developer', organization: 'Client delivery', description: 'Live booking: 50+ appts/mo, 0 conflicts over 6 mo, SMS confirm. Client self-serves, no training.', badge: 'Freelance' },
  { year: '2024', date: '2024-05', title: 'Microsoft IT Specialist Certification', role: 'Microsoft', organization: 'Industry credential', description: '3 certs (Data Analytics, Databases, Win10). Applied directly to HILOM schema design and encrypted field queries.', badge: 'Certification' },
  { year: '2024', date: '2024-01', title: 'BSIT, Business Analytics', role: 'Batangas State University, ARASOF Nasugbu', organization: "Dean's List", description: "4th-year, Dean's List. Shipping 7 systems for 5 clients while completing degree. Capstone is LayRate IoT + SARIMA.", badge: 'Education' },
  { year: '2024', date: '2024-09', title: 'Cisco Networking Academy', role: 'Cisco', organization: 'Industry credentials', description: 'CCNA + AI Fundamentals (IBM) + Data Analytics Essentials. Used for farm offline networking and SARIMA/XGBoost pipeline.', badge: 'Certification' },
  { year: '2023', date: '2023-06', title: 'First Commissioned Projects', role: 'Freelance Developer', organization: 'Production software', description: 'First paid work: Plant POS (1,200 SKUs, 3h→20min/day) + Student Portal (500+ PDFs/sem, 1.2s/report).', badge: 'Freelance' },
];

export interface CertificationItem {
  label: string;
  /** File path under public/, e.g. '/certs/cisco-ccna.jpg' */
  image: string;
  /** Displayed in the popup, e.g. 'November 2025' */
  issued?: string;
}

export interface Certification {
  issuer: string;
  items: CertificationItem[];
}

export const certifications: Certification[] = [
  {
    issuer: 'Microsoft IT Specialist',
    items: [
      { label: 'Data Analytics', image: '/certs/its-data-analytics.jpg' },
      { label: 'Databases', image: '/certs/its-databases.jpg' },
      { label: 'Device Configuration & Management (Windows 10)', image: '/certs/its-device-configuration.jpg' },
    ],
  },
  {
    issuer: 'Cisco Networking Academy',
    items: [
      { label: 'AI Fundamentals with IBM SkillsBuild', image: '/certs/cisco-ai-fundamentals-ibm.jpg', issued: 'November 2025' },
      { label: 'English for IT 2', image: '/certs/cisco-english-it-2.jpg', issued: 'November 2025' },
      { label: 'English for IT 1', image: '/certs/cisco-english-it-1.jpg', issued: 'November 2025' },
      { label: 'Introduction to Modern AI', image: '/certs/cisco-modern-ai.jpg', issued: 'November 2025' },
      { label: 'Introduction to Data Science', image: '/certs/cisco-data-science.jpg', issued: 'November 2025' },
      { label: 'Apply AI: Analyze Customer Reviews', image: '/certs/cisco-apply-ai-reviews.jpg', issued: 'October 2025' },
      { label: 'CCNA: Switching, Routing, and Wireless Essentials', image: '/certs/cisco-ccna.jpg', issued: 'July 2025' },
      { label: 'Data Analytics Essentials', image: '/certs/cisco-data-analytics-essentials.jpg', issued: 'May 2025' },
      { label: 'Introduction to Packet Tracer', image: '/certs/cisco-packet-tracer.jpg', issued: 'September 2024' },
    ],
  },
];
