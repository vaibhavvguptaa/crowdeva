"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { memo } from "react";
import { MenuLink, submenuVariants, ANIMATION_DURATION } from "./Types";

interface MobileSubmenuProps {
  links: MenuLink[];
  onClose: () => void;
}

const MobileSubmenu = memo(({ links, onClose }: MobileSubmenuProps) => (
  <motion.div
    variants={submenuVariants}
    initial="hidden"
    animate="visible"
    exit="hidden"
    transition={{ duration: ANIMATION_DURATION }}
    className="pl-4 py-1 space-y-1 overflow-hidden"
    role="menu"
  >
    {links.map((link) => (
      <Link
        key={link.name}
        href={link.href}
        className="py-2 px-2 text-sm hover:bg-neutral-800 focus-visible:bg-neutral-800 rounded flex items-center gap-2 transition-colors focus-visible:outline-none"
        role="menuitem"
        onClick={onClose}
        prefetch={false}
      >
        <span className="text-blue-300" aria-hidden="true">
          {link.icon}
        </span>
        {link.name}
      </Link>
    ))}
  </motion.div>
));

MobileSubmenu.displayName = "MobileSubmenu";
export default MobileSubmenu;