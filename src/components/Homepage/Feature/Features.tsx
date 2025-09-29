// components/Features.tsx
"use client";

import { Users, Radar, Image as ImageIcon, ArrowRight } from "lucide-react";
import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { ReactNode } from "react";

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
  href: string;
}

const features: FeatureItem[] = [
  {
    icon: <Users size={24} className="text-blue-400" />,
    title: "Find the Right Experts for Your Data Annotation Projects",
    description: "Access a pool of skilled annotators ready to elevate your data quality with 95%+ accuracy ratings.",
    cta: "Hire Annotators",
    href: "/hire/annotators"
  },
  {
    icon: <Radar size={24} className="text-purple-400" />,
    title: "Precision 3D LiDAR Annotation Services",
    description: "Specialized LiDAR experts delivering millimeter-accurate spatial data annotations for AV projects.",
    cta: "Explore LiDAR",
    href: "/services/lidar"
  },
  {
    icon: <ImageIcon size={24} className="text-green-400" />,
    title: "Image Annotation Specialists",
    description: "Professional annotation teams for object detection, segmentation, and classification tasks.",
    cta: "Connect Now",
    href: "/services/image-annotation"
  },
];

// Card Component
interface CardCoreProps {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  animationVariants?: Variants;
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

// FeatureCard Component
const featureCardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.5
    }
  })
};

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  cta?: string;
  index?: number;
  className?: string;
}

function FeatureCard({
  title,
  description,
  icon,
  href,
  cta = "Learn more",
  index = 0,
  className
}: FeatureCardProps) {
  return (
    <Card
      title={title}
      description={description}
      icon={icon}
      href={href}
      className={className}
      animationVariants={featureCardVariants}
      customAnimationIndex={index}
      footer={
        <div className="flex items-center text-blue-400 font-medium group-hover:text-blue-300 transition-colors">
          {cta}
          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      }
    />
  );
}

// FeaturesHeader Component
function FeaturesHeader() {
  return (
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
  );
}

// Main Features Component
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export function Features() {
  return (
    <section className="bg-neutral-950 text-white py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <FeaturesHeader />
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <FeatureCard key={index} index={index} {...feature} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}