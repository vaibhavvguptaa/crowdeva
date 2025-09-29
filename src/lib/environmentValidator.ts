import { z } from 'zod';

interface EnvironmentConfig {
  required: string[];
  optional: string[];
  validation?: Record<string, (value: string) => boolean>;
}

interface ValidationResult {
  isValid: boolean;
  missingRequired: string[];
  invalidValues: string[];
  warnings: string[];
}

export class EnvironmentValidator {
  private static configs: Record<string, EnvironmentConfig> = {
    keycloak: {
      required: [
        'NEXT_PUBLIC_KEYCLOAK_URL',
        'NEXT_PUBLIC_KEYCLOAK_REALM',
        'NEXT_PUBLIC_KEYCLOAK_CLIENT_ID',
      ],
      optional: [
        'NEXT_PUBLIC_KEYCLOAK_DEV_REALM',
        'NEXT_PUBLIC_KEYCLOAK_VENDOR_REALM',
        'NEXT_PUBLIC_KEYCLOAK_DEV_CLIENT_ID',
        'NEXT_PUBLIC_KEYCLOAK_VENDOR_CLIENT_ID',
      ],
      validation: {
        'NEXT_PUBLIC_KEYCLOAK_URL': (value: string) => {
          try {
            new URL(value);
            return true;
          } catch {
            return false;
          }
        },
      },
    },
    security: {
      required: [],
      optional: [
        'NEXT_PUBLIC_GEO_BLOCKING_ENABLED',
        'CSRF_SECRET',
        'SESSION_SECRET',
      ],
    },
    production: {
      required: [
        'MYSQL_ROOT_PASSWORD',
        'MYSQL_PASSWORD',
        'KEYCLOAK_ADMIN_PASSWORD',
        'KEYCLOAK_DOMAIN',
      ],
      optional: [],
    },
  };

  static validateEnvironment(configName?: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      missingRequired: [],
      invalidValues: [],
      warnings: [],
    };

    const configsToValidate = configName 
      ? { [configName]: this.configs[configName] }
      : this.configs;

    for (const [name, config] of Object.entries(configsToValidate)) {
      if (!config) {
        result.warnings.push(`Unknown configuration: ${name}`);
        continue;
      }

      // Check required variables
      for (const requiredVar of config.required) {
        const value = process.env[requiredVar];
        if (!value) {
          result.missingRequired.push(requiredVar);
          result.isValid = false;
        } else {
          // Validate format if validation function exists
          const validator = config.validation?.[requiredVar];
          if (validator && !validator(value)) {
            result.invalidValues.push(requiredVar);
            result.isValid = false;
          }
        }
      }

      // Check optional variables and warn if missing in production
      if (process.env.NODE_ENV === 'production') {
        for (const optionalVar of config.optional || []) {
          const value = process.env[optionalVar];
          if (!value) {
            result.warnings.push(`Optional variable ${optionalVar} is not set (recommended for production)`);
          }
        }
      }
    }

    return result;
  }

  static validateAndThrow(configName?: string): void {
    const result = this.validateEnvironment(configName);
    
    if (!result.isValid) {
      const errorMessage = [
        'Environment validation failed:',
        ...(result.missingRequired.length > 0 
          ? [`Missing required variables: ${result.missingRequired.join(', ')}`]
          : []
        ),
        ...(result.invalidValues.length > 0 
          ? [`Invalid values for: ${result.invalidValues.join(', ')}`]
          : []
        ),
      ].join('\n');
      
      throw new Error(errorMessage);
    }

    // Log warnings
    if (result.warnings.length > 0) {
      console.warn('Environment warnings:');
      result.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
  }

  static getEnvironmentSummary(): Record<string, boolean> {
    const summary: Record<string, boolean> = {};
    
    for (const [configName] of Object.entries(this.configs)) {
      const result = this.validateEnvironment(configName);
      summary[configName] = result.isValid;
    }
    
    return summary;
  }
}