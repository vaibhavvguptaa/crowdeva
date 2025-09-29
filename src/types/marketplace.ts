// Marketplace types for developers and vendors
export interface MarketplaceProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  location: string;
  timezone: string;
  hourlyRate: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'INR';
  experience: number; // years
  rating: number; // 1-5
  reviewCount: number;
  completedProjects: number;
  responseTime: string; // e.g., "Within 2 hours"
  lastActive: string;
  verified: boolean;
  topRated: boolean;
  badges: string[];
  portfolio: PortfolioItem[];
  description: string;
  languages: Language[];
  createdAt: string;
}

export interface DeveloperProfile extends MarketplaceProfile {
  type: 'developer';
  skills: Skill[];
  specializations: DeveloperSpecialization[];
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  education: Education[];
  certifications: Certification[];
  frameworks: string[];
  programmingLanguages: string[];
  apiExperience: string[];
  preferredProjectTypes: ProjectType[];
}

export interface VendorProfile extends MarketplaceProfile {
  type: 'vendor';
  companyName: string;
  companySize: '1-10' | '11-50' | '51-200' | '200+';
  services: VendorService[];
  industries: string[];
  teamMembers: number;
  clientRetentionRate: number;
  averageProjectDuration: string;
  minimumProjectBudget: number;
  maxConcurrentProjects: number;
  businessRegistration?: string;
  insuranceCoverage: boolean;
  ndaSigning: boolean;
  paymentTerms: string;
}

export interface Skill {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  yearsOfExperience: number;
  endorsed: boolean;
}

export interface VendorService {
  name: string;
  description: string;
  category: 'Data Annotation' | 'Model Training' | 'Quality Assurance' | 'Consulting' | 'Custom Development';
  pricing: 'Fixed' | 'Hourly' | 'Project-based';
  deliveryTime: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  projectUrl?: string;
  technologies: string[];
  completedAt: string;
  clientTestimonial?: string;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startYear: number;
  endYear: number;
  description?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface Language {
  name: string;
  proficiency: 'Basic' | 'Conversational' | 'Fluent' | 'Native';
}

export type DeveloperSpecialization = 
  | 'Full Stack Development'
  | 'Frontend Development' 
  | 'Backend Development'
  | 'Mobile Development'
  | 'AI/ML Development'
  | 'Data Science'
  | 'DevOps'
  | 'API Development'
  | 'Database Design'
  | 'Cloud Architecture';

export type ProjectType = 
  | 'Text Annotation'
  | 'Image Classification'
  | 'Sentiment Analysis'
  | 'Named Entity Recognition'
  | 'Audio Classification'
  | 'Video Analysis'
  | 'API Integration'
  | 'Custom Development';

// Filter interfaces
export interface MarketplaceFilters {
  searchTerm: string;
  location: string[];
  hourlyRateMin: number;
  hourlyRateMax: number;
  experience: number[];
  rating: number;
  verified: boolean;
  topRated: boolean;
  skills?: string[];
  specializations?: string[];
  services?: string[];
  companySize?: string[];
  languages?: string[];
  education?: string[];
  profileTypeFilter?: 'individual' | 'vendor' | 'all';
  // Pagination properties
  page?: number;
  limit?: number;
}

export interface MarketplaceSearchResult {
  profiles: (DeveloperProfile | VendorProfile)[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filters: MarketplaceFilters;
}

// Hiring request interface
export interface HiringRequest {
  id: string;
  clientId: string;
  profileId: string;
  profileType: 'developer' | 'vendor';
  projectTitle: string;
  projectDescription: string;
  budget: number;
  currency: string;
  timeline: string;
  requiredSkills: string[];
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: string;
  message?: string;
}

// Customer profile interface
export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  location: string;
  timezone: string;
  companyName: string;
  companySize: '1-10' | '11-50' | '51-200' | '200+';
  industry: string;
  website?: string;
  phone?: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}
