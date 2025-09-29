import Link from "next/link";
import { Brain } from "lucide-react";
import { memo } from "react";

const Logo = memo(() => (
  <Link 
    href="/" 
    className="flex items-center gap-2 group" 
    aria-label="Home"
    prefetch={false}
  >
    <span className="text-xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
      Crowdeval
    </span>
  </Link>
));

Logo.displayName = "Logo";
export default Logo;