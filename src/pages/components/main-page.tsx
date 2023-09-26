"use client";
import React, { useRef } from "react";
import styles from "./main-page.module.css";
import NameComponent from "./name";

type Props = unknown;

const Main = (props: Props) => {
  const ref = useRef(null);

  return (
    <div ref={ref} className="z-10 h-screen min-h-screen overflow-auto">
      <div className={styles["text-container"]}>
        <NameComponent containerRef={ref} />
      </div>
    </div>
  );
};

export default Main;
