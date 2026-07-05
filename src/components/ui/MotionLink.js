"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function MotionLink({ children, className = "", ...props }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="contents"
    >
      <Link className={className} {...props}>
        {children}
      </Link>
    </motion.div>
  );
}
