import { ExperienceType } from "@/@types/experience.type";
import agoraverse from "@/public/agora.webp";
import cognizant from "@/public/cognizant.webp";
import KalGroup from "@/public/KalGroup.webp";

import TheTarzanWay from "@/public/TheTarzanWay.webp"
import fasthr from "@/public/fasthr.svg";

export const yearsOfExperience =
  (new Date().getTime() - new Date("2021-04-02").getTime()) /
  (1000 * 60 * 60 * 24 * 365);

export const experiences: ExperienceType[] = [
  // {
  //   company: "Fasthr.AI",
  //   companyLink: "https://www.linkedin.com/company/fasthrdotai/",
  //   companyLogo: fasthr,
  //   roles: [
  //     {
  //       role: "Frontend Engineer",
  //       from: {
  //         month: "JUN",
  //         year: 2023,
  //       },
  //       to: {
  //         month: "NOW",
  //       },
  //       type: "Full time",
  //     },
  //   ],
  // },
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
  },

];
