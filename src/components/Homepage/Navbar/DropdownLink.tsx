import Link from "next/link";
import { memo } from "react";
import { MenuLink } from "./Types";

interface DropdownLinkProps {
  link: MenuLink;
  onClick?: () => void;
}

const DropdownLink = memo(({ link, onClick }: DropdownLinkProps) => (
  <Link
    href={link.href}
    className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-neutral-800 focus-visible:bg-neutral-800 transition group focus-visible:outline-none"
    role="menuitem"
    onClick={onClick}
    prefetch={false}
  >
    <div className="mt-0.5 text-blue-300 group-hover:text-blue-200 transition-colors">
      {link.icon}
    </div>
    <div>
      <div className="font-medium group-hover:text-white transition-colors">
        {link.name}
      </div>
      {link.description && (
        <div className="text-xs text-neutral-400 mt-0.5 group-hover:text-neutral-300 transition-colors">
          {link.description}
        </div>
      )}
    </div>
  </Link>
));

DropdownLink.displayName = "DropdownLink";
export default DropdownLink;