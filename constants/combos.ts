import { ComboGroup } from '@/@types/combo.type';

// Wired into components/ComboMeter.tsx. Skill names are drawn from the real
// resume; proofProjectIds point at real ids in constants/projects.ts. A skill
// with no matching project renders "unlit" — that's an honest signal, not a
// bug, until a real project backs it.
export const combos: ComboGroup[] = [
  {
    id: 'frontend-combo',
    label: 'Frontend Combo',
    skills: [
      { name: 'React', proficiency: 90, proofProjectIds: ['dnd-dynamic-tree', 'serious', 'vampire', 'knowbuild'] },
      { name: 'Next.js', proficiency: 90, proofProjectIds: ['maan', 'serious', 'cryptocat', 'arnomis', 'BEMO', 'amala-earth', 'freelance-engagements'] },
      { name: 'TypeScript', proficiency: 85, proofProjectIds: ['maan', 'arnomis', 'BEMO', 'knowbuild'] },
      { name: 'TailwindCSS', proficiency: 85, proofProjectIds: ['maan', 'arnomis', 'BEMO', 'knowbuild', 'amala-earth'] },
      { name: 'JavaScript', proficiency: 90, proofProjectIds: ['cryptocat'] },
      { name: 'HTML/CSS/SCSS', proficiency: 85, proofProjectIds: ['cryptocat'] },
      { name: 'Redux Toolkit', proficiency: 85, proofProjectIds: ['knowbuild', 'amala-earth'] },
      { name: 'Redux', proficiency: 70, proofProjectIds: ['serious', 'vampire'] },
      { name: 'TanStack Query', proficiency: 75, proofProjectIds: ['knowbuild'] },
      { name: 'Framer Motion', proficiency: 85, proofProjectIds: ['amala-earth', 'freelance-engagements'] },
      { name: 'GSAP', proficiency: 65, proofProjectIds: ['freelance-engagements'] },
      { name: 'Vite', proficiency: 75, proofProjectIds: ['knowbuild'] },
      { name: 'React Native / Expo', proficiency: 75, proofProjectIds: ['freelance-engagements'] },
      { name: 'shadcn/ui', proficiency: 80, proofProjectIds: ['knowbuild', 'amala-earth'] },
      { name: 'Micro Frontends', proficiency: 70, proofProjectIds: ['amala-earth'] },
      { name: 'Storybook', proficiency: 65, proofProjectIds: ['freelance-engagements'] },
      { name: 'three.js', proficiency: 40, proofProjectIds: [] },
      { name: 'Zustand', proficiency: 60, proofProjectIds: [] },
      { name: 'Bootstrap', proficiency: 60, proofProjectIds: [] },
    ],
  },
  {
    id: 'systems-combo',
    label: 'Systems Combo',
    skills: [
      { name: 'Node.js', proficiency: 80, proofProjectIds: ['arnomis'] },
      { name: 'Prisma', proficiency: 75, proofProjectIds: ['maan', 'BEMO'] },
      { name: 'MongoDB', proficiency: 75, proofProjectIds: ['niva-bupa'] },
      { name: 'Mongoose', proficiency: 70, proofProjectIds: ['arnomis'] },
      { name: 'Socket.IO', proficiency: 65, proofProjectIds: ['serious'] },
      { name: 'Docker / Kubernetes', proficiency: 75, proofProjectIds: ['niva-bupa'] },
      { name: 'Nginx', proficiency: 65, proofProjectIds: ['niva-bupa'] },
      { name: 'CI/CD Pipelines', proficiency: 70, proofProjectIds: ['knowbuild', 'niva-bupa'] },
      { name: 'Python', proficiency: 60, proofProjectIds: ['hardware-prototypes'] },
      { name: 'PostgreSQL', proficiency: 60, proofProjectIds: [] },
      { name: 'Express.js', proficiency: 65, proofProjectIds: [] },
      { name: 'Django', proficiency: 50, proofProjectIds: [] },
      { name: 'Firebase', proficiency: 60, proofProjectIds: [] },
      { name: 'PM2', proficiency: 50, proofProjectIds: [] },
    ],
  },
  {
    id: 'ai-combo',
    label: 'AI Combo',
    skills: [
      { name: 'OpenAI', proficiency: 80, proofProjectIds: ['maan', 'vampire', 'serious'] },
      { name: 'Langchain', proficiency: 65, proofProjectIds: ['maan'] },
      { name: 'Vector Databases', proficiency: 65, proofProjectIds: ['maan'] },
      { name: 'Edge AI', proficiency: 60, proofProjectIds: ['hardware-prototypes'] },
      { name: 'AI Agents', proficiency: 60, proofProjectIds: [] },
      { name: 'Hugging Face', proficiency: 55, proofProjectIds: [] },
    ],
  },
  {
    id: 'maker-combo',
    label: 'Maker Combo',
    skills: [
      { name: 'Arduino', proficiency: 65, proofProjectIds: ['hardware-prototypes'] },
      { name: 'Raspberry Pi', proficiency: 65, proofProjectIds: ['hardware-prototypes'] },
      { name: 'Figma', proficiency: 75, proofProjectIds: [] },
      { name: 'Rive', proficiency: 60, proofProjectIds: [] },
      { name: 'Blender', proficiency: 55, proofProjectIds: [] },
      { name: 'Spline', proficiency: 55, proofProjectIds: [] },
      { name: 'After Effects', proficiency: 50, proofProjectIds: [] },
      { name: 'Illustrator / Photoshop', proficiency: 60, proofProjectIds: [] },
    ],
  },
];

export default combos;
