import Image from "next/image";
import Link from "next/link";
import { flagshipCaseStudies } from "@/lib/portfolio/evidence";
import { archiveArticles } from "@/lib/archive/data";
import { resume_link } from "@/constants/resume";
import CinematicDirector from "./cinema/CinematicDirector";
import ShaderImage from "./cinema/ShaderImage";
import Toolkit from "./cinema/Toolkit";
import cinema from "./cinema/Cinema.module.css";
import SketchLoader from "./SketchLoader";
import styles from "./Workshop.module.css";

const nav = [
  ["work", "Work"],
  ["lab", "Lab"],
  ["notes", "Notes"],
  ["about", "About"],
  ["contact", "Contact"],
];
const projectTitles = [
  "Better systems.\nBusiness as usual.",
  "Make the critical\nparts dependable.",
  "A little drag.\nA lot of state.",
];
const aliases: Record<string, string[]> = {
  work: ["case-studies", "mission-select", "projects", "proof-strip"],
  lab: ["maker-lab", "pattern-library", "systems-lab", "pretext-copy-lab"],
  notes: ["latest-notes"],
  about: [
    "trail-map",
    "experience",
    "about-studio",
    "hobbies",
    "field-notes",
    "current-position",
  ],
  contact: ["contact-availability"],
};
function Anchors({ section }: { section: string }) {
  return (
    <>
      {aliases[section]?.map((id) => (
        <span id={id} key={id} className={styles.anchor} aria-hidden="true" />
      ))}
    </>
  );
}
function Mark() {
  return (
    <svg
      viewBox="0 0 36 36"
      width="34"
      height="34"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M18 31V15M18 23C7 23 5 15 5 10c9 0 13 4 13 13ZM18 17C18 7 25 4 31 4c0 9-4 13-13 13Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M10 31h16" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function WorkshopHome() {
  return (
    <div className={`${styles.workshop} ${cinema.world} workshop-home`}>
      <CinematicDirector />
      <a href="#main-content" className={styles.skip}>
        Skip to content
      </a>
      <header className={`${styles.header} ${cinema.header}`}>
        <a className={styles.identity} href="#top">
          <Mark />
          <span>
            Shantanu Soam<small>Engineer & curious human</small>
          </span>
        </a>
        <nav aria-label="Primary navigation">
          {nav.map(([id, label], index) => (
            <a href={`#${id}`} key={id}>
              <small>0{index + 1}</small> {label}
            </a>
          ))}
        </nav>
        <a
          href={resume_link}
          className={styles.cv}
          target="_blank"
          rel="noreferrer"
        >
          CV ↗
        </a>
      </header>
      <main id="main-content">
        <section
          className={`${styles.cinematicHero} ${cinema.hero}`}
          id="top"
          aria-labelledby="hero-title"
        >
          <span id="hero" className={styles.anchor} aria-hidden="true" />
          <div className={cinema.scene}>
            <div className={cinema.environment} data-camera>
              <Image
                src="/workshop/meadow.webp"
                alt="White birds gliding across a sunlit emerald meadow"
                fill
                priority
                sizes="100vw"
              />
            </div>
            <div className={cinema.atmosphere} aria-hidden="true" />
            <div className={cinema.sceneTop}>
              <span>A place for useful things</span>
              <span>Chapter 00 / Arrive</span>
            </div>
            <div className={cinema.heroContent} data-hero-copy>
              <p className={styles.micro}>
                Shantanu Soam / Creative systems engineer
              </p>
              <h1
                id="hero-title"
                className={cinema.title}
                aria-label="Useful software. Room to imagine."
              >
                <span className={cinema.titleLine} aria-hidden="true">
                  {"Useful software.".split("").map((letter, i) => (
                    <span data-letter key={i}>
                      {letter === " " ? "\u00a0" : letter}
                    </span>
                  ))}
                </span>
                <em aria-hidden="true">Room to imagine.</em>
              </h1>
              <div className={cinema.heroBottom}>
                <p>
                  I build business software, interactive tools, and small
                  experiments. A little precision. A lot of curiosity.
                </p>
                <a href="#work" className={cinema.enter} data-magnetic>
                  Wander through the work <span>↘</span>
                </a>
              </div>
            </div>
            <div className={cinema.sceneFooter}>
              <span>Software / Systems / Small discoveries</span>
              <span>Scroll to explore ↓</span>
            </div>
          </div>
          <div
            className={`${styles.landscapeSequence} ${cinema.filmstrip}`}
            aria-label="Three imagined landscapes: meadow, shoreline, and dusk"
          >
            <figure className={styles.meadowFrame}>
              <Image
                src="/workshop/meadow.webp"
                alt="A small flock of white birds over a sunlit emerald meadow"
                width={1536}
                height={1024}
                sizes="(max-width: 700px) 92vw, 40vw"
              />
              <figcaption>01 / Follow a little curiosity.</figcaption>
            </figure>
            <figure className={styles.shoreFrame}>
              <Image
                src="/workshop/shore.webp"
                alt="A white horse on a smooth green bank beside sparkling turquoise water"
                width={1536}
                height={1024}
                sizes="(max-width: 700px) 92vw, 40vw"
              />
              <figcaption>02 / Make room for the unexpected.</figcaption>
            </figure>
            <figure className={styles.duskFrame}>
              <Image
                src="/workshop/dusk.webp"
                alt="Rose and lavender sunset reflected in a quiet lake"
                width={1536}
                height={1024}
                sizes="(max-width: 700px) 92vw, 40vw"
              />
              <figcaption>03 / See where it takes you.</figcaption>
            </figure>
          </div>
          <p className={styles.artCredit}>
            An imagined landscape, made for this portfolio.
          </p>
        </section>
        <div className={styles.edition}>
          <span>From complicated things to a little more clarity.</span>
          <span>Software / Systems / Small discoveries</span>
          <a href="#work" aria-label="Scroll to selected work">
            ↓
          </a>
        </div>

        <section className={styles.work} id="work" aria-labelledby="work-title">
          <Anchors section="work" />
          <div className={styles.sectionHeading}>
            <p className={styles.micro}>01 / Selected work</p>
            <h2 id="work-title">
              Built for the
              <br />
              <em>real world.</em>
            </h2>
            <p>
              Complex products. Careful decisions.
              <br />A look at the work beneath the interface.
            </p>
          </div>
          {flagshipCaseStudies.slice(0, 3).map((project, index) => (
            <article
              key={project.id}
              className={`${styles.project} ${cinema.project}`}
              data-project
            >
              <span
                className={cinema.district}
                data-district
                aria-hidden="true"
              >
                {["GROW", "CARE", "PLAY"][index]}
              </span>
              <div className={styles.projectCopy}>
                <p className={styles.micro}>
                  Chapter 0{index + 1} / {project.category}
                </p>
                <h3>
                  <Link href={project.href}>
                    {projectTitles[index].split("\n").map((line, i) => (
                      <span key={line}>
                        {line}
                        {i === 0 && <br />}
                      </span>
                    ))}
                  </Link>
                </h3>
                <p className={styles.projectName}>{project.name}</p>
                <p>{project.problem}</p>
                <details>
                  <summary>
                    The engineering decision <span aria-hidden="true">+</span>
                  </summary>
                  <p>{project.decisions[0]}</p>
                  <p>
                    {
                      project.trace.find((step) => step.label === "Lesson")
                        ?.detail
                    }
                  </p>
                </details>
                <Link href={project.href} className={styles.textLink}>
                  Read the case study <span>↗</span>
                </Link>
              </div>
              <figure
                data-artifact
                className={`${styles.projectArtifact} ${cinema.artifact} ${
                  index === 1 ? styles.clayArtifact : ""
                }`}
              >
                <div className={styles.artifactTop}>
                  <span>{project.name}</span>
                  <span>System study / 0{index + 1}</span>
                </div>
                <div className={styles.layerDiagram}>
                  {project.systemLayers.map((layer, i) => (
                    <div key={layer}>
                      <span>0{i + 1}</span>
                      <strong>{layer}</strong>
                      <span aria-hidden="true">
                        {i === project.systemLayers.length - 1 ? "◉" : "↓"}
                      </span>
                    </div>
                  ))}
                </div>
                <figcaption>
                  Authored architecture summary · Based on the project narrative
                </figcaption>
              </figure>
            </article>
          ))}
        </section>

        <section
          className={`${styles.lab} ${cinema.lab}`}
          id="lab"
          aria-labelledby="lab-title"
        >
          <Anchors section="lab" />
          <div className={styles.labCopy}>
            <p className={styles.micro}>02 / The curious part</p>
            <h2 id="lab-title">
              A small idea.
              <br />
              <em>Try something.</em>
            </h2>
            <p>
              Move a task. Watch its relationships change. Then undo it. A small
              working sketch of the state modelling behind nested interfaces.
            </p>
            <Link className={styles.textLink} href="/systems/dynamic-tree">
              Inside the dynamic tree ↗
            </Link>
          </div>
          <SketchLoader />
          <div className={cinema.refraction}>
            <div>
              <p className={styles.micro}>
                A moment to yourself / Touch the light
              </p>
              <h3>
                A different
                <br />
                <em>point of view.</em>
              </h3>
              <p>
                Move gently through the meadow. Watch the light respond, then
                settle. A little experiment in finding calm.
              </p>
            </div>
            <ShaderImage
              src="/workshop/meadow.webp"
              alt="Sunlit meadow that responds gently to touch"
            />
          </div>
          <div className={styles.labLinks}>
            <Link href="/systems">All experiments ↗</Link>
            <Link href="/learning/string-instrument">
              The string instrument ↗
            </Link>
            <Link href="/octopod-lab">Procedural creatures ↗</Link>
            <Link href="/arcade/space-impact/pocket">
              A little arcade break ↗
            </Link>
          </div>
        </section>

        <section
          className={styles.notes}
          id="notes"
          aria-labelledby="notes-title"
        >
          <Anchors section="notes" />
          <div className={styles.sectionHeading}>
            <p className={styles.micro}>03 / Field notes</p>
            <h2 id="notes-title">
              Thinking,
              <br />
              <em>out loud.</em>
            </h2>
            <Link className={styles.textLink} href="/blog">
              The full notebook ↗
            </Link>
          </div>
          <div className={styles.noteList}>
            {archiveArticles.slice(0, 3).map((article, i) => (
              <Link
                href={`/blog/${article.slug}`}
                className={styles.note}
                key={article.slug}
              >
                <span className={styles.noteIndex}>0{i + 1}</span>
                <div>
                  <p className={styles.micro}>
                    {article.category} / {article.readingMinutes} min read
                  </p>
                  <h3>{article.title}</h3>
                  <p>{article.dek}</p>
                </div>
                <span className={styles.noteArrow} aria-hidden="true">
                  ↗
                </span>
              </Link>
            ))}
          </div>
        </section>

        <figure className={styles.landscapeInterlude}>
          <Image
            src="/workshop/shore.webp"
            alt="Sunlight catching the water and grass around a quiet shoreline"
            width={1536}
            height={1024}
            sizes="92vw"
          />
          <figcaption>
            There’s always something worth looking closer at.
          </figcaption>
        </figure>

        <section
          className={styles.about}
          id="about"
          aria-labelledby="about-title"
        >
          <Anchors section="about" />
          <p className={styles.micro}>04 / The person behind the work</p>
          <h2 id="about-title">
            Serious about the craft.
            <br />
            <em>Curious about everything.</em>
          </h2>
          <div className={styles.aboutBody}>
            <figure className={cinema.portrait}>
              <Image
                src="/AboutMePic.jpg"
                alt="Shantanu Soam"
                width={600}
                height={600}
                sizes="(max-width: 700px) 80vw, 25vw"
              />
              <figcaption>Shantanu Soam / Behind the scenes</figcaption>
            </figure>
            <div>
              <p>
                My work moves between product engineering and interaction
                design: permissions, state, performance, and the small details
                that make software easier to use.
              </p>
              <p>
                This portfolio is also a place to learn in public. The lab holds
                the experiments; the notebook holds the reasoning. Together,
                they show how I think through a problem.
              </p>
              <a
                className={styles.textLink}
                href={resume_link}
                target="_blank"
                rel="noreferrer"
              >
                Experience & CV ↗
              </a>
            </div>
            <dl>
              <div>
                <dt>Product work</dt>
                <dd>Knowbuild · Niva Bupa</dd>
              </div>
              <div>
                <dt>Tools of the trade</dt>
                <dd>React · TypeScript · Next.js</dd>
              </div>
              <div>
                <dt>Ongoing curiosity</dt>
                <dd>Motion · AI agents · Hardware</dd>
              </div>
            </dl>
          </div>
        </section>

        <Toolkit />
        <section
          className={styles.contact}
          id="contact"
          aria-labelledby="contact-title"
        >
          <Anchors section="contact" />
          <p className={styles.micro}>05 / A conversation is a good start</p>
          <h2 id="contact-title">
            Something worth
            <br />
            <em>building together?</em>
          </h2>
          <a
            className={styles.contactLink}
            href="mailto:shantanu.singh.soam@gmail.com"
          >
            Let’s make it happen. <span aria-hidden="true">↗</span>
          </a>
          <a
            className={styles.email}
            href="mailto:shantanu.singh.soam@gmail.com"
          >
            shantanu.singh.soam@gmail.com
          </a>
        </section>
      </main>
      <footer className={styles.footer}>
        <a href="#top">Shantanu Soam ↑</a>
        <span>Made with care. Always in progress.</span>
        <div>
          <a href="https://github.com/shantanusoam">GitHub ↗</a>
          <a href="https://www.linkedin.com/in/shantanu007/">LinkedIn ↗</a>
          <Link href="/blog">Notebook ↗</Link>
        </div>
      </footer>
    </div>
  );
}
