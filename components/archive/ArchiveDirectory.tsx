import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  archiveArticles,
  inspirationEntries,
  raqEntries,
  talkEntries,
} from "@/lib/archive/data";
import styles from "./archive.module.css";

const rooms = [
  {
    href: "/blog",
    index: "01",
    title: "Dispatches",
    description:
      "Essays and build notes about systems, interfaces and mistakes.",
    count: `${archiveArticles.length} pieces`,
  },
  {
    href: "/inspo",
    index: "02",
    title: "Reference wall",
    description:
      "Interfaces and objects saved with the exact reason they matter.",
    count: `${inspirationEntries.length} references`,
  },
  {
    href: "/worth-your-time",
    index: "03",
    title: "Screening room",
    description: "Talks chosen by the time you have and the idea you need.",
    count: `${talkEntries.length} screenings`,
  },
  {
    href: "/raq",
    index: "04",
    title: "Rare questions",
    description:
      "Occasional questions with short and uncomfortably long answers.",
    count: `${raqEntries.length} answers`,
  },
];

export default function ArchiveDirectory() {
  return (
    <section className={`${styles.section} ${styles.directorySection}`}>
      <div className={styles.directoryIntro}>
        <p className={styles.sectionKicker}>The Signal Archive</p>
        <p>
          Four rooms for work in progress, visual taste, borrowed wisdom and the
          questions that do not belong in a résumé.
        </p>
      </div>
      <nav className={styles.directoryGrid} aria-label="Explore the archive">
        {rooms.map((room) => (
          <Link
            className={`${styles.directoryCard} ${
              room.href === "/blog" ? styles.directoryCardActive : ""
            }`}
            href={room.href}
            key={room.href}
          >
            <div className={styles.directoryMeta}>
              <span>{room.index}</span>
              <span>{room.count}</span>
            </div>
            <div>
              <h2>{room.title}</h2>
              <p>{room.description}</p>
            </div>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        ))}
      </nav>
    </section>
  );
}
