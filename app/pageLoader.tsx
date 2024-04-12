"use client";
import Logo from "@/public/logo.svg";
import { motion, cubicBezier, useAnimate, useMotionValue, useTransform } from "framer-motion";
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
			await animate(loadingCount, 100, { duration: 1, ease: cubicBezier(0.45, 0, 0.55, 1) });
			await Promise.all([
				animate(".slide-down", { y: "100%" }, { duration: 0.4, ease: cubicBezier(0.12, 0, 0.39, 0) }),
				animate(".slide-up", { y: "-100%" }, { duration: 0.3, ease: cubicBezier(0.12, 0, 0.39, 0) }),
			]);
			await animate(scope.current, { opacity: 0 }, { duration: 0.4, ease: cubicBezier(0.12, 0, 0.39, 0) });
			scope.current.style.display = 'none';
		};
		runLoadingAnimation();
	});

	return (
		<div ref={scope} className="page-loader-main z-30 w-screen h-screen fixed top-0 left-0 bg-background">
			<div className="slide-up w-full h-[10vh] absolute top-0 left-0">
				<div className="w-full h-full flex items-center justify-between border-b py-[2vh] px-[2vw] border-dim_gray">
					<div className="relative h-[6vh] w-[7vw]">
						<Image fill alt="logo" src={Logo} />
					</div>
					<h1 className="uppercase text-xl font-semibold text-foreground">In pursuit of excellence</h1>
				</div>
				<motion.div style={{ width: rounded }} className="absolute top-0 left-0 h-[10vh] mix-blend-difference bg-foreground" />
			</div>
			<motion.h1 className="absolute p-2 bottom-0 left-0 text-foreground text-xl">{rounded}</motion.h1>
			<Lottie className="slide-down absolute bottom-0 right-0" animationData={CubeAnimation} loop />
		</div>
	);
}
