"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export function ErrorState({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mt-6 flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/8 px-5 py-4 text-sm text-red-500 dark:text-red-300"
      role="alert"
    >
      <AlertTriangle size={18} className="mt-0.5 shrink-0" />
      <p>{message}</p>
    </motion.div>
  );
}
