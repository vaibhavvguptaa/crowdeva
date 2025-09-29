// Safely load environment variables, handling potential isTTY errors and SSR contexts
let dotenvLoaded = false;
try {
  // Only load dotenv in Node.js environments, not in browser
  if (typeof process !== 'undefined' && process.env) {
    // Use require instead of import to avoid topLevelAwait issues
    try {
      require('dotenv').config();
      dotenvLoaded = true;
    } catch (error) {
      // In SSR or other environments, dotenv might not be available or needed
      // This is okay as environment variables should be set by the deployment environment
      console.debug('dotenv not loaded:', error);
    }
  }
} catch (error) {
  // In SSR or other environments, dotenv might not be available or needed
  // This is okay as environment variables should be set by the deployment environment
  console.debug('dotenv not loaded:', error);
}

import { AuthUserType } from '../types/auth';

interface KeycloakConfig {
  url: string | undefined;
  realm: string;
  clientId: string;
}

const config = {
  keycloak: {
    url: process.env.NEXT_PUBLIC_KEYCLOAK_URL,
    realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM,
    clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID,
    devRealm: process.env.NEXT_PUBLIC_KEYCLOAK_DEV_REALM,
    vendorRealm: process.env.NEXT_PUBLIC_KEYCLOAK_VENDOR_REALM,
    devClientId: process.env.NEXT_PUBLIC_KEYCLOAK_DEV_CLIENT_ID,
    vendorClientId: process.env.NEXT_PUBLIC_KEYCLOAK_VENDOR_CLIENT_ID,
    googleIdpAlias: process.env.NEXT_PUBLIC_GOOGLE_IDP_ALIAS || 'google',
  },
};

export const getKeycloakConfig = (authType?: AuthUserType): KeycloakConfig => {
  // Cache the config values to avoid repeated env var lookups
  const keycloakConfig = config.keycloak;
  
  // Check if the required base URL is provided
  if (!keycloakConfig.url) {
    console.warn('Keycloak URL is not configured. Please set NEXT_PUBLIC_KEYCLOAK_URL in your environment variables.');
    // Return a default configuration for development
    return {
      url: 'http://localhost:8080', // Default Keycloak URL
      realm: authType === 'developers' ? 'developer' : authType === 'vendors' ? 'vendor' : 'Customer',
      clientId: authType === 'developers' ? 'dev-web' : authType === 'vendors' ? 'vendor-web' : 'customer-web',
    };
  }
  
  let realm;
  let clientId;
  
  if (authType === 'developers') {
    realm = keycloakConfig.devRealm || 'developer';
    clientId = keycloakConfig.devClientId || 'dev-web';
  } else if (authType === 'vendors') {
    realm = keycloakConfig.vendorRealm || 'vendor';
    clientId = keycloakConfig.vendorClientId || 'vendor-web';
  } else {
    realm = keycloakConfig.realm || 'Customer';
    clientId = keycloakConfig.clientId || 'customer-web';
  }

  return {
    url: keycloakConfig.url,
    realm,
    clientId,
  };
};

export default config;