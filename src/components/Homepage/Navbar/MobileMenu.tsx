"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { memo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import MobileSubmenu from "./MobileSubmenu";
import { MenuItem, mobileMenuVariants, ANIMATION_DURATION } from "./Types";

interface MobileMenuProps {
  isOpen: boolean;
  menuItems: MenuItem[];
  openLabel: string | null;
  onToggleSubmenu: (label: string) => void;
  onClose: () => void;
}

const MobileMenu = memo(({ 
  isOpen, 
  menuItems, 
  openLabel, 
  onToggleSubmenu,
  onClose
}: MobileMenuProps) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        variants={mobileMenuVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: ANIMATION_DURATION }}
        className="md:hidden bg-neutral-950 overflow-hidden fixed top-16 left-0 right-0 shadow-lg"
        role="navigation"
        aria-label="Mobile menu"
      >
        <div className="px-4 py-3 space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {menuItems.map((item) => (
            <div key={item.label} className="border-b border-neutral-800 pb-2">
              {item.href ? (
                <Link
                  href={item.href}
                  className="block py-2 px-2 font-medium hover:bg-neutral-800 focus-visible:bg-neutral-800 rounded transition-colors focus-visible:outline-none"
                  onClick={onClose}
                  prefetch={false}
                >
                  {item.label}
                </Link>
              ) : (
                <div className="space-y-1">
                  <button
                    onClick={() => onToggleSubmenu(item.label)}
                    className="w-full flex justify-between items-center py-2 px-2 font-medium hover:bg-neutral-800 focus-visible:bg-neutral-800 rounded transition-colors focus-visible:outline-none cursor-pointer"
                    aria-expanded={openLabel === item.label}
                    aria-controls={`mobile-submenu-${item.label}`}
                  >
                    <span>{item.label}</span>
                    {openLabel === item.label ? (
                      <ChevronUp
                        size={16}
                        className="transition-transform"
                        aria-hidden="true"
                      />
                    ) : (
                      <ChevronDown
                        size={16}
                        className="transition-transform"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                  <AnimatePresence>
                    {openLabel === item.label && item.links && (
                      <MobileSubmenu links={item.links} onClose={onClose} />
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          ))}
          <div className="pt-4 space-y-2">
            <Link
              href="/signin"
              className="block w-full text-center py-2 px-4 font-medium hover:bg-neutral-800 focus-visible:bg-neutral-800 rounded transition-colors focus-visible:outline-none"
              onClick={onClose}
              prefetch={false}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="block w-full text-center py-2 px-4 bg-white text-black font-medium rounded hover:opacity-90 focus-visible:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              onClick={onClose}
              prefetch={false}
            >
              Get Started
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

MobileMenu.displayName = "MobileMenu";
export default MobileMenu;