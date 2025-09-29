import Link from "next/link";
import { memo } from "react";

const CTAButtons = memo(() => (
  <div className="hidden md:flex items-center gap-4">
    <Link
      href="/signin"
      className="text-sm font-medium text-white hover:text-blue-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 rounded px-2 py-1"
      prefetch={false}
    >
      Sign In
    </Link>
    <Link
      href="/signup"
      className="text-sm font-medium bg-white text-black px-4 py-2 rounded-md hover:opacity-90 focus-visible:opacity-90 transition-opacity shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
      prefetch={false}
    >
      Get Started
    </Link>
  </div>
));

CTAButtons.displayName = "CTAButtons";
export default CTAButtons;