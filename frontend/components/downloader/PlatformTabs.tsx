"use client";

import { motion } from "framer-motion";
import { FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa6";
import type { IconType } from "react-icons";
import type { Platform } from "@/lib/types";
import { cn } from "@/lib/utils";

// lucide-react dropped brand/logo icons a while back (trademark reasons),
// so platform logos come from react-icons instead — lucide-react still
// covers every generic UI icon used elsewhere in the app.
const TABS: { id: Platform; label: string; icon: IconType }[] = [
  { id: "instagram", label: "Instagram", icon: FaInstagram },
  { id: "facebook", label: "Facebook", icon: FaFacebook },
  { id: "youtube", label: "YouTube", icon: FaYoutube },
];

export function PlatformTabs({
  active,
  onChange,
}: {
  active: Platform;
  onChange: (platform: Platform) => void;
}) {
  return (
    <div className="glass relative flex w-full max-w-md rounded-full p-1" role="tablist">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-medium transition-colors",
              isActive ? "text-white" : "text-muted hover:text-foreground"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="platform-tab-pill"
                className="btn-gradient absolute inset-0 -z-10 rounded-full"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <Icon size={15} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
