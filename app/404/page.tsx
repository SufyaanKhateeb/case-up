import type { Metadata } from "next";
import { MissingPage } from "@/components/portfolio/missing-page";
export const metadata: Metadata = { title: "A little lost", robots: { index: false, follow: false } };
export default function DressUpPage() { return <MissingPage />; }
