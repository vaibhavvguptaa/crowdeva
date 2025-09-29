"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import Logo from "./Logo";
import CTAButtons from "./CTAButtons";
import DropdownMenu from "./DropdownMenu";
import MobileMenu from "./MobileMenu";
import { menuItems } from "./menuItems";
import { HOVER_DELAY } from "./Types";

export default function Navbar() {
  const [openLabel, setOpenLabel] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => {
      const newState = !prev;
      document.body.style.overflow = newState ? 'hidden' : '';
      if (!newState) setOpenLabel(null);
      return newState;
    });
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    setOpenLabel(null);
    document.body.style.overflow = '';
  }, []);

  const handleToggleSubmenu = useCallback((label: string) => {
    setOpenLabel(prev => prev === label ? null : label);
  }, []);

  const handleMouseEnter = useCallback((label: string) => {
    hoverTimeoutRef.current && clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => setOpenLabel(label), HOVER_DELAY);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current && clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => setOpenLabel(null), HOVER_DELAY);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenLabel(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenLabel(null);
        setMobileMenuOpen(false);
        document.body.style.overflow = '';
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      hoverTimeoutRef.current && clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  return (
    <header className="bg-neutral-900 text-white border-b border-neutral-800 sticky top-0 z-50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between relative">
        <Logo />

        {/* Desktop Navigation */}
        <nav 
          className="hidden md:flex gap-6 items-center" 
          ref={dropdownRef}
          role="navigation"
          aria-label="Main navigation"
        >
          {menuItems.map((item) => (
            <div
              key={item.label}
              className="relative group"
              onMouseEnter={() => item.links && handleMouseEnter(item.label)}
              onMouseLeave={() => item.links && handleMouseLeave()}
            >
              {item.href ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-1 text-sm font-medium hover:text-blue-300 focus-visible:text-blue-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 rounded px-2 py-1"
                  prefetch={false}
                >
                  {item.label}
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => handleToggleSubmenu(item.label)}
                    className="flex items-center gap-1 text-sm font-medium hover:text-blue-300 focus-visible:text-blue-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 rounded px-2 py-1"
                    aria-expanded={openLabel === item.label}
                    aria-haspopup="true"
                    aria-controls={`dropdown-${item.label}`}
                  >
                    {item.label}
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${
                        openLabel === item.label ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  <DropdownMenu 
                    item={item} 
                    isOpen={openLabel === item.label} 
                    onClose={() => setOpenLabel(null)}
                  />
                </>
              )}
            </div>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-neutral-800 focus-visible:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 transition-colors"
          onClick={toggleMobileMenu}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle mobile menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

        <CTAButtons />
      </div>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={mobileMenuOpen}
        menuItems={menuItems}
        openLabel={openLabel}
        onToggleSubmenu={handleToggleSubmenu}
        onClose={closeMobileMenu}
      />
    </header>
  );
}