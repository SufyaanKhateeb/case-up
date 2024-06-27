"use client";
import Logo from "@/public/logo-star.svg";
import { motion, cubicBezier, useAnimate, useMotionValue, useTransform, animate as globalAnimate } from "framer-motion";
import Lottie from "lottie-react";
import Image from "next/image";
import { useEffect } from "react";
import CubeAnimation from "@/public/cube-animation.json";

export default function PageLoader() {
	const loadingCount = useMotionValue(0);
	const rounded = useTransform(loadingCount, (latest) => `${Math.round(latest)}%`);
	const [scope, animate] = useAnimate();

	useEffect(() => {
		const runLoadingAnimation = async () => {
			await animate(loadingCount, 100, { duration: Math.ceil(Math.random() * 2), ease: cubicBezier(0.45, 0, 0.55, 1) });
			await Promise.all([
				animate(".slide-right", { x: "100%" }, { delay: 0.1, duration: 0.3, ease: cubicBezier(0.12, 0, 0.39, 0) }),
				animate(".slide-down-vanish", { y: 200, opacity: 0, scale: 0.5 }, { delay: 0.1, duration: 0.3, ease: cubicBezier(0.12, 0, 0.39, 0) }),
				animate(".slide-up", { y: "-100%" }, { delay: 0.1, duration: 0.3, ease: cubicBezier(0.64, 0, 0.78, 0) }),
			]);

			// show website greetings animation & hide page loader
			globalAnimate("#website-greetings-section", { top: 0, opacity: 1 }, { duration: 0.5, ease: "easeInOut"});
			await animate(scope.current, { opacity: 0 }, { duration: 0.1, ease: cubicBezier(0.12, 0, 0.39, 0) });
			scope.current.style.display = 'none';

		};
		runLoadingAnimation();
	}, []);

	return (
		<div ref={scope} className="page-loader-main z-30 w-screen h-screen fixed top-0 left-0 bg-background">
			<div className="slide-up w-full h-[10vh] absolute top-0 left-0">
				<div className="w-full h-full flex items-center justify-between border-b py-[2.5vh] px-[2vw] border-dim_gray">
					<div className="relative w-auto h-[5vh]">
						<Image className="!h-full w-auto" width={1526} height={624} alt="logo" src={Logo} layout="intrinsic" />
					</div>
					<h1 className="uppercase text-md font-semibold text-foreground">In pursuit of excellence</h1>
				</div>
				<motion.div style={{ width: rounded }} className="absolute top-0 left-0 h-[10vh] mix-blend-difference bg-foreground" />
			</div>
			<motion.h1 className="slide-right absolute p-2 bottom-0 right-0 text-foreground text-8xl">{rounded}</motion.h1>
			<motion.div initial={{ scale: 1 }} className="z-20 slide-down-vanish flex items-center justify-center w-full h-full absolute bottom-0 right-0">
				<Lottie animationData={CubeAnimation} loop />
			</motion.div>
		</div>
	);
}
