"use client";

import { ArrowRight, BrainCircuit, Users, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ReactNode } from "react";

// Card Component
interface CardCoreProps {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  animationVariants?: any;
  customAnimationIndex?: number;
}

function Card({
  title,
  description,
  icon,
  href,
  footer,
  children,
  className = "",
  animationVariants,
  customAnimationIndex
}: CardCoreProps) {
  const defaultFooter = (
    <div className="flex items-center text-blue-400 font-medium group-hover:text-blue-300 transition-colors">
      Learn more
      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </div>
  );

  return (
    <motion.div
      custom={customAnimationIndex}
      variants={animationVariants}
      initial={animationVariants ? "hidden" : undefined}
      animate={animationVariants ? "visible" : undefined}
      whileHover={{ y: -8 }}
      className={`group h-full ${className}`}
    >
      <Link
        href={href}
        className="h-full flex flex-col bg-neutral-900 rounded-xl p-8 border border-neutral-800 hover:border-blue-500/30 transition-all duration-300"
      >
        <header className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors duration-300">
            {icon}
          </div>
          <h3 className="font-semibold text-xl text-white">{title}</h3>
        </header>

        <p className="text-gray-400 mb-6 flex-grow leading-relaxed">
          {description}
        </p>

        {children}

        <footer className="mt-auto">
          {footer || defaultFooter}
        </footer>
      </Link>
    </motion.div>
  );
}

// ServiceCard Component
interface ServiceCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  href: string;
  className?: string;
}

function ServiceCard({
  title,
  description,
  icon,
  features,
  href,
  className
}: ServiceCardProps) {
  return (
    <Card
      title={title}
      description={description}
      icon={icon}
      href={href}
      className={className}
    >
      <div className="mb-6">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5 flex-shrink-0">✓</span>
              <span className="text-sm text-gray-300 leading-relaxed">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

// CtaButtons Component
function CtaButtons() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      viewport={{ once: true }}
      className="flex flex-col sm:flex-row justify-center gap-4 mt-16"
    >
      <Link
        href="/demo"
        className="px-8 py-3.5 rounded-lg text-white font-medium transition-all flex items-center justify-center"
      >
        Request Demo
      </Link>
      <Link
        href="/learn-more"
        className="px-8 py-3.5 rounded-lg bg-transparent border-2 border-neutral-600 text-white font-medium hover:bg-neutral-800/50 transition-all flex items-center justify-center"
      >
        Learn More{" "}
      </Link>
    </motion.div>
  );
}

// Main Services Component
interface ServiceItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  href: string;
}

const SERVICES: ServiceItem[] = [
  {
    title: "LLM Evaluation Suite",
    description: "Comprehensive tools to measure and improve your language models' performance",
    icon: <BrainCircuit className="w-6 h-6 text-blue-400" />,
    features: [
      "Automated benchmark testing",
      "Human-in-the-loop evaluation",
      "Custom metric creation",
      "Real-time performance dashboards"
    ],
    href: "/projects"
  },
  {
    title: "Multimodal Annotation",
    description: "Powerful tools for labeling text, images, and sensor data",
    icon: <ImageIcon className="w-6 h-6 text-purple-400" />,
    features: [
      "Text classification & NER",
      "Image segmentation",
      "LiDAR point cloud annotation",
      "Video frame labeling"
    ],
    href: "/annotation"
  },
  {
    title: "Talent Marketplace",
    description: "Connect with qualified evaluators and annotators",
    icon: <Users className="w-6 h-6 text-green-400" />,
    features: [
      "AI-powered matching",
      "Quality scoring system",
      "Managed teams",
      "Dedicated project managers"
    ],
    href: "/marketplace"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Services() {
  return (
    <section className="relative bg-neutral-950 text-white py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-12 mb-20"
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-white bg-clip-text text-transparent">
              Advanced Annotation & Evaluation Services
            </h2>
          </div>
          <div>
            <p className="text-gray-300 text-lg">
              CrowdEval connects you with vetted professionals across specialized domains. 
              Our platform features rigorously tested experts in LLM evaluation, 
              multi-modal annotation, and complex data labeling tasks.
            </p>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8"
        >
          {SERVICES.map((service, i) => (
            <motion.div key={i} variants={itemVariants}>
              <ServiceCard {...service} />
            </motion.div>
          ))}
        </motion.div>

        <CtaButtons />
      </div>
    </section>
  );
}