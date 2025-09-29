import pool from './connection';
import { formatMySQLDateTime } from '../utils';

export const initMarketplaceData = async () => {
  if (!pool) {
    console.warn('Database pool is not initialized');
    return;
  }
  
  const connection = await pool.getConnection();
  
  try {
    // Insert sample developer
    await connection.execute(`
      INSERT IGNORE INTO developers (
        id, name, email, avatar, location, timezone, hourly_rate, currency,
        experience, rating, review_count, completed_projects, response_time,
        last_active, verified, top_rated, badges, description, github_url,
        linkedin_url, website_url, frameworks, programming_languages,
        api_experience, preferred_project_types, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'dev-1',
      'Sarah Chen',
      'sarah.chen@example.com',
      '/avatars/sarah.jpg',
      'San Francisco, CA',
      'PST',
      85.00,
      'USD',
      5,
      4.9,
      47,
      127,
      'Within 1 hour',
      '2 hours ago',
      true,
      true,
      JSON.stringify(['Top Rated', 'AI Specialist']),
      'Senior Full Stack Developer with expertise in AI/ML integration and data annotation systems.',
      'https://github.com/sarahchen',
      'https://linkedin.com/in/sarahchen',
      'https://sarahchen.dev',
      JSON.stringify(['React', 'Next.js', 'Express.js', 'FastAPI', 'TensorFlow']),
      JSON.stringify(['JavaScript', 'TypeScript', 'Python', 'Go']),
      JSON.stringify(['REST APIs', 'GraphQL', 'gRPC', 'WebSocket']),
      JSON.stringify(['Text Annotation', 'Image Classification', 'API Integration']),
      formatMySQLDateTime()
    ]);

    // Insert sample vendor
    await connection.execute(`
      INSERT IGNORE INTO vendors (
        id, name, email, avatar, location, timezone, hourly_rate, currency,
        experience, rating, review_count, completed_projects, response_time,
        last_active, verified, top_rated, badges, description, company_name,
        company_size, team_members, client_retention_rate, average_project_duration,
        minimum_project_budget, max_concurrent_projects, business_registration,
        insurance_coverage, nda_signing, payment_terms, industries, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'vendor-1',
      'DataVision Solutions',
      'contact@datavision.com',
      '/avatars/datavision.jpg',
      'London, UK',
      'GMT',
      120.00,
      'USD',
      8,
      4.9,
      124,
      289,
      'Within 1 hour',
      '1 hour ago',
      true,
      true,
      JSON.stringify(['Top Rated', 'Enterprise Ready', 'ISO Certified']),
      'Leading data annotation company specializing in computer vision and NLP projects.',
      'DataVision Solutions Ltd.',
      '51-200',
      85,
      95.00,
      '3-6 months',
      25000.00,
      15,
      'UK Company House: 12345678',
      true,
      true,
      'Net 30',
      JSON.stringify(['Healthcare', 'Automotive', 'E-commerce', 'Finance']),
      formatMySQLDateTime()
    ]);

    // Insert sample customer
    await connection.execute(`
      INSERT IGNORE INTO customers (
        id, name, email, avatar, location, timezone, company_name,
        company_size, industry, website, phone, verified, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'cust-1',
      'John Smith',
      'john.smith@company.com',
      '/avatars/john.jpg',
      'New York, NY',
      'EST',
      'TechCorp Inc.',
      '51-200',
      'Technology',
      'https://techcorp.com',
      '+1-555-0123',
      true,
      formatMySQLDateTime()
    ]);

    console.log('Marketplace data initialized successfully');
  } catch (error) {
    console.error('Error initializing marketplace data:', error);
  } finally {
    connection.release();
  }
};