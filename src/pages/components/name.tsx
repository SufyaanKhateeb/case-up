"use client";
import React, { useEffect, useState } from "react";
import pxToPercentage from "~/utils/pxToPercentage";
import { motion, useScroll, useTransform } from "framer-motion";
import dynamic from "next/dynamic";

const NameComponent = (props: {
  containerRef: React.RefObject<HTMLElement>;
}) => {
  const { scrollYProgress } = useScroll({
    container: props.containerRef,
    offset: ["end", "start"],
  });

  const [fontSize, setFontSize] = useState(504);
  const [positionAttr, setPositionAttr] = useState(50);
  const [letterSpacing, setLetterSpacing] = useState(50);

  const positionProgress = useTransform(
    scrollYProgress,
    [0, 1],
    [pxToPercentage(60, 1080), 50],
  );
  const fontSizeProgress = useTransform(scrollYProgress, [0, 1], [46, 504]);
  const letterSpacingProgress = useTransform(scrollYProgress, [0, 1], [0, 50]);

  useEffect(() =>
    fontSizeProgress.on("change", (latest) => setFontSize(latest)),
  );
  useEffect(() =>
    positionProgress.on("change", (latest) => setPositionAttr(latest)),
  );
  useEffect(() =>
    letterSpacingProgress.on("change", (latest) => setLetterSpacing(latest)),
  );

  return (
    <div className="pointer-events-none sticky top-0">
      <motion.a
        className="text-grey-light no-underline will-change-transform"
        href="/"
        style={{
          display: "inline-block",
          position: "relative",
          top: `${positionAttr}vh`,
          margin: "0 auto",
          left: `50vw`,
          transform: `translate(-50%, -50%)`,
          pointerEvents: "auto",
          fontSize: `${pxToPercentage(fontSize)}vw`,
          fontWeight: 700,
          letterSpacing: `${pxToPercentage(letterSpacing)}vw`,
          lineHeight: "normal",
        }}
      >
        MSK
        <motion.div className="pointer-events-auto absolute top-0 w-full pt-[50%]" />
        {/* {fontSize == 46 && (
        <div
          className="bg-red-400 text-slate-800"
          style={{
            fontSize: `${pxToPercentage(46)}vw`,
            fontWeight: `${pxToPercentage(500)}vw`,
            padding: `0 ${pxToPercentage(14)}vw`,
            borderRadius: `${pxToPercentage(8)}vw`,
          }}
        >
          Muhammad Sufyaan Khateeb
        </div>
      )} */}
      </motion.a>
    </div>
  );
};

export default dynamic(() => Promise.resolve(NameComponent), {
  ssr: false,
});
