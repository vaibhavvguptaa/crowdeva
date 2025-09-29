#!/usr/bin/env node

/**
 * Production Readiness Check Script
 * Run this script before deploying to production to ensure all security measures are in place
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class ProductionReadinessChecker {
  constructor() {
    this.checks = [];
    this.warnings = [];
    this.errors = [];
  }

  log(message, color = colors.white) {
    console.log(`${color}${message}${colors.reset}`);
  }

  success(message) {
    this.log(`✅ ${message}`, colors.green);
  }

  warning(message) {
    this.log(`⚠️  ${message}`, colors.yellow);
    this.warnings.push(message);
  }

  error(message) {
    this.log(`❌ ${message}`, colors.red);
    this.errors.push(message);
  }

  info(message) {
    this.log(`ℹ️  ${message}`, colors.blue);
  }

  checkEnvironmentVariables() {
    this.log('\n🔍 Checking Environment Variables...', colors.bold);
    
    const requiredProd = [
      'MYSQL_ROOT_PASSWORD',
      'MYSQL_PASSWORD',
      'KEYCLOAK_ADMIN_PASSWORD', 
      'KEYCLOAK_DOMAIN',
      'NEXT_PUBLIC_KEYCLOAK_URL',
      'NEXT_PUBLIC_KEYCLOAK_REALM',
      'NEXT_PUBLIC_KEYCLOAK_CLIENT_ID'
    ];

    const recommended = [
      'NEXT_PUBLIC_KEYCLOAK_DEV_REALM',
      'NEXT_PUBLIC_KEYCLOAK_VENDOR_REALM',
      'NEXT_PUBLIC_GEO_BLOCKING_ENABLED',
      'CSRF_SECRET',
      'SESSION_SECRET'
    ];

    let allRequired = true;
    
    for (const envVar of requiredProd) {
      if (process.env[envVar]) {
        this.success(`${envVar} is set`);
      } else {
        this.error(`${envVar} is missing (required for production)`);
        allRequired = false;
      }
    }

    for (const envVar of recommended) {
      if (process.env[envVar]) {
        this.success(`${envVar} is set`);
      } else {
        this.warning(`${envVar} is not set (recommended for production)`);
      }
    }

    return allRequired;
  }

  checkFileExists(filePath, description) {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      this.success(`${description} exists`);
      return true;
    } else {
      this.error(`${description} missing: ${filePath}`);
      return false;
    }
  }

  checkSecurityFiles() {
    this.log('\n🔐 Checking Security Implementation...', colors.bold);
    
    const checks = [
      {
        file: 'KEYCLOAK_SECURITY_CONFIG.md',
        description: 'Keycloak Security Configuration Guide'
      },
      {
        file: 'LOCATION_BLOCKING_GUIDE.md',
        description: 'Location Blocking Implementation Guide'
      },
      {
        file: 'MAILHOG_SMTP_SETUP.md',
        description: 'MailHog SMTP Setup Guide'
      },
      {
        file: 'nginx/nginx.conf',
        description: 'Nginx Configuration with Security Headers'
      },
      {
        file: 'certs/tls.crt',
        description: 'SSL Certificate'
      },
      {
        file: 'certs/tls.key',
        description: 'SSL Private Key'
      }
    ];

    let allExist = true;
    for (const check of checks) {
      if (!this.checkFileExists(check.file, check.description)) {
        allExist = false;
      }
    }

    return allExist;
  }

  checkDockerConfig() {
    this.log('\n🐳 Checking Docker Configuration...', colors.bold);
    
    const checks = [
      {
        file: 'docker-compose.prod.yml',
        description: 'Production Docker Compose'
      }
    ];

    let allExist = true;
    for (const check of checks) {
      if (!this.checkFileExists(check.file, check.description)) {
        allExist = false;
      }
    }

    // Check for security-related docker configurations
    const dockerComposePath = path.join(process.cwd(), 'docker-compose.prod.yml');
    if (fs.existsSync(dockerComposePath)) {
      const dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf8');
      
      // Check for MySQL service
      if (dockerComposeContent.includes('mysql:')) {
        this.success('MySQL database service configured');
      } else {
        this.error('MySQL database service not found in docker-compose.prod.yml');
        allExist = false;
      }
      
      // Check for security headers in nginx
      if (dockerComposeContent.includes('nginx:')) {
        this.success('Nginx reverse proxy configured');
      } else {
        this.error('Nginx reverse proxy not found in docker-compose.prod.yml');
        allExist = false;
      }
    }

    return allExist;
  }

  async performAllChecks() {
    this.log('🚀 Starting Production Readiness Check...\n', colors.bold + colors.cyan);
    
    const envCheck = this.checkEnvironmentVariables();
    const fileCheck = this.checkSecurityFiles();
    const dockerCheck = this.checkDockerConfig();
    
    this.log('\n📋 Summary:', colors.bold);
    
    if (this.errors.length === 0 && envCheck && fileCheck && dockerCheck) {
      this.success('All production readiness checks passed!');
      this.log('\n✅ Your application is ready for production deployment.', colors.green);
      return true;
    } else {
      if (this.errors.length > 0) {
        this.log(`\n❌ ${this.errors.length} error(s) found:`, colors.red);
        this.errors.forEach(err => this.log(`   • ${err}`, colors.red));
      }
      
      if (this.warnings.length > 0) {
        this.log(`\n⚠️  ${this.warnings.length} warning(s) found:`, colors.yellow);
        this.warnings.forEach(warn => this.log(`   • ${warn}`, colors.yellow));
      }
      
      this.log('\n🔧 Please fix the issues above before deploying to production.', colors.blue);
      return false;
    }
  }
}

// Run the checks if this script is executed directly
if (require.main === module) {
  const checker = new ProductionReadinessChecker();
  checker.performAllChecks().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = ProductionReadinessChecker;