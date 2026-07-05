"use client";

import Heading from "@/components/ui/Heading";
import { projects } from "@/constants/projects";
import { MoveLeft, MoveRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { notFound, redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Buttons";
import GradientBlocker from "@/components/ui/GradientBlocker";

interface PageProps {
  params: { project_name: string };
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function ProjectPage({ params }: PageProps) {
  const project_name = params.project_name;
  const project_index = projects.findIndex(
    (project) => project.id == project_name
  );
  const project = projects.find((project) => project.id == project_name)!;

  if (!project) {
    redirect("/");
  }

  return (
    <section className="relative mx-[10%] flex select-none flex-col gap-12 py-[9rem] sm:mx-[15%]">
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
          <div className="flex flex-row gap-2">
            <Link href={project.codeLink} target="_blank">
              <Button type="white">View Code</Button>
            </Link>
            <Link href={project.liveLink} target="_blank">
              <Button>View Link</Button>
            </Link>
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
          {Object.keys(project.skills).map((skill_name, i) => (
            <div
              className="flex flex-row items-start gap-4 text-graytransparent"
              key={i}
            >
              <p className="min-w-[80px] text-darkgray">{skill_name}: </p>
              <ul className="flex flex-row flex-wrap gap-2 font-mono text-sm uppercase">
                {project.skills[skill_name as keyof typeof project.skills]!.map(
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
          project_index == 0 && "justify-end",
          project_index == projects.length - 1 && "justify-start"
        )}
      >
        {project_index != 0 && (
          <Link
            href={projects[project_index - 1].url}
            className="flex flex-row items-center gap-2 text-gray"
          >
            <MoveLeft className="w-5" /> Previous
          </Link>
        )}
        {project_index != projects.length - 1 && (
          <Link
            href={projects[project_index + 1].url}
            className="flex flex-row items-center gap-2 text-gray"
          >
            Next <MoveRight className="w-5" />
          </Link>
        )}
      </div>
    </section>
  );
}
