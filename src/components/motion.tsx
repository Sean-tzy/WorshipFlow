import { motion } from "framer-motion";
import type { PropsWithChildren } from "react";
import { cn } from "../lib/utils";

export function Page({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn("min-h-screen", className)}
    >
      {children}
    </motion.main>
  );
}

export function MagneticCard({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={cn("premium-card", className)}
    >
      {children}
    </motion.div>
  );
}
