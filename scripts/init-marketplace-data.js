#!/usr/bin/env node

// Script to initialize marketplace data
import dotenv from 'dotenv';
import { initMarketplaceData } from '../src/lib/db/initMarketplaceData.js';

dotenv.config();

const initMarketplace = async () => {
  console.log('Marketplace data initialization script');
  console.log('=====================================');
  console.log('');

  try {
    await initMarketplaceData();
    console.log('');
    console.log('Marketplace data initialization completed successfully!');
  } catch (error) {
    console.error('Marketplace data initialization failed:', error.message);
  }
};

initMarketplace();