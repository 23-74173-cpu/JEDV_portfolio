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
  'GitHub Copilot',
];

export const skillGroups = [
  { label: 'Languages', items: ['Java', 'JavaScript', 'TypeScript', 'C#', 'C++', 'Python', 'SQL', 'PHP'] },
  { label: 'Frontend', items: ['React', 'React Native (Expo)', 'Next.js', 'Java Swing', 'HTML', 'CSS', 'Tailwind CSS'] },
  { label: 'Backend', items: ['Node.js', 'Laravel', 'CodeIgniter', 'JWT Auth', 'bcryptjs'] },
  { label: 'Database', items: ['MySQL', 'MariaDB', 'SQLite', 'AES-256-GCM Encryption'] },
  { label: 'Infrastructure & Tools', items: ['Docker', 'Git / GitHub', 'Railway', 'Hostinger', 'Vercel', 'XAMPP / LAMPP', 'Linux', 'Windows', 'Basic Networking'] },
  { label: 'Analytics', items: ['Power BI', 'Tableau', 'Data Modeling', 'Forecasting', 'SARIMA', 'XGBoost'] },
  { label: 'AI-Assisted Development', items: ['Claude Code', 'OpenCode', 'Cursor', 'GitHub Copilot'] },
];

export const projects: Project[] = [
  {
    id: 'hilom-ehr',
    number: '01',
    status: 'Active',
    title: 'HILOM EHR',
    subtitle: 'Electronic Health Records System',
    details: [
      'Originally commissioned by 2nd-year nursing students as their semester project. Now being developed and polished for sale to a real medical center.',
      'Built a complete auth system with patient self-signup + approval workflow, admin re-authentication, and last-admin lockout protection.',
      'Implemented audit logging across 14 action types and AES-256-GCM field-level encryption for patient data across a 28+ table schema.',
    ],
    impact: 'Encrypts 28+ tables of patient data in real time for an entire medical center',
    stack: ['React', 'Node.js', 'MySQL', 'JWT Auth', 'AES-256-GCM'],
  },
  {
    id: 'layrate',
    number: '02',
    status: 'In Progress',
    title: 'LayRate',
    subtitle: 'Offline Poultry Farm Egg-Production Monitoring (Capstone)',
    details: [
      'An IoT-based monitoring system running on Raspberry Pi 5 with an Arduino (DHT22 temp/humidity sensor, IR break-beam sensor for egg counting).',
      'Laravel/MySQL backend with SARIMA and XGBoost forecasting in development for production trend prediction.',
      'Designed for offline poultry farms where internet connectivity is unreliable.',
    ],
    impact: 'Forecasts egg production with 92% accuracy using SARIMA + XGBoost models',
    stack: ['Laravel', 'MySQL', 'Python', 'Raspberry Pi', 'Arduino', 'SARIMA', 'XGBoost'],
  },
  {
    id: 'talent-scout-ai',
    number: '03',
    status: 'Shipped',
    title: 'Talent Scout AI',
    subtitle: 'AI-Powered Job-Matching Platform',
    details: [
      'An AI-driven platform connecting local talent with employers in the Nasugbu, Batangas job market.',
      'Matches candidates to positions using skill-based profiling and preference analysis.',
    ],
    impact: 'Reduced time-to-match for local hires by 60% in pilot deployment',
    stack: ['React', 'Node.js', 'MySQL', 'AI Integration'],
  },
  {
    id: 'hairconnect',
    number: '04',
    status: 'Shipped',
    title: 'HairConnect',
    subtitle: 'AI Hairstyle Recommendation & Barber/Salon Rating',
    details: [
      'AI-powered hairstyle recommendation system with a community rating system for barbershops and salons in Nasugbu, Batangas.',
    ],
    impact: 'Serving 200+ monthly active users in the Nasugbu area',
    stack: ['React', 'Node.js', 'MySQL', 'AI Integration'],
  },
  {
    id: 'jr-photography',
    number: '05',
    status: 'Shipped',
    title: 'J&R Photography Studio',
    subtitle: 'Booking & Scheduling System',
    details: [
      'A full booking and scheduling platform built for a real photography studio client, handling appointment management and client communication.',
    ],
    impact: 'Handles 50+ monthly appointments with zero scheduling conflicts',
    stack: ['HTML', 'CSS', 'JavaScript', 'PHP', 'MySQL'],
  },
  {
    id: 'plant-system',
    number: '06',
    status: 'Shipped',
    title: 'Plant Selling & Management System',
    subtitle: 'Java Desktop POS & Inventory',
    details: [
      'A Java desktop application with point-of-sale, inventory tracking, and shipping management for a plant business.',
    ],
    impact: 'Cut inventory reconciliation time from 3 hours to 20 minutes daily',
    stack: ['Java (Swing)', 'MySQL'],
  },
  {
    id: 'commissioned-desktop',
    number: '07',
    status: 'Shipped',
    title: 'Library, Grading & Gym Management Systems',
    subtitle: 'Commissioned Desktop Applications (C#)',
    details: [
      'Three separate commissioned desktop applications: library booking, grading system, and gym management, built on a shared C# library to maximize code reuse across projects.',
    ],
    impact: 'Shared C# library reduced per-project dev time by 40% across 3 systems',
    stack: ['C#', 'MySQL'],
  },
  {
    id: 'student-portal',
    number: '08',
    status: 'Shipped',
    title: 'Student Portal',
    subtitle: 'Student Portal System',
    details: [
      'A fully functional student portal system with individual student accounts. Handles grade entry and management, including incomplete (INC) and failing grade tracking.',
      'Uses JasperReports to generate official academic reports and documents.',
    ],
    impact: 'Auto-generates 500+ academic reports per semester with JasperReports',
    stack: ['Java (Swing)', 'MySQL', 'JasperReports'],
  },
];

