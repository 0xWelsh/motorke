"use client";

import { motion } from "framer-motion";

export default function MotionButton({
  children,
  className = "",
  as: Tag = "button",
  whileHover = { scale: 1.02 },
  whileTap = { scale: 0.97 },
  ...props
}) {
  const MotionTag = motion[Tag];
  return (
    <MotionTag
      className={className}
      whileHover={whileHover}
      whileTap={whileTap}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...props}
    >
      {children}
    </MotionTag>
  );
}
