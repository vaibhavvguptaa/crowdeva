import type { Metadata } from 'next';
import { AuthUserType } from '@/types/auth';

interface SEOConfig {
  title: string;
  description: string;
  keywords?: readonly string[];
  url?: string;
  image?: string;
  type?: string;
  siteName?: string;
}

export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords,
    url,
    image = '/images/crowdeval-og.png',
    type = 'website',
    siteName = 'CrowdEval',
  } = config;

  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;

  return {
    title: fullTitle,
    description,
    keywords: keywords ? [...keywords].join(', ') : undefined,
    
    // Basic Open Graph
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
      type: type as any,
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
      creator: '@crowdeval',
      site: '@crowdeval',
    },

    // Additional meta tags
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Verification tags (add your verification codes)
    verification: {
      google: 'your-google-verification-code',
      // yandex: 'your-yandex-verification-code',
      // yahoo: 'your-yahoo-verification-code',
    },

    // App-specific
    applicationName: siteName,
    referrer: 'origin-when-cross-origin',
    
    // Schema.org structured data will be added via JSON-LD in components
  };
}

// Generate structured data for JSON-LD
export function generateStructuredData(userType: AuthUserType): any {
  const baseData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "CrowdEval",
    "url": "https://crowdeval.com"
  };

  // Add specific data based on user type
  switch (userType) {
    case 'customers':
      return {
        ...baseData,
        "description": "AI Model Evaluation Platform for Customers"
      };
    case 'developers':
      return {
        ...baseData,
        "description": "Developer Tools for AI Model Integration"
      };
    case 'vendors':
      return {
        ...baseData,
        "description": "Vendor Platform for AI Model Submissions"
      };
    default:
      return baseData;
  }
}

// Predefined metadata configs for common pages
export const seoConfigs = {
  home: {
    title: 'CrowdEval - AI Model Evaluation Platform',
    description: 'Transform your AI model evaluation process with comprehensive analytics, collaboration tools, and powerful APIs. Get insights from real users and improve model performance.',
    keywords: ['AI', 'machine learning', 'model evaluation', 'analytics', 'crowd evaluation', 'AI testing'],
  },
  
  signIn: {
    title: 'Sign In to CrowdEval',
    description: 'Sign in to your CrowdEval account to access powerful AI model evaluation tools, analytics dashboard, and collaboration features.',
    keywords: ['sign in', 'login', 'authentication', 'account access'],
  },
  
  signUp: {
    title: 'Create Your CrowdEval Account',
    description: 'Join CrowdEval to start evaluating AI models with crowd-sourced insights. Create your account as a customer, developer, or vendor.',
    keywords: ['sign up', 'register', 'create account', 'join'],
  },
  
  customerSignIn: {
    title: 'Customer Sign In - CrowdEval',
    description: 'Sign in to your CrowdEval customer account to access project evaluation tools, analytics dashboard, and team collaboration features.',
    keywords: ['customer sign in', 'project evaluation', 'analytics'],
  },
  
  developerSignIn: {
    title: 'Developer Sign In - CrowdEval',
    description: 'Sign in to your CrowdEval developer account to access APIs, SDK integration, webhooks, and comprehensive developer tools.',
    keywords: ['developer sign in', 'API access', 'SDK', 'developer tools'],
  },
  
  vendorSignIn: {
    title: 'Vendor Sign In - CrowdEval',
    description: 'Sign in to your CrowdEval vendor account to manage project submissions, track performance metrics, and communicate with clients.',
    keywords: ['vendor sign in', 'project submission', 'vendor analytics'],
  },
} as const;