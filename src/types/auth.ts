// Unified authentication types
export type AuthUserType = 'customers' | 'developers' | 'vendors';

// User interface with proper typing
export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  role: AuthUserType;
  authType: AuthUserType;
  exp?: number;
  iat?: number;
  iss?: string;
  aud?: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
}

// Token response interface
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  error?: string;
  success?: any;
}

// Authentication error interface
export interface AuthError {
  error: string;
  error_description?: string;
  error_uri?: string;
}

// Realm configuration interface
export interface RealmConfig {
  realm: string;
  features: string[];
  displayName: string;
  description: string;
}

// Centralized realm configurations
// Realm names are sourced from environment variables when available to ensure
// they always stay in sync with the actual Keycloak configuration. Fallbacks
// preserve previous defaults so local dev continues to work if env vars are absent.
// Note: Actual Keycloak realm name is 'Customer' (capital C) per user environment.
// Fallback updated accordingly; env var still takes precedence.
const CUSTOMER_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'Customer';
const DEVELOPER_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_DEV_REALM || 'developer';
const VENDOR_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_VENDOR_REALM || 'vendor';

export const REALM_CONFIGS: Record<AuthUserType, RealmConfig> = {
  customers: {
    realm: CUSTOMER_REALM,
    features: [
      'Project Evaluation',
      'Analytics Dashboard',
      'Team Collaboration',
      'Custom Reports',
      'Advanced Filtering'
    ],
    displayName: 'For Customers',
    description: 'Transform your evaluation process with our comprehensive analytics and collaboration tools.'
  },
  developers: {
    realm: DEVELOPER_REALM,
    features: [
      'API Access',
      'SDK Integration',
      'Webhook Support',
      'Custom Plugins',
      'Developer Community'
    ],
    displayName: 'For Developers',
    description: 'Build with our powerful APIs and comprehensive developer tools designed for seamless integration.'
  },
  vendors: {
    realm: VENDOR_REALM,
    features: [
      'Project Submission',
      'Vendor Analytics',
      'Client Communication',
      'Performance Metrics',
      'Support Portal'
    ],
    displayName: 'For Vendors',
    description: 'Manage your projects, track performance, and collaborate with clients through our vendor platform.'
  }
} as const;

// Authentication state interface
export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

// Login credentials interface
export interface LoginCredentials {
  username: string;
  password: string;
  authType: AuthUserType;
  otp?: string; // Optional one-time password (TOTP) for 2FA
}

// Registration data interface
export interface RegistrationData {
  email: string;
  password: string;
  companyName: string;
  firstName: string;
  lastName: string;
  authType: AuthUserType;
}
