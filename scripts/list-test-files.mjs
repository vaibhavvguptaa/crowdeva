#!/usr/bin/env node

import { readdir, stat } from 'fs/promises';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// Directories to scan for test files
const testDirs = [
  'test',
  'test/unit',
  'test/integration',
  'test/components',
  'test/pages',
  'test/api',
  'test/auth',
  'test/keycloak',
  'test/scripts',
  'test/scripts/auth',
  'test/scripts/database',
  'test/scripts/keycloak',
  'test/scripts/util',
  'test/scripts/performance'  // Add this line
];

// File patterns to look for
const testPatterns = [
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
  /^test-.*\.[jt]sx?$/,
  /.*-test\.[jt]sx?$/
];

async function isTestFile(filePath) {
  const fileName = filePath.split('/').pop();
  return testPatterns.some(pattern => pattern.test(fileName));
}

async function scanDirectory(dirPath) {
  try {
    const entries = await readdir(dirPath);
    const files = [];
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        files.push(...await scanDirectory(fullPath));
      } else if (await isTestFile(fullPath)) {
        files.push(fullPath);
      }
    }
    
    return files;
  } catch (error) {
    console.warn(`Could not scan directory ${dirPath}:`, error.message);
    return [];
  }
}

async function main() {
  console.log('🔍 Scanning for test files...\n');
  
  const allTestFiles = [];
  
  for (const testDir of testDirs) {
    const fullPath = join(__dirname, '..', testDir);
    const files = await scanDirectory(fullPath);
    allTestFiles.push(...files);
  }
  
  // Remove duplicates and sort
  const uniqueFiles = [...new Set(allTestFiles)].sort();
  
  console.log(`Found ${uniqueFiles.length} test files:\n`);
  
  uniqueFiles.forEach(filePath => {
    const relativePath = relative(join(__dirname, '..'), filePath);
    console.log(`  ${relativePath}`);
  });
  
  console.log('\n✅ Scan complete!');
}

main().catch(error => {
  console.error('Error scanning for test files:', error);
  process.exit(1);
});