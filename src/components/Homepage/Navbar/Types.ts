export interface MenuLink {
  name: string;
  href: string;
  icon?: React.ReactNode;
  description?: string;
}

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  href?: string;
  links?: MenuLink[];
}

export const ANIMATION_DURATION = 0.2;
export const HOVER_DELAY = 150;

export const dropdownVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 10, scale: 0.95 }
};

export const mobileMenuVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 }
};

export const submenuVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 }
};