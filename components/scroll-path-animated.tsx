import React from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import MotionPathPlugin from "gsap/MotionPathPlugin";
import ScrollTrigger from "gsap/ScrollTrigger";
import DrawSVGPlugin from "gsap/DrawSVGPlugin";
import Star from "./svg/star";

type Props = {};

const ScrollPathAnimated = (props: Props) => {

    useGSAP(() => {
        gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, DrawSVGPlugin);

        const t = gsap
            .timeline({
                scrollTrigger: {
                    trigger: "#progress-scroll-trigger",
                    start: "top top",
                    end: "top+=90% top",
                    scrub: true,
                },
            })
            .to(".path-1", { drawSVG: "100% 100%", duration: 1, ease: "none" }, 0)
            .to(
                ".scroll-path-star",
                {
                    motionPath: {
                        path: ".path-1",
                        align: ".path-1",
                        alignOrigin: [0.5, 0.5],
                        autoRotate: true,
                    },
                    ease: "none",
                    duration: 1,
                },
                0
            )
            .to(".path-2", { drawSVG: "100% 100%", duration: 1, ease: "none" }, 1)
            .to(
                ".scroll-path-star",
                {
                    motionPath: {
                        path: ".path-2",
                        align: ".path-2",
                        alignOrigin: [0.5, 0.5],
                        autoRotate: true,
                    },
                    ease: "none",
                    duration: 1,
                },
                1
            )
            .to(".path-3", { drawSVG: "100% 100%", duration: 1, ease: "none" }, 2)
            .to(
                ".scroll-path-star",
                {
                    motionPath: {
                        path: ".path-3",
                        align: ".path-3",
                        alignOrigin: [0.5, 0.5],
                        autoRotate: true,
                    },
                    ease: "none",
                    duration: 1,
                },
                2
            )
            .to(".path-4", { drawSVG: "0% 0%", duration: 1, ease: "none" }, 3)
            .from(
                ".scroll-path-star",
                {
                    motionPath: {
                        path: ".path-4",
                        align: ".path-4",
                        alignOrigin: [0.5, 0.5],
                        autoRotate: true,
                    },
                    ease: "none",
                    duration: 1,
                },
                3
            );
        t.seek(t.duration());
    }, []);

    return (
        <div className="absolute w-screen h-screen">
            <div id="progress-scroll-trigger" className="absolute top-0 left-0 w-[1px] h-screen"></div>
            <div className="absolute top-[20vh] left-[4vw] w-[2px] h-[72vh]">
                <svg
                    preserveAspectRatio="none"
                    overflow="hidden"
                    width="2"
                    height="100%"
                    viewBox="0 0 2 700"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path className="path-1" d="M1 0V700" stroke="#C9D4DA" strokeWidth="2" strokeLinecap="square" />
                </svg>
            </div>
            <div className="absolute bottom-[4vh] left-[4vw]">
                <svg width="4vh" height="4vh" preserveAspectRatio="none" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path className="path-2" d="M1 0C1 19 20 39 40 38" stroke="#C9D4DA" strokeWidth="2" />
                </svg>
            </div>
            <div className="absolute bottom-[4vh] left-[calc(4vw+4vh-1px)] w-[calc(100vw-6vw-8vh+1px)]">
                <svg width="100%" height="2" viewBox="0 0 700 2" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path className="path-3" d="M0 1L700 1" stroke="#C9D4DA" strokeWidth="2" />
                </svg>
            </div>
            <div className="absolute bottom-[2px] right-[2vw]">
                <svg width="4vh" className="h-[4vh]" preserveAspectRatio="none" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path className="path-4" d="M39 39C39 9.88662 24.59 1 1 1" stroke="#C9D4DA" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </div>
            <Star className="scroll-path-star" />
        </div>
    );
};

export default ScrollPathAnimated;
