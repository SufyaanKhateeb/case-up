"use client";
import ScrollHeader from "@/components/scroll-header";
import PageLoader from "./pageLoader";
import Image from "next/image";
import img1 from "@/public/max-bender-1zFK0pkHo9w-unsplash.jpg";
import img2 from "@/public/melyna-cote-rLWHLNQFQL8-unsplash.jpg";
import { Noto_Sans } from "next/font/google";
import { useRef } from "react";
import styles from "./page.module.css";

const noto = Noto_Sans({ subsets: ["latin"] });

export default function Home() {
	const workSectionRef = useRef<any>(null);
	const aboutSectionRef = useRef<any>(null);
	const contactSectionRef = useRef<any>(null);

	return (
		<div className="w-full h-full overflow-x-hidden">
			<PageLoader />
			<div className="w-screen h-screen -z-10 fixed top-0 left-0 flex">
					<section className="h-full border-l border-dim_gray ml-[2vw]" />
					<section className="h-full border-l border-dim_gray ml-[2vw]" />
					<section className="h-full border-l border-dim_gray ml-[2vw]" />
					<section className="h-full border-l border-dim_gray ml-[2vw]" />
					<section className="h-full border-l border-dim_gray ml-[2vw]" />
					<section className="h-full border-l border-dim_gray ml-[2vw]" />
					<section className="h-full border-l border-dim_gray ml-[2vw]" />
					<section className="h-full border-l border-dim_gray ml-auto mr-[2vw]" />
			</div>
			<div className="h-screen w-[94%] pt-[3rem] mx-auto flex flex-col">
				<ScrollHeader workRef={workSectionRef} aboutRef={aboutSectionRef} contactRef={contactSectionRef} />
				<section className="flex flex-col md:flex-row gap-[2rem] md:gap-0 pl-[16vw] md:p-0">
					<div className={`${noto.className} flex flex-col md:text-6xl lg:text-8xl text-2xl uppercase md:pl-[30px] font-semibold text-foreground whitespace-pre-line`}>
						<p className="md:mb-[2rem]">PERSONAL</p>
						<p>PORTFOLIO</p>
					</div>
					<div className={`${noto.className} uppercase whitespace-pre-line w-[90%] !italic md:pl-[90px] text-sm md:text-xl lg:text-2xl font-light`}>
						<p className="py-2 md:py-2 text-xs md:text-sm not-italic uppercase font-semibold">CURRENTLY:</p>
						<p className="mb-[1rem] md:mb-[2rem]">{"Hacking software solutions to make real impact while witnessing the \"A.I. revolution\"."}</p>
						<p>Building for a better future.</p>
					</div>
				</section>
			</div>
			<div className="m-2" />
			<div ref={workSectionRef} id="work-section" className="w-screen h-screen">
				Work
				<div className="relative w-[500px] h-[500px]">
					<Image alt="pic2" className="object-cover" fill src={img2} />
				</div>
			</div>
			<div ref={aboutSectionRef} id="about-section" className="w-screen h-screen">
				About
				<div className="relative w-[500px] h-[500px]">
					<Image alt="pic2" className="object-cover" fill src={img1} />
				</div>
			</div>
			<div ref={contactSectionRef} id="contact-section" className="w-screen h-screen">
				Contact
				<div className="relative w-[500px] h-[500px]">
					<Image alt="pic2" className="object-cover" fill src={img2} />
				</div>
			</div>
		</div>
	);
}
