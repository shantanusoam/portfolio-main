import dooit_cover from '@/public/dooit_cover.png';
import dooit_screenshot from '@/public/dooit_screenshot.png';
import dooit_screenshot_2 from '@/public/dooit_screenshot_2.png';
import joey_jumps_cover from '@/public/joey_jumps_cover.png';
import joey_jumps_screenshot from '@/public/joey_jumps_screenshot.png';

import maan from '@/public/maan.png';
import vampire from '@/public/vampire.png';
import vampire2 from '@/public/vampire2.png';
import cryptocat_cover from '@/public/cryptocat.png';
import cryptocat_screenshot2 from '@/public/cryptocat2.png';
import cryptocat_screenshot1 from '@/public/cryptocat1.png';
import cryptocat_screenshot0 from '@/public/cryptocat0.jpg';
import serious_cover from '@/public/serious1.png';
import SeriousScreenshot7 from '@/public/serious0.png';

import SeriousScreenshot0 from '@/public/serious1.png';
import SeriousScreenshot1 from '@/public/serious2.png';
import SeriousScreenshot2 from '@/public/serious3.png';
import SeriousScreenshot3 from '@/public/serious4.png';
import SeriousScreenshot5 from '@/public/serious5.png';
import SeriousScreenshot6 from '@/public/serious6.png';
import SeriousScreenshot4 from '@/public/serious7.png';
import DndCover from '@/public/dnd-kit-folder.png';
import Dndscreenshot from '@/public/dnd-drag.png';

import arnomis_cover from '@/public/arnomis0.png';
import arnomis_screenshot0 from '@/public/arnomis2.png';

import Bemo_cover from '@/public/BemoCover.png';
import Bemo_screenshot0 from '@/public/Bemo.png';
arnomis_cover;

