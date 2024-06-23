"use client";
import dynamic from "next/dynamic";
import React, { MutableRefObject, useRef, useState } from "react";
import Logo from "@/public/logo-star.svg";
import Image from "next/image";
import { cubicBezier, motion, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";

const scrollToId = (id: string) => {
	const ele = document.getElementById(id);
	ele?.scrollIntoView({ behavior: "smooth" });
};

const NavigationMenuCompoent = (props: {
	withLogo: boolean;
	workRef: MutableRefObject<HTMLDivElement>;
	aboutRef: MutableRefObject<HTMLDivElement>;
	contactRef: MutableRefObject<HTMLDivElement>;
}) => {
	const { scrollYProgress: workScroll } = useScroll({ target: props.workRef, offset: ["start end", "end start"] });
	const { scrollYProgress: aboutScroll } = useScroll({ target: props.aboutRef, offset: ["start end", "end start"] });
	const { scrollYProgress: contactScroll } = useScroll({ target: props.contactRef, offset: ["start end", "end start"] });

	const workColor = useTransform(workScroll, [0, 0.2, 0.5, 0.8], ["#c9d4d9", "#ef902f", "#ef902f", "#c9d4d9"]);
	const aboutColor = useTransform(aboutScroll, [0, 0.2, 0.5, 0.8], ["#c9d4d9", "#ef902f", "#ef902f", "#c9d4d9"]);
	const contactColor = useTransform(contactScroll, [0, 0.2, 0.5, 0.8], ["#c9d4d9", "#ef902f", "#ef902f", "#c9d4d9"]);

	return (
		<NavigationMenu>
			<NavigationMenuList className="backdrop-blur-2xl bg-foreground/5 rounded-2xl">
				{props.withLogo && (
					<NavigationMenuItem>
						<button
							onClick={(e) => {
								e.preventDefault();
								scroll({ top: 0, behavior: "smooth" });
							}}
							className={"bg-transparent hover:bg-transparent px-2"}
						>
							<Image height={60} width={70} alt="logo" src={Logo} />
						</button>
					</NavigationMenuItem>
				)}
				<NavigationMenuItem>
					<motion.a
						style={{
							color: workColor,
						}}
						onClick={(e) => {
							e.preventDefault();
							scrollToId("work-section");
						}}
						className={cn(navigationMenuTriggerStyle(), `bg-transparent hover:bg-transparent cursor-pointer`)}
					>
						Work
					</motion.a>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<motion.a
						style={{ color: aboutColor }}
						onClick={(e) => {
							e.preventDefault();
							scrollToId("about-section");
						}}
						className={cn(navigationMenuTriggerStyle(), "bg-transparent hover:bg-transparent cursor-pointer")}
					>
						About
					</motion.a>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<motion.a
						style={{ color: contactColor }}
						onClick={(e) => {
							e.preventDefault();
							scrollToId("contact-section");
						}}
						className={cn(navigationMenuTriggerStyle(), "bg-transparent hover:bg-transparent cursor-pointer")}
					>
						Contact
					</motion.a>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	);
};

type Props = {
	workRef: MutableRefObject<HTMLDivElement>;
	aboutRef: MutableRefObject<HTMLDivElement>;
	contactRef: MutableRefObject<HTMLDivElement>;
};

const ScrollHeader = (props: Props) => {
	const { workRef, aboutRef, contactRef } = props;
	const triggerRef = useRef(null);
	const [hideHeader, setHideHeader] = useState(false);
	const { scrollY, scrollYProgress } = useScroll({ target: triggerRef, offset: ["start end", "end end"] });

	const springScroll = useSpring(scrollYProgress, {
		stiffness: 200,
		damping: 30,
		restDelta: 0.002,
	});

	const imageTop = useTransform(springScroll, [0, 0.4], ["38vh", "2.5vh"]);
	const imageHeight = useTransform(springScroll, [0, 0.4], ["60vh", "5vh"]);

	// hide and show header if when scrolling down and up respectively
	useMotionValueEvent(scrollY, "change", (latest) => {
		const prev = scrollY.getPrevious();
		const isScrollTriggerComplete = scrollYProgress.get() === 1;
		const isScrollingDown = prev && latest > prev;
		setHideHeader(isScrollTriggerComplete);
		// setHideHeader(!!(isScrollTriggerComplete && isScrollingDown));
	});

	return (
		<div className="relative z-10">
			<div className="header-spacer h-[10vh]" />
			<motion.div
				variants={{ visible: { y: 0 }, hidden: { y: -100 } }}
				animate={hideHeader ? "hidden" : "visible"}
				transition={{ duration: 0.7, ease: cubicBezier(0, 0.55, 0.45, 1) }}
				className="fixed top-0 left-0 w-screen h-[10vh]"
			>
				<div className="w-full h-full flex items-center justify-end border-b py-[2vh] px-[2vw] bg-background border-dim_gray">
					<motion.div style={{ top: imageTop, height: imageHeight }} className="absolute w-auto max-w-[95vw] left-[2vw]">
						<Link href={"/"}>
							<Image className="!h-full w-auto" width={1526} height={624} alt="logo" src={Logo} layout="intrinsic" />
						</Link>
					</motion.div>
					<NavigationMenuCompoent withLogo={false} workRef={workRef} aboutRef={aboutRef} contactRef={contactRef} />
					{/* <h1 className="uppercase text-xl text-dim_gray">In pursuit of excellence</h1> */}
				</div>
			</motion.div>
			<motion.div
				variants={{ visible: { y: 0 }, hidden: { y: 100 } }}
				animate={hideHeader ? "visible" : "hidden"}
				transition={{ duration: 0.7, ease: cubicBezier(0, 0.55, 0.45, 1) }}
				className="fixed left-0 bottom-0 w-screen grid place-items-center p-2"
			>
				<NavigationMenuCompoent withLogo workRef={workRef} aboutRef={aboutRef} contactRef={contactRef} />
			</motion.div>
			<div className="absolute top-0 left-0 w-screen h-screen flex flex-col pointer-events-none">
				<div className="min-w-screen min-h-screen" />
				<div ref={triggerRef} className="scroll-trigger min-h-[50vh]" />
			</div>
		</div>
	);
};

export default dynamic(() => Promise.resolve(ScrollHeader), { ssr: false });
