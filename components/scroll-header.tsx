"use client";
import dynamic from "next/dynamic";
import React, { MutableRefObject, useMemo, useRef, useState } from "react";
import Logo from "./svg/logo";
import { cubicBezier, motion } from "framer-motion";
import { cn, getPxValue } from "@/lib/utils";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import MotionPathPlugin from "gsap/MotionPathPlugin";
import DrawPlugin from "@/lib/DrawPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScrollToPlugin from "gsap/ScrollToPlugin";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "@/tailwind.config";
import useWindowDimensions from "@/lib/useWindowDimensions";

const { theme } = resolveConfig(tailwindConfig);

const NavigationMenuCompoent = (props: {
    withLogo: boolean;
    workRef: MutableRefObject<HTMLDivElement>;
    aboutRef: MutableRefObject<HTMLDivElement>;
    contactRef: MutableRefObject<HTMLDivElement>;
}) => {
    const { contextSafe } = useGSAP({});

    const scrollToId = contextSafe((id: string) => {
        gsap.registerPlugin(ScrollToPlugin);
        gsap.to(window, { scrollTo: `#${id}`, duration: 0.5 });
    });

    useGSAP(() => {
        gsap.registerPlugin(ScrollTrigger);
        const t1 = gsap
            .timeline({
                scrollTrigger: {
                    trigger: "#work-section",
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true,
                },
            })
            .fromTo("#work-section-link", { color: "#c9d4d9" }, { color: "#ef902f" })
            .fromTo("#work-section-link", { color: "#ef902f" }, { color: "#c9d4d9" });

        t1.seek(t1.duration());

        const t2 = gsap
            .timeline({
                scrollTrigger: {
                    trigger: "#about-section",
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true,
                },
            })
            .fromTo("#about-section-link", { color: "#c9d4d9" }, { color: "#ef902f" })
            .fromTo("#about-section-link", { color: "#ef902f" }, { color: "#c9d4d9" });

        t2.seek(t2.duration());

        const t3 = gsap
            .timeline({
                scrollTrigger: {
                    trigger: "#contact-section",
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true,
                },
            })
            .fromTo("#contact-section-link", { color: "#c9d4d9" }, { color: "#ef902f" })
            .fromTo("#contact-section-link", { color: "#ef902f" }, { color: "#c9d4d9" });

        t3.seek(t3.duration());
    }, []);

    const linkClassName = useMemo(() => {
        return cn("text-foreground hover:!text-white cursor-pointer", navigationMenuTriggerStyle(), {
            "bg-transparent hover:bg-transparent": props.withLogo,
        });
    }, [props.withLogo]);

    return (
        <NavigationMenu>
            <NavigationMenuList className={`backdrop-blur-2xl ${props.withLogo && "bg-foreground/5"} rounded-2xl`}>
                {props.withLogo && (
                    <NavigationMenuItem className="flex items-center justify-center">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                scroll({ top: 0, behavior: "smooth" });
                            }}
                            className={"w-[5vw] bg-transparent hover:bg-transparent mx-2"}
                        >
                            <Logo className="relative w-[5vw] h-auto" />
                        </button>
                    </NavigationMenuItem>
                )}
                <NavigationMenuItem>
                    <a
                        id="work-section-link"
                        onClick={(e) => {
                            e.preventDefault();
                            scrollToId("work-section");
                        }}
                        className={linkClassName}
                    >
                        Work
                    </a>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <a
                        id="about-section-link"
                        onClick={(e) => {
                            e.preventDefault();
                            scrollToId("about-section");
                        }}
                        className={linkClassName}
                    >
                        About
                    </a>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <a
                        id="contact-section-link"
                        onClick={(e) => {
                            e.preventDefault();
                            scrollToId("contact-section");
                        }}
                        className={linkClassName}
                    >
                        Contact
                    </a>
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
    const [hideHeader, setHideHeader] = useState(false);
    const { width } = useWindowDimensions();
    const logoRef = useRef(null);
    const smWidth = width && width < getPxValue(theme.screens.sm);

    useGSAP(() => {
        gsap.timeline({
            scrollTrigger: {
                trigger: ".header-scroll-trigger",
                start: "top bottom",
                end: "bottom bottom",
                scrub: true,
            },
        })
            .fromTo(
                "#header-logo .msk-text",
                { width: "92vw", translateX: "2vw", translateY: "61vh" },
                { width: smWidth ? "26vw" : "11vw", translateX: "0vw", translateY: "0vh" },
                0
            )
            .fromTo(
                "#header-logo .star-and-path",
                { width: "92vw", translateX: "2vw", translateY: "61vh" },
                { width: smWidth ? "26vw" : "11vw", translateX: "0vw", translateY: "0vh" },
                0
            );
    }, [smWidth]);

    useGSAP(() => {
        gsap.timeline({
            scrollTrigger: {
                trigger: ".header-scroll-trigger",
                start: "top bottom",
                end: "bottom+=200px bottom",
                scrub: true,
                onUpdate: (self) => {
                    if (self.progress >= 1 && self.direction === 1) {
                        setHideHeader(true);
                    } else if (self.progress < 1 && self.direction === -1) {
                        setHideHeader(false);
                    }
                },
            },
        });
    }, []);

    const [timeline, setTimeline] = useState<gsap.core.Timeline | null>(null);

    const { contextSafe } = useGSAP(
        () => {
            gsap.registerPlugin(MotionPathPlugin, DrawPlugin);
            const totalTime = 1.5;
            const pathTimeline = gsap
                .timeline()
                .fromTo(".star-path", { visibility: "hidden" }, { visibility: "visible", duration: 0 })
                .fromTo(".star-path", { drawSVG: "0" }, { drawSVG: "0% 4%", ease: "none", duration: (0.0824 * totalTime) / 2 }) // enter top
                .to(".star-path", { drawSVG: "30% 48.5%", ease: "none", duration: ((1 - 0.0824) * totalTime) / 2 }) // duration adjusted to (0% till 48.5% of path)
                .to(".star-path", { drawSVG: "98% 100%", ease: "none", duration: totalTime / 2 })
                .to(".star-path", { drawSVG: "100% 100%", ease: "none", duration: (0.0824 * totalTime) / 2 });
            const masterTimeline = gsap
                .timeline({ delay: 1 })
                .to(".star-and-path", { zIndex: -10, duration: 0 })
                .fromTo(".star", { visibility: "hidden" }, { visibility: "visible", duration: 0 })
                .add(pathTimeline, 0)
                .fromTo(
                    ".star",
                    {
                        scale: 0,
                        // rotation: -2 * 180,
                    },
                    {
                        scale: 0.5,
                        // rotation: -180,
                        ease: "none",
                        motionPath: {
                            path: ".star-path",
                            align: ".star-path",
                            alignOrigin: [0.5, 0.5],
                            start: 0,
                            autoRotate: true,
                            end: 0.485,
                        },
                        duration: totalTime / 2,
                    },
                    0
                )
                .to(".star-and-path", { zIndex: 200, duration: 0 }, ">")
                .to(
                    ".star",
                    {
                        scale: 1,
                        // rotation: 0,
                        ease: "none",
                        motionPath: {
                            path: ".star-path",
                            align: ".star-path",
                            alignOrigin: [0.5, 0.5],
                            start: 0.485,
                            autoRotate: true,
                            end: 1,
                        },
                        duration: totalTime / 2,
                    },
                    ">"
                );

            // masterTimeline.seek(masterTimeline.duration());
            setTimeline(masterTimeline);
        },
        { scope: logoRef }
    );

    const showStar = contextSafe(() => {
        timeline && timeline.play();
    });

    const hideStar = contextSafe(() => {
        timeline && timeline.reverse();
    });

    const [dir, setDir] = useState(false);
    return (
        <div className="relative z-10">
            <div className="header-spacer h-[10vh]" />
            <motion.div
                variants={{ visible: { y: 0 }, hidden: { y: "-100%" } }}
                animate={hideHeader ? "hidden" : "visible"}
                transition={{ duration: 0.7, ease: cubicBezier(0, 0.55, 0.45, 1) }}
                className="fixed top-0 left-0 w-screen h-[10vh]"
            >
                <div className="relative w-full h-full flex items-center border-b px-[2vw] bg-background border-dim_gray">
                    <div ref={logoRef} className="absolute w-[11vw] z-[100] float-left">
                        <Logo
                            onClick={() => {
                                if (dir) {
                                    setDir(false);
                                    showStar();
                                } else {
                                    setDir(true);
                                    hideStar();
                                }
                            }}
                            id="header-logo"
                            className="relative object-contain object-[-611%_50%] w-[11vw] max-w-[130rem]"
                        />
                        {/* <Image id="header-logo" src={Logo} alt="logo" className="relative object-contain object-[-611%_50%] w-[11vw] max-w-[130rem]" loading="eager" /> */}
                    </div>
                    <div className="ml-auto">
                        <NavigationMenuCompoent withLogo={false} workRef={workRef} aboutRef={aboutRef} contactRef={contactRef} />
                    </div>
                </div>
            </motion.div>
            <motion.div
                variants={{ visible: { y: 0 }, hidden: { y: 100 } }}
                animate={hideHeader ? "visible" : "hidden"}
                transition={{ duration: 0.7, ease: cubicBezier(0, 0.55, 0.45, 1) }}
                className="fixed left-0 bottom-0 w-screen grid place-items-center p-2"
            >
                <NavigationMenuCompoent withLogo={true} workRef={workRef} aboutRef={aboutRef} contactRef={contactRef} />
            </motion.div>
            <div className="absolute top-0 left-0 w-screen h-screen flex flex-col pointer-events-none">
                <div className="min-w-screen min-h-screen" />
                <div id="header-scroll-trigger" className="header-scroll-trigger min-h-[50vh]" />
            </div>
        </div>
    );
};

export default dynamic(() => Promise.resolve(ScrollHeader), { ssr: false });
