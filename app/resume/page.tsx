import type { Metadata } from "next";
import { ResumeDocument } from "@/components/portfolio/resume-document";

export const metadata: Metadata = {
  title: "Résumé",
  description: "Sufyaan Khateeb’s software engineering résumé: backend systems, data orchestration and full-stack experience.",
  robots: { index: false, follow: true },
};

export default function ResumePage() {
  return <ResumeDocument variant="fullstack" />;
}
