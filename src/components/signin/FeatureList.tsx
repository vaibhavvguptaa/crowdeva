"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, Users, Shield, Code, Zap, CheckCircle, Package, MessageSquare, Activity } from "lucide-react";

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}

interface FeatureListProps {
  activeTab: "customers" | "developers" | "vendors";
}

const features: Record<"customers" | "developers" | "vendors", Feature[]> = {
  customers: [
    { icon: BarChart3, title: "Unified Evaluation Dashboard", desc: "Track model performance, data quality, and human feedback in one place." },
    { icon: Users, title: "Role-Based Workflows", desc: "Assign tasks to reviewers, data scientists, and stakeholders with clear ownership." },
    { icon: Shield, title: "Compliance & Audit Trail", desc: "Automatic logging of decisions and annotations for SOC2 / GDPR readiness." },
  ],
  developers: [
    { icon: Code, title: "API Integration", desc: "Simple REST & GraphQL endpoints" },
    { icon: Zap, title: "Real-time Processing", desc: "Lightning-fast evaluation runs" },
    { icon: CheckCircle, title: "Automated Testing", desc: "CI-ready pipelines" },
  ],
  vendors: [
    { icon: Package, title: "Managed Submissions", desc: "Submit, version, and track deliverables with instant feedback loops." },
  { icon: Activity, title: "Performance Insights", desc: "Monitor accuracy, latency, and acceptance trends across clients." },
    { icon: MessageSquare, title: "Client Collaboration", desc: "Centralized messaging and clarifications to reduce turnaround time." },
  ],
};

export const FeatureList: React.FC<FeatureListProps> = ({ activeTab }) => {
  const [displayTab, setDisplayTab] = useState<"customers" | "developers" | "vendors">(activeTab);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (activeTab !== displayTab) {
      setIsTransitioning(true);
      
      const timer = setTimeout(() => {
        setDisplayTab(activeTab);
        setTimeout(() => setIsTransitioning(false), 100);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [activeTab, displayTab]);

  return (
    <ul className="space-y-6">
      {features[displayTab].map(({ icon: Icon, title, desc }, index) => (
        <li 
          key={`${displayTab}-${title}`} 
          className={`flex items-start space-x-4 transition-all duration-300 ease-out ${
            isTransitioning 
              ? 'opacity-0 transform translate-x-4' 
              : 'opacity-100 transform translate-x-0'
          }`}
          style={{ 
            transitionDelay: isTransitioning ? '0ms' : `${index * 100}ms` 
          }}
        >
          <span className={`flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm transition-all duration-300 ${
            isTransitioning ? 'scale-90 rotate-12' : 'scale-100 rotate-0'
          }`}>
            <Icon className="h-5 w-5 text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-white mb-1 transition-colors duration-200">
              {title}
            </h3>
            <p className="text-white/80 text-sm leading-relaxed transition-colors duration-200">
              {desc}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
};
