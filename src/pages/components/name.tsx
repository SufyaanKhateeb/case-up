"use client";
import React, { useEffect, useState } from "react";
import pxToPercentage from "~/utils/pxToPercentage";
import { motion, useScroll, useTransform } from "framer-motion";

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

  const positionProgress = useTransform(scrollYProgress, [0, 1], [3.125, 50]);
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
  // console.log(scrollYProgress.get())
  // scrollYProgress.onChange(() => console.log(scrollYProgress.get()));
  return (
    <motion.div
      className="absolute flex items-center"
      style={{
        fontSize: `${pxToPercentage(fontSize)}vw`,
        gap: `${pxToPercentage(16)}vw`,
        top: `${positionAttr}%`,
        left: `${positionAttr}%`,
        transform: `translate(-${positionAttr}%, -${positionAttr}%)`,
      }}
    >
      <motion.p
        className="text-grey-light"
        style={{
          fontWeight: 700,
          letterSpacing: `${pxToPercentage(letterSpacing)}vw`,
          lineHeight: "normal",
        }}
      >
        MSK
      </motion.p>
      {fontSize == 46 && (
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
      )}
    </motion.div>
  );
};

export default NameComponent;
