import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { PortfolioRuntime } from "@/components/portfolio/runtime";
import { portfolio } from "@/content/portfolio";

const funnel = localFont({ src: "../public/fonts/FunnelDisplay.ttf", variable: "--font-funnel", display: "swap", weight: "300 800" });

export const metadata: Metadata = {
	title: { default: `${portfolio.name} — ${portfolio.title}`, template: `%s — ${portfolio.name}` },
	description: "Sufyaan Khateeb’s personal portfolio. Building software for a better future.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={funnel.variable}>
				<a className="skip-link" href="#main">Skip to content</a>
				<PortfolioRuntime>{children}</PortfolioRuntime>
			</body>
		</html>
	);
}
