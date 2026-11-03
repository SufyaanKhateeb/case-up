import type { Metadata } from "next";
import { ResumeDocument } from "@/components/portfolio/resume-document";

export const metadata: Metadata = {
  title: "Data engineering résumé",
  description: "Sufyaan Khateeb’s data engineering résumé: Python, SQL, Kafka, Airflow and cloud data platforms.",
  robots: { index: false, follow: true },
};

export default function DataResumePage() { return <ResumeDocument variant="data" />; }
