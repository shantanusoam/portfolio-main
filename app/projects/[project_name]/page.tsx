"use client";

import Heading from "@/components/ui/Heading";
import { projects } from "@/constants/projects";
import { MoveLeft, MoveRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { redirect, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Buttons";
import GradientBlocker from "@/components/ui/GradientBlocker";
import ProjectEvidenceDemo from "@/components/projects/ProjectEvidenceDemo";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function ProjectPage() {
  const params = useParams<{ project_name: string }>();
  const projectName = params.project_name;
  const projectIndex = projects.findIndex(
    (project) => project.id === projectName
  );
  const project = projects.find((project) => project.id === projectName)!;

  if (!project) {
    redirect("/");
  }

  return (
    <section className="relative mx-[6%] flex select-none flex-col gap-12 py-[8rem] sm:mx-[10%] lg:mx-[15%]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareSourceCode",
            name: project.title,
            description: project.description,
            url: `https://shantanusoam.vercel.app${project.url}`,
            codeRepository: project.sourceAvailability === "public" || !project.sourceAvailability ? project.codeLink : undefined,
            programmingLanguage: Object.values(project.skills).flat(),
            author: { "@type": "Person", name: "Shantanu Soam" },
          }),
        }}
      />
      <GradientBlocker className="fixed h-[25dvh]" />
      <Link href={"/"} className="flex flex-row items-center gap-2 text-gray">
        <MoveLeft className="w-5" /> Go back to homepage
      </Link>
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="flex flex-col gap-2"
      >
        <div className="flex flex-row items-center gap-4">
          {project.metadata?.map((meta, i) => (
            <p key={i} className="font-mono text-xs uppercase text-darkgray">
              {meta}
            </p>
          ))}
          {project.isPlaceholder && (
            <p className="font-mono text-xs uppercase tracking-widest text-primary">
              Mission briefing: classified
            </p>
          )}
        </div>
        {project.cover_image !== null ? (
          <Image
            src={project.cover_image as any}
            alt={`${project.title}'s cover image`}
            className="h-[250px] bg-gradient-to-br from-zinc-800 to-black object-cover"
            priority
          ></Image>
        ) : (
          <div className="flex h-[250px] items-center justify-center bg-gradient-to-br from-zinc-800 to-black">
            <p className="font-mono text-xs uppercase tracking-widest text-darkgray">
              No public screenshot available
            </p>
          </div>
        )}
      </motion.div>
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
      >
        <h2 className="text-2xl font-semibold tracking-wide">
          {project.title}
        </h2>
        {!project.isPlaceholder && (
          <div className="flex flex-row flex-wrap gap-2">
            {project.sourceAvailability === "private" ? (
              <span className="border-white/20 text-white/40 border px-4 py-2 font-mono text-[10px] uppercase tracking-widest">Private source</span>
            ) : project.sourceAvailability === "client" ? (
              <span className="border-white/20 text-white/40 border px-4 py-2 font-mono text-[10px] uppercase tracking-widest">Client source withheld</span>
            ) : project.codeLink ? (
              <Link href={project.codeLink} target="_blank"><Button type="white">View Code</Button></Link>
            ) : null}
            {project.liveLink ? <Link href={project.liveLink} target="_blank"><Button>View Live</Button></Link> : null}
          </div>
        )}
      </motion.div>
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="flex flex-col gap-8"
      >
        <Heading>CLASS</Heading>
        <p className="text-graytransparent">{project.class}</p>
      </motion.div>
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="flex flex-col gap-8"
      >
        <Heading>SPECIAL MOVES</Heading>
        <ul className="ml-3.5 list-outside list-disc text-graytransparent">
          {project.specialMoves.map((move, i) => (
            <li key={i}>{move}</li>
          ))}
        </ul>
      </motion.div>
      <motion.div
        id="impact"
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="flex flex-col gap-8"
      >
        <Heading>IMPACT</Heading>
        <ul className="ml-3.5 list-outside list-disc text-graytransparent">
          {project.impact.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      </motion.div>
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="flex flex-col gap-8"
      >
        <Heading>OVERVIEW</Heading>
        <p className="text-graytransparent">{project.description}</p>
      </motion.div>
      {project.caseStudy && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="flex flex-col gap-8"
        >
          <Heading>CASE FILE</Heading>
          <div className="grid gap-8 text-graytransparent">
            <div>
              <h3 className="max-w-4xl font-serif text-3xl leading-tight text-white md:text-5xl">
                {project.caseStudy.headline}
              </h3>
              <p className="mt-5 max-w-4xl leading-8">
                {project.caseStudy.context}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="border border-white/15 bg-white/[0.02] p-5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
                  Ownership
                </p>
                <p className="mt-4 leading-7">{project.caseStudy.ownership}</p>
              </div>
              <div className="border border-white/15 bg-white/[0.02] p-5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
                  Failed approach
                </p>
                <p className="mt-4 leading-7">
                  {project.caseStudy.failedApproach}
                </p>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <div>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-primary">
                  Constraints
                </p>
                <ul className="ml-3.5 list-outside list-disc leading-7">
                  {project.caseStudy.constraints.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-primary">
                  Engineering decisions
                </p>
                <ul className="ml-3.5 list-outside list-disc leading-7">
                  {project.caseStudy.engineeringDecisions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-primary">
                  Outcome
                </p>
                <ul className="ml-3.5 list-outside list-disc leading-7">
                  {project.caseStudy.outcome.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border border-white/15 bg-black/30 p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
                Architecture / sanitized diagram
              </p>
              <h4 className="mt-3 text-2xl font-semibold text-white">
                {project.caseStudy.architecture.title}
              </h4>
              <p className="mt-3 max-w-4xl leading-7">
                {project.caseStudy.architecture.description}
              </p>
              <div className="mt-5 grid gap-2 md:grid-cols-3 xl:grid-cols-6">
                {project.caseStudy.architecture.nodes.map((node, index) => (
                  <div
                    className="relative border border-white/15 bg-white/[0.02] p-3"
                    key={node}
                  >
                    <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="mt-2 text-sm text-white/65">{node}</p>
                  </div>
                ))}
              </div>
            </div>

            {project.caseStudy.artifact && (
              <div>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-primary">
                  Evidence artifact
                </p>
                <ProjectEvidenceDemo artifact={project.caseStudy.artifact} />
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-3">
              <div>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-primary">
                  Measurement
                </p>
                <ul className="ml-3.5 list-outside list-disc leading-7">
                  {project.caseStudy.measurement.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-primary">
                  Trade-offs
                </p>
                <ul className="ml-3.5 list-outside list-disc leading-7">
                  {project.caseStudy.tradeoffs.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-primary">
                  Reflection
                </p>
                <p className="leading-7">{project.caseStudy.reflection}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="flex flex-col gap-8"
      >
        <Heading>FEATURES</Heading>
        <ul className="ml-3.5 list-outside list-disc text-graytransparent">
          {project.features.map((feat, i) => (
            <li key={i}>{feat}</li>
          ))}
        </ul>
      </motion.div>
      {project.problem && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="flex flex-col gap-8"
        >
          <Heading>PROBLEM</Heading>
          <p className="text-graytransparent">{project.problem}</p>
        </motion.div>
      )}
      {project.solution && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="flex flex-col gap-8"
        >
          <Heading>SOLUTION</Heading>
          <p className="text-graytransparent">{project.solution}</p>
        </motion.div>
      )}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="flex flex-col gap-8"
      >
        <Heading>TECH STACK</Heading>
        <div className="flex flex-col gap-8 md:gap-3">
          {Object.keys(project.skills).map((skillName, i) => (
            <div
              className="flex flex-row items-start gap-4 text-graytransparent"
              key={i}
            >
              <p className="min-w-[80px] text-darkgray">{skillName}: </p>
              <ul className="flex flex-row flex-wrap gap-2 font-mono text-sm uppercase">
                {project.skills[skillName as keyof typeof project.skills]!.map(
                  (skill, j) => (
                    <li key={j}>{skill}</li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>
      {project.screenshots.length > 0 && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="flex flex-col gap-8"
        >
          <Heading>SCREENSHOT</Heading>
          <div className="flex flex-col gap-5">
            {project.screenshots.map((screenshot, i) => (
              <Image
                key={i}
                src={screenshot as any}
                alt={`${project.title}'s ${i + 1} screenshot`}
                className="bg-gradient-to-br from-zinc-800 to-black object-cover"
                priority
              ></Image>
            ))}
          </div>
        </motion.div>
      )}
      <div
        className={cn(
          "flex flex-row items-center justify-between",
          projectIndex === 0 && "justify-end",
          projectIndex === projects.length - 1 && "justify-start"
        )}
      >
        {projectIndex !== 0 && (
          <Link
            href={projects[projectIndex - 1].url}
            className="flex flex-row items-center gap-2 text-gray"
          >
            <MoveLeft className="w-5" /> Previous
          </Link>
        )}
        {projectIndex !== projects.length - 1 && (
          <Link
            href={projects[projectIndex + 1].url}
            className="flex flex-row items-center gap-2 text-gray"
          >
            Next <MoveRight className="w-5" />
          </Link>
        )}
      </div>
    </section>
  );
}
