import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import type { PropsWithChildren } from "react";
import { cn } from "../lib/utils";

type Variant = "primary" | "secondary" | "ghost";

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: PropsWithChildren<HTMLMotionProps<"button"> & { variant?: Variant }>) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -1 }}
      className={cn(
        "relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-full px-5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-violet/60",
        variant === "primary" &&
          "bg-white text-ink shadow-[0_0_40px_rgba(255,255,255,0.18)] hover:bg-zinc-100",
        variant === "secondary" &&
          "border border-white/10 bg-white/[0.07] text-white hover:border-white/20 hover:bg-white/[0.11]",
        variant === "ghost" && "text-zinc-300 hover:bg-white/[0.07] hover:text-white",
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
