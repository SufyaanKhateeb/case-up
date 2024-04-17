"use client";
import ScrollHeader from "@/components/scroll-header";
import PageLoader from "./pageLoader";
import Image from "next/image";
import img1 from "@/public/max-bender-1zFK0pkHo9w-unsplash.jpg";
import img2 from "@/public/melyna-cote-rLWHLNQFQL8-unsplash.jpg";
import { Noto_Sans } from "next/font/google";
import { useRef } from "react";

const noto = Noto_Sans({ subsets: ["latin"] });

export default function Home() {
	const workSectionRef = useRef<any>(null);
	const aboutSectionRef = useRef<any>(null);
	const contactSectionRef = useRef<any>(null);

	return (
		<div className="w-full h-full overflow-x-hidden">
			<PageLoader />
			<div className="w-screen h-screen -z-10 fixed top-0 left-0 flex">
				<section className="h-full border-l border-dim_gray ml-6" />
				<section className="h-full border-l border-dim_gray ml-6" />
				<section className="h-full border-l border-dim_gray ml-6" />
				<section className="h-full border-l border-dim_gray ml-6" />
				<section className="h-full border-l border-dim_gray ml-6" />
				<section className="h-full border-l border-dim_gray ml-6" />
				<section className="h-full border-l border-dim_gray ml-6" />
			</div>
			<div className="w-screen h-screen flex flex-col">
				<ScrollHeader workRef={workSectionRef} aboutRef={aboutSectionRef} contactRef={contactSectionRef} />
				<section className="flex justify-around p-8">
					<p className={`${noto.className} text-9xl font-medium text-foreground whitespace-pre-line tracking-wide p-8`}>
						{"PERSONAL\nPORTFOLIO"}
					</p>
					<div className="relative w-[500px] h-[500px]">
						<Image alt="moons" className="object-cover" fill src={img2} />
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
					<Image alt="pic2" className="object-cover" fill src={img2} />
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