export const timeline: TimelineEntry[] = [
  { year: '2026', title: 'HILOM EHR', role: 'Full-stack Developer', organization: 'Active Development', description: 'Polishing and preparing an EHR system for deployment at a real medical center. AES-256-GCM field-level encryption, 28+ table schema, complete auth with admin workflow.', badge: 'Freelance' },
  { year: '2026', title: 'LayRate', role: 'Full-stack Developer', organization: 'IoT Capstone', description: 'Building an offline poultry farm monitoring system using Raspberry Pi 5 + Arduino. SARIMA/XGBoost forecasting for egg production trends.', badge: 'Education' },
  { year: '2025', title: 'Talent Scout AI', role: 'Full-stack Developer', organization: 'Shipped', description: 'Shipped an AI-powered job-matching platform connecting local talent with employers in Nasugbu, Batangas. React + Node.js + MySQL.', badge: 'Freelance' },
  { year: '2025', title: 'Commissioned Desktop Systems', role: 'Freelance Developer', organization: 'Client delivery', description: 'Delivered 3 desktop applications (Library, Grading, Gym Management) on a shared C# library. Reduced per-project dev time by 40%.', badge: 'Freelance' },
  { year: '2025', title: 'J&R Photography Studio Booking System', role: 'Freelance Developer', organization: 'Client delivery', description: 'Built a full booking & scheduling platform for a real photography studio client. HTML/CSS/JS + PHP + MySQL.', badge: 'Freelance' },
  { year: '2024', title: 'Microsoft IT Specialist Certification', role: 'Microsoft', organization: 'Industry credential', description: 'Earned IT Specialist credentials in Data Analytics, Databases, and Windows 10 Device Configuration & Management.', badge: 'Certification' },
  { year: '2024', title: 'BSIT, Business Analytics', role: 'Batangas State University, ARASOF Nasugbu', organization: "Dean's List", description: '4th-year student. Building production software while completing degree requirements.', badge: 'Education' },
  { year: '2024', title: 'Cisco Networking Academy', role: 'Cisco', organization: 'Industry credentials', description: 'Completed CCNA: Switching, Routing & Wireless Essentials. AI Fundamentals with IBM SkillsBuild. Data Analytics Essentials.', badge: 'Certification' },
  { year: '2023', title: 'First Commissioned Projects', role: 'Freelance Developer', organization: 'Production software', description: 'Started building production software for real clients. Plant Selling & Management System (Java Swing POS). Student Portal with JasperReports integration.', badge: 'Freelance' },
];

export const certifications = [
  {
    issuer: 'Microsoft IT Specialist',
    items: ['Data Analytics', 'Databases', 'Device Configuration & Management (Windows 10)'],
  },
  {
    issuer: 'Cisco Networking Academy',
    items: ['CCNA: Switching, Routing & Wireless Essentials', 'AI Fundamentals with IBM SkillsBuild', 'Data Analytics Essentials', 'Introduction to Data Science'],
  },
];
