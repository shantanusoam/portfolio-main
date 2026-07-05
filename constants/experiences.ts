import { ExperienceType } from "@/@types/experience.type";
import KalGroup from "@/public/KalGroup.webp";
import Mobikasa from "@/public/mobikasa.png"
import TheTarzanWay from "@/public/TheTarzanWay.webp"
import KnowbuildLogo from "@/public/knowbuild-logo.svg";
import NivaBupaLogo from "@/public/nivabupa-logo.svg";

export const yearsOfExperience =
  (new Date().getTime() - new Date("2021-04-02").getTime()) /
  (1000 * 60 * 60 * 24 * 365);

export const experiences: ExperienceType[] = [

  {
    company: "Knowbuild",
    companyLink: "https://www.knowbuild.com",
    companyLogo: KnowbuildLogo,
    roles: [
      {
        role: "Staff Engineer / Senior Software Developer",
        // Resume only specifies "2025 - Present" with no start month; the
        // empty month string intentionally suppresses the date line below
        // rather than guessing an exact month.
        from: {
          month: "",
          year: 2025,
        },
        to: {
          month: "Current",
        },
        type: "Full time",
      },
    ],
    summary: [
      "Led brownfield modernization of a legacy CRM/ERP UI, migrating from Bootstrap/SCSS/Axios to React + TypeScript + Tailwind + shadcn/ui, enabling incremental rollout with minimal business disruption.",
      "Designed a multi-tenant architecture with subdomain-based isolation (company.app.com), secure tenant context resolution using headers, and tenant-specific routing, increasing onboarding speed for new clients and improving data security by preventing cross-tenant access.",
      "Engineered an RBAC and permissions platform with a custom PermissionEngine (resource-level rules, inheritance, dynamic checks), integrating permission-based routing guards that prevented unauthorized access and streamlined compliance audits.",
      "Re-architected state management to TanStack Query (server state) + Redux Toolkit (UI state), reducing redundant API calls by ~40% and eliminating cross-tab/state inconsistency.",
      "Drove performance and build engineering using Vite (code splitting, bundle analysis, perf budgets, console stripping) and implemented virtualization (@tanstack/react-virtual) for large tables (10k+ rows), ensuring smooth scrolling on low-end devices.",
      "Built CI/CD & deployment automation with atomic bash + rsync pipelines and multi-env config (local/staging wildcard subdomains/prod), supporting safer, repeatable releases.",
    ],
  },
  {
    company: "Niva Bupa Health Insurance (via Cognizant/Shephertz)",
    companyLink: "https://www.nivabupa.com",
    companyLogo: NivaBupaLogo,
    roles: [
      {
        role: "Senior Software Engineer",
        from: {
          month: "FEB",
          year: 2025,
        },
        to: {
          month: "AUG",
          year: 2025,
        },
        type: "Full time",
      },
    ],
    summary: [
      "Drove a performance overhaul of legacy MongoDB clusters by cleaning obsolete build artifacts, adding strategic indexes, and scheduling nightly housekeeping jobs, reducing query latency by over 30% during peak policy-lookup traffic.",
      "Implemented SSO and two-factor authentication with IP whitelisting and 45-day password rotation; led a vulnerability audit that patched XSS/CSRF vectors in agent portals, passed external penetration tests on the first run, resolved 15+ critical vulnerabilities, and achieved 100% compliance with healthcare data protection standards.",
      "Containerized a monolithic React codebase with Docker, orchestrated via Kubernetes and Nginx ingress, enabling blue-green deployments and reducing rollback time from 20 minutes to under 5 minutes.",
    ],
  },
  {
    company: "Mobikasa",
    companyLink: "https://www.linkedin.com/company/thetarzanway/",
    companyLogo: Mobikasa,
    roles: [
      {
        role: "Senior Frontend Developer",
        from: {
          month: "OCT",
          year: 2023,
        },
        to: {
          month: "FEB",
          year: 2025,
        },
        type: "Full time",
      },
    ],
    summary: [
      "Led the development of a Next.js e-commerce application with a microservice-based architecture in a monorepo, serving both admin and user-facing sites, using SSR and SWR for optimized performance and SEO.",
      "Led development of a comprehensive CMS and e-commerce application for Amala Earth, replicating Shopify's functionality, using Micro Frontend Architecture. Implemented an n-nested drag-and-drop variant builder and real-time editing/deletion features.",
      "Abstracted complex logic and state management by implementing RTK and RTK Query throughout the application, reducing code complexity by 25% and increasing team productivity by 10%.",
      "Designed and developed a reusable component library using ShadCN and Tailwind with CVA and Framer Motion — dynamic tables, comboboxes, tooltips, trees, timelines, and multi-image selectors — boosting developer productivity by 10% and reducing code duplication by 15%.",
      "Spearheaded an application-wide website builder enabling users to create dynamic layouts through drag-and-drop nested elements.",
      "Mentored three junior engineers on Next.js best practices and secure coding, cutting code-review time by 20% and improving release stability.",
    ],
  },
  {
    company: "The Tarzan Way",
    companyLink: "https://www.linkedin.com/company/thetarzanway/",
    companyLogo: TheTarzanWay,
    roles: [
      {
        role: "Full-stack Developer",
        from: {
          month: "FEB",
          year: 2023,
        },
        to: {
          month: "OCT",
          year: 2023,
        },
        type: "Full time",
      },
    ],

    summary: [
      "Rearchitected a user-friendly travel platform with an itinerary-based system, integrating secure payment gateways, role-based user management, and seamless API connections for hotel and flight bookings.",
      "Optimized user experience by developing intelligent itinerary generation algorithms, coupon management features, and interactive maps, resulting in a 15% reduction in search time complexity.",
      "Enhanced front-end performance 50% increase and achieved a lighthouse score of 91 through techniques like lazy loading, code splitting, and caching using Next.js and Webpack",
      "Leveraged web workers for improved concurrency and implemented responsive design principles to ensure a smooth user experience across all devices also Built a (PWA) for offline access and improved performance, boosting user engagement.Optimized application memory utilization by minimizing garbage collector invocations, resulting in a 9% improvement in application performance.",
      "Developed a robust Django-based backend CMS for itineraries, empowering users with the ability to create, modify, delete, and manage diverse frontend itineraries with varying access rights."
    ]
  },
  {
    company: "KAL Group",
    companyLink: "https://www.linkedin.com/company/kalgroup-us/",
    companyLogo: KalGroup,
    roles: [
      {
        role: "Full-stack Developer",
        from: {
          month: "JAN",
          year: 2022,
        },
        to: {
          month: "FEB",
          year: 2023,
        },
        type: "Full time",
      },
      {
        role: "Assosiate WebDeveloper",
        from: {
          month: "APR",
          year: 2021,
        },
        to: {
          month: "JAN",
          year: 2022,
        },
        type: "Full time",
      },
    ],

    summary: [
      "Successfully built a comprehensive HRMS system from scratch, addressing various HR challenges for a new company. Implemented performance evaluation, leave management, salary management, and a hierarchical structure tailored to the company's needs. Increased efficiency 30% and streamlined workflows in both HR and IT departments through the development of a ticket-based management system using MERN stack.",
      "Designed and developed multiple e-commerce and business websites, while migrating some from wordpress to react with custom, reusable, and dynamic components seamlessly integrated with a CRM in Sanity.",
      "Created location search functionality by crafting a user-friendly location mapping system with intuitive map interfaces",
      `build a live chat system to facilitate customer engagement, allowing users to interact with the service department for sales
      and support. This system included features like assigning customers to sales representatives and transferring chats for
      optimal service.using socket.io with loads to REST APIs
      `,
      "Elevated user experience and streamlined processes by engineering custom form management systems"
    ]
  },

];
