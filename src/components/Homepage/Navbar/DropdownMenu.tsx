import { motion, AnimatePresence } from "framer-motion";
import { memo } from "react";
import DropdownLink from "./DropdownLink";
import { MenuItem, dropdownVariants } from "./Types";

const ANIMATION_DURATION = 0.2; 

interface DropdownMenuProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
}

const DropdownMenu = memo(({ item, isOpen, onClose }: DropdownMenuProps) => (
  <AnimatePresence>
    {isOpen && item.links && (
      <motion.div
        variants={dropdownVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: ANIMATION_DURATION }}
        className="absolute left-0 mt-2 w-64 bg-neutral-950 border border-neutral-800 text-white rounded-lg shadow-xl z-50 py-2"
        role="menu"
        aria-label={`${item.label} submenu`}
      >
        {item.links.map((link) => (
          <DropdownLink key={link.name} link={link} onClick={onClose} />
        ))}
      </motion.div>
    )}
  </AnimatePresence>
));

DropdownMenu.displayName = "DropdownMenu";
export default DropdownMenu;