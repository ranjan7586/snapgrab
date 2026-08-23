"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="glass mt-6 flex flex-col items-center gap-3 rounded-2xl px-6 py-10 text-center"
    >
      <Loader2 className="animate-spin text-accent-violet" size={28} />
      <p className="font-medium text-foreground">Fetching your media…</p>
      <p className="text-sm text-muted">This usually takes a couple of seconds.</p>
    </motion.div>
  );
}
