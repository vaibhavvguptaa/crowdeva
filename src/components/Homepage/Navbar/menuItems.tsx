import { 
  Brain, 
  Layers, 
  FileCode, 
  UserCheck, 
  BookOpen, 
  Users, 
  FileText, 
  MessageSquare, 
  HelpCircle 
} from "lucide-react";
import { MenuItem } from "./Types";

export const menuItems: MenuItem[] = [
  {
    label: "LLM Evaluation",
    icon: <Brain size={16} />,
    links: [
      { 
        name: "Dashboard", 
        href: "/projects", 
        icon: <Layers size={14} />,
        description: "Monitor all your evaluations" 
      },
      { 
        name: "New Evaluation", 
        href: "/projects", 
        icon: <Brain size={14} />,
        description: "Set up a new LLM test" 
      },
      { 
        name: "Benchmarks", 
        href: "/projects", 
        icon: <FileCode size={14} />,
        description: "Compare model performance" 
      },
    ],
  },
  {
    label: "Hire Talent",
    icon: <UserCheck size={16} />,
    links: [
      { 
        name: "Evaluators", 
        href: "/hire/evaluators", 
        icon: <Brain size={14} />,
        description: "Find qualified LLM evaluators" 
      },
      { 
        name: "Annotation Teams", 
        href: "/hire/annotation", 
        icon: <BookOpen size={14} />,
        description: "Build your data labeling team" 
      },
      { 
        name: "Managed Services", 
        href: "/hire/managed", 
        icon: <Users size={14} />,
        description: "Full-service evaluation solutions" 
      },
    ],
  },
  {
    label: "Resources",
    icon: <FileText size={16} />,
    links: [
      { 
        name: "Docs", 
        href: "/docs", 
        icon: <FileText size={14} />,
        description: "API and integration guides" 
      },
      { 
        name: "Blog", 
        href: "/blog", 
        icon: <MessageSquare size={14} />,
        description: "Latest in LLM evaluation" 
      },
      { 
        name: "Help Center", 
        href: "/help", 
        icon: <HelpCircle size={14} />,
        description: "Get support and FAQs" 
      },
    ],
  },
];