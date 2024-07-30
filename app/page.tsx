"use client";
import ScrollHeader from "@/components/scroll-header";
import PageLoader from "./pageLoader";
import Image from "next/image";
import img1 from "@/public/max-bender-1zFK0pkHo9w-unsplash.jpg";
import img2 from "@/public/melyna-cote-rLWHLNQFQL8-unsplash.jpg";
import { Noto_Sans } from "next/font/google";
import { useEffect, useRef } from "react";
import styles from "./page.module.css";

const noto = Noto_Sans({ subsets: ["latin"] });

export default function Home() {
	const workSectionRef = useRef<any>(null);
	const aboutSectionRef = useRef<any>(null);
	const contactSectionRef = useRef<any>(null);

	useEffect(() => {
		(async() => {
			const LocomotiveScroll = (await import('locomotive-scroll')).default;
			const locomotiveScroll = new LocomotiveScroll();
		})();
	}, []);

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
			<div className="h-screen w-[94%] mx-auto flex flex-col">
				<ScrollHeader workRef={workSectionRef} aboutRef={aboutSectionRef} contactRef={contactSectionRef} />
				<section id="website-greetings-section" className="relative top-[50px] opacity-0 flex flex-col md:flex-row gap-[2rem] md:gap-0 pt-5 md:pt-12 pl-[16vw] md:pl-[30px]">
					<div className={`${noto.className} flex flex-col md:text-6xl lg:text-7xl text-2xl uppercase md:pl-[30px] font-bold text-foreground whitespace-pre-line`}>
						<p>PERSONAL</p>
						<p>PORTFOLIO</p>
					</div>
					<div className={`${noto.className} uppercase whitespace-pre-line w-[90%] !italic md:pl-[90px] text-sm md:text-xl lg:text-2xl font-light`}>
						<p className="py-2 md:py-2 text-xs md:text-sm not-italic uppercase font-semibold">CURRENTLY:</p>
						<p className="mb-[1rem] md:mb-[2rem]">{"Hacking software solutions to make real impact while witnessing the \"A.I. revolution\"."}</p>
						<p>Building for a better future.</p>
					</div>
				</section>
			</div>
			<div className="bg-background p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-4xl font-bold text-violet-500 mb-4">Site Under Construction</h1>
        <div className="flex justify-center">
            <svg className="animate-spin h-10 w-10 text-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
        <p className="text-foreground mt-6">In the meantime, you can reach me at <a href="mailto:sufyaankhateeb@gmail.com" className="text-violet-400 underline">sufaankhateeb@gmail.com</a></p>
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
