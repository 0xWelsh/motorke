"use client";

import { motion } from "framer-motion";

export default function FadeIn({
  children,
  className = "",
  delay = 0,
  direction = "up",
  duration = 0.5,
  distance = 24,
  once = true,
  as: Tag = "div",
}) {
  const variants = {
    hidden: {
      opacity: 0,
      y: direction === "up" ? distance : direction === "down" ? -distance : 0,
      x: direction === "left" ? distance : direction === "right" ? -distance : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-40px" }}
    >
      {children}
    </motion.div>
  );
}
