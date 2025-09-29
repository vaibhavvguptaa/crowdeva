"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Github, Twitter, Linkedin, Mail, ArrowUpRight } from "lucide-react";

// SocialLinks Component
interface SocialLink {
  icon: React.ReactNode;
  href: string;
}

function SocialLinks() {
  const socialLinks: SocialLink[] = [
    { icon: <Github size={18} />, href: "https://github.com" },
    { icon: <Linkedin size={18} />, href: "https://linkedin.com" },
    { icon: <Mail size={18} />, href: "mailto:contact@crowdeval.com" },
  ];

  return (
    <div className="flex gap-4">
      {socialLinks.map((social, index) => (
        <motion.a
          key={index}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ y: -2 }}
          className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-gray-300 hover:text-white transition-colors"
        >
          {social.icon}
        </motion.a>
      ))}
    </div>
  );
}

// BrandSection Component
function BrandSection() {
  return (
    <div className="lg:col-span-2">
      <Link href="/" className="flex items-center gap-2 mb-4">
        <span className="text-xl font-bold bg-white bg-clip-text text-transparent">
          Jupilens
        </span>
      </Link>
      <p className="text-gray-400 mb-6 max-w-md">
        The complete platform for LLM evaluation, data annotation, and AI talent solutions.
      </p>
      <SocialLinks />
    </div>
  );
}

// LinkGroup Component
interface LinkItem {
  name: string;
  href: string;
  external?: boolean;
}

interface LinkGroupProps {
  title: string;
  links: LinkItem[];
}

function LinkGroup({ title, links }: LinkGroupProps) {
  return (
    <div>
      <h4 className="font-semibold text-white mb-4">{title}</h4>
      <ul className="space-y-3">
        {links.map((link, linkIndex) => (
          <li key={linkIndex}>
            <Link
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              {link.name}
              {link.external && <ArrowUpRight className="w-3 h-3" />}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// FooterBottom Component
interface FooterBottomProps {
  year: number;
}

function FooterBottom({ year }: FooterBottomProps) {
  return (
    <div className="mt-16 pt-8 border-t border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
      <div className="flex items-center gap-6">
        <Link href="/privacy" className="hover:text-gray-300 transition-colors">
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:text-gray-300 transition-colors">
          Terms of Service
        </Link>
        <Link href="/cookies" className="hover:text-gray-300 transition-colors">
          Cookie Policy
        </Link>
      </div>
      <p>© {year} Jupilens. All rights reserved.</p>
    </div>
  );
}

// Main Footer Component
interface LinkGroupData {
  title: string;
  links: { name: string; href: string; external?: boolean }[];
}

const linkGroups: LinkGroupData[] = [
  {
    title: "Platform",
    links: [
      { name: "LLM Evaluation", href: "/evaluation" },
      { name: "Annotation Tools", href: "/annotation" },
      { name: "Benchmarks", href: "/benchmarks" },
      { name: "API Docs", href: "/docs", external: true },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About Us", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Case Studies", href: "/case-studies" },
      { name: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { name: "Terms of Service", href: "/terms" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Security", href: "/security" },
      { name: "Compliance", href: "/compliance" },
    ],
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-950 text-gray-300 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          <BrandSection />
          
          {linkGroups.map((group, index) => (
            <LinkGroup key={index} title={group.title} links={group.links} />
          ))}
        </div>

        <FooterBottom year={currentYear} />
      </div>
    </footer>
  );
}