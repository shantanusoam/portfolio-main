import { ExperienceType } from "@/@types/experience.type";
import agoraverse from "@/public/agora.webp";
import cognizant from "@/public/cognizant.webp";
import KalGroup from "@/public/KalGroup.webp";
import Mobikasa from "@/public/mobikasa.png"
import TheTarzanWay from "@/public/TheTarzanWay.webp"
import fasthr from "@/public/fasthr.svg";

export const yearsOfExperience =
  (new Date().getTime() - new Date("2021-04-02").getTime()) /
  (1000 * 60 * 60 * 24 * 365);

export const experiences: ExperienceType[] = [

  {
    company: "Mobikasa",
    companyLink: "https://www.linkedin.com/company/thetarzanway/",
    companyLogo: Mobikasa,
    roles: [
      {
        role: "Full-stack Developer",
        from: {
          month: "OCT",
          year: 2023,
        },
        to: {
          month: "Current",
         
        },
        type: "Full time",
      },
    ],
    summary: [
      "lead the development of a Amala Earth comprehensive (CMS) replicating Shopify’s functionalities. Implemented an innovative N-nested drag-and- drop variant builder , Variant Builder and real-time editing/deletion features to empower content creators. using Micro Frontend Architecture. Adhered to Agile and Scrum methodologies and SDLC practices with proper unit, integration and performance testing using Micro Frontend Architecture.",
      "Abstracted complex logic and state management by implementing (RTK) and RTK Query Layer throughout the application, reducing code complexity by 25% and increasing productivity by 10% for the development team.",    
      "Designed and developed a reusable component library for The project using ShadCN and Tailwind with CVA, Framer Motion incorporating components like dynamic tables, comboboxes, tooltip, tree, timeline and Multi Image selectors. This boosted developer productivity by 10% and reduced code duplication by 15%.",
      "Spearheaded the implementation of an application-wide website builder, enabling users to create dynamic website layouts through drag-and-drop nested elements, enhancing frontend customization and user engagement.",
      "creation of a reusable component library with custom dynamic component renderer and versatile table components, leveraging React patterns to boost developer productivity by 10% and reduce code duplication by 15%"
    ]
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