export const projects = [

  {
    id: 'dnd-dynamic-tree',
    title: 'dnd-dynamic-tree',
    metadata: ['NPM Library'],
    cover_image: DndCover,
    screenshots: [DndCover, Dndscreenshot],
    description:
      'dnd NPM Library for nth level D&D with Custom trigger, Custom drag, auto-positioning',
    url: '/projects/dnd-dynamic-tree',
    features: [
      'Custom trigger element',
      'Custom drag Element.',
      'Multi nth level submenu support',
      'Automatic State update and Postion generation',
      'Auto positioning of each dnd-item',
      'Enhanced user interactions with auto-positioning for each DnD item, utilizing comprehensive DnD-kit helpers.',
    ],
    skills: {
      Frontend: ['Storybook', 'React'],
      Bundler: ['Webpack', 'Vite', 'babel', 'tsconfig', 'rollup'],
    },
    liveLink: 'https://www.npmjs.com/package/dnd-dynamic-tree',
    codeLink: 'https://github.com/shantanusoam/dnd-dynamic-tree',
  },
  {
    id: 'maan',
    title: 'MAAN',
    metadata: ['Utility'],
    cover_image: maan,
    screenshots: [maan, maan],
    description:
      'A Journal Entry App With Integrated AI - and a Freind (Themed Hello Kitty 😸)',
    url: '/projects/maan',
    features: [
      'The application allows users to log in and manage journal entries.',
      'The entries are analyzed and given an AI-generated sentiment value, summary, and color.',
      'U can also ask and search from whole entry arabatereley while asking casually using LLM',
      'Get Graph Based results of user sentimental score throughout whole month',
      'End-End Encryption With Encrypted notes and in app storage',
    ],
    skills: {
      Backend: ['NestJS', 'TypeScript', 'Prisma', 'Longchain', 'PlanetScale'],
      Frontend: ['NextJS', 'Tailwind CSS'],
      Others: ['Open-AI'],
    },
    liveLink: 'https://maan-ten.vercel.app/',
    codeLink: 'https://github.com/shantanusoam/maan',
  },

  {
    id: 'cryptocat',
    title: 'Crypto Cat',
    metadata: ['NFT Marketplace'],
    cover_image: cryptocat_cover,
    screenshots: [
      cryptocat_screenshot0,
      cryptocat_screenshot1,
      cryptocat_screenshot2,
    ],
    url: '/projects/cryptocat',
    description: 'NFT Marketplace for sellings cat like.',
    features: [
      'No libraries used. No gimmicks. Just plain old HTML, CSS and JS.',
      'Amazing sprite animations.',
    ],
    problem: 'Challenged myself to make a Crypto app during boom.',
    solution: 'Achieved this by using Web3 blockchain Solidity',
    skills: { Frontend: ['Web3', 'blockchain ', 'Next.js', 'Solidity'] },
    liveLink: 'https://fvampire.netlify.app/',
    codeLink: 'https://github.com/shantanusoam/CryptoCat/tree/master',
  },
  {
    id: 'serious',
    title: 'Seriousblack',
    url: '/projects/serious',
    cover_image: serious_cover,
    screenshots: [
      SeriousScreenshot0,
      SeriousScreenshot7,
      SeriousScreenshot1,
      SeriousScreenshot2,
      SeriousScreenshot3,
      SeriousScreenshot4,
      SeriousScreenshot5,
      SeriousScreenshot6,
    ],
    description: 'A modern StackOverflow clone.',
    metadata: ['Social'],
    features: [
      'A recommendation system for posts',
      'Badge & Reputation System',
      ' Views and Voting Mechanism',
      ' Filter and Pagination for almost all pages',
      'Global database data-fetching',
      ' AI generated answers to questions',
    ],
    skills: {
      Backend: ['Nextjs', 'OPEN-Ai', 'Socket.IO'],
      Frontend: ['Nextjs', 'Redux'],
    },
    liveLink: 'https://dev-overflow-lilac.vercel.app/',
    codeLink: 'https://github.com/shantanusoam/CryptoCat/tree/master',
  },
  {
    id: 'vampire',
    title: 'Vampire',
    metadata: ['Entertainment', 'Utility'],
    cover_image: vampire,
    screenshots: [vampire2],
    description: 'Filmpire a Movie recommending Website',
    url: '/projects/vampire',
    features: [
      'The application allows users to Search diffrent Movies, stars, category and much more.',
    ],
    skills: {
      Frontend: ['Reactjs', ' Redux,', ' Material UI', 'Alan AI'],
      Others: ['Open-AI'],
    },
    liveLink: 'https://fvampire.netlify.app/',
    codeLink: 'https://github.com/shantanusoam/Vampire',
  },
  {
    id: 'arnomis',
    title: 'arnomis',
    url: '/projects/arnomis',
    cover_image: arnomis_cover,
    screenshots: [arnomis_screenshot0],
    description:
      'arnomis project, a comprehensive solution for tracking product prices on Amazon.',
    metadata: ['Utility'],
    features: [
      'This project is designed to scrape product details from Amazon, store the data in a MongoDB database, and send email notifications to users when there are changes in the product details. The project includes a web application with a user-friendly interface that allows users to search for products, view product details, and subscribe to product updates.',
    ],
    skills: {
      Backend: ['Mongoose', 'Nodemailer'],
      Frontend: ['Next', 'Tailwind ', 'TypeScript'],
    },
    liveLink: 'https://github.com/shantanusoam/arnomis',
    codeLink: 'https://github.com/shantanusoam/arnomis',
  },
  {
    id: 'BEMO',
    title: 'BEMO',
    url: '/projects/bemo',
    cover_image: Bemo_cover,
    screenshots: [Bemo_cover, Bemo_screenshot0],
    description:
      'A task Managment App to manage projects that i been working on',
    metadata: ['Utility'],
    features: [
      'A task Managment App to manage projects and task in those project while tracking progress of each project',
    ],
    skills: {
      Backend: ['prisma', 'Next'],
      Frontend: ['Next', 'Tailwind ', 'TypeScript'],
    },
    liveLink: 'https://github.com/shantanusoam/BeMO--TaskManager--',
    codeLink: 'https://github.com/shantanusoam/BeMO--TaskManager--',
  },
];
