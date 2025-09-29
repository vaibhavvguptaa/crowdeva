import pool from './connection';
import { DeveloperProfile, VendorProfile, CustomerProfile } from '@/types/marketplace';

// Check if database is available
const isDatabaseAvailable = async (): Promise<boolean> => {
  if (!pool) {
    console.warn('Database pool is not initialized');
    return false;
  }
  
  try {
    // Try to get a connection from the pool
    const connection = await pool.getConnection();
    connection.release();
    return true;
  } catch (error) {
    console.warn('Database not available:', (error as Error).message);
    return false;
  }
};

// Helper function to ensure pool is available before executing queries
const executeQuery = async (query: string, params: unknown[] = []) => {
  if (!pool) {
    throw new Error('Database pool is not initialized');
  }
  // Convert undefined values to null to prevent "Bind parameters must not contain undefined" error
  const sanitizedParams = params.map(param => param === undefined ? null : param);
  return await pool.execute(query, sanitizedParams);
};

// Developer queries
export const getDevelopers = async (): Promise<DeveloperProfile[]> => {
  if (await isDatabaseAvailable()) {
    try {
      const [rows] = await executeQuery(`
        SELECT d.*,
               JSON_ARRAYAGG(ds.skill_name) as skills_names,
               JSON_ARRAYAGG(ds.level) as skills_levels,
               JSON_ARRAYAGG(ds.years_of_experience) as skills_experience,
               JSON_ARRAYAGG(ds.endorsed) as skills_endorsed,
               JSON_ARRAYAGG(dspec.specialization) as specializations,
               JSON_ARRAYAGG(dedu.institution) as education_institutions,
               JSON_ARRAYAGG(dedu.degree) as education_degrees,
               JSON_ARRAYAGG(dedu.field) as education_fields,
               JSON_ARRAYAGG(dedu.start_year) as education_start_years,
               JSON_ARRAYAGG(dedu.end_year) as education_end_years,
               JSON_ARRAYAGG(dcert.name) as certification_names,
               JSON_ARRAYAGG(dcert.issuer) as certification_issuers,
               JSON_ARRAYAGG(dcert.issue_date) as certification_issue_dates,
               JSON_ARRAYAGG(dport.id) as portfolio_ids,
               JSON_ARRAYAGG(dport.title) as portfolio_titles,
               JSON_ARRAYAGG(dport.description) as portfolio_descriptions,
               JSON_ARRAYAGG(dlang.language_name) as language_names,
               JSON_ARRAYAGG(dlang.proficiency) as language_proficiencies
        FROM developers d
        LEFT JOIN developer_skills ds ON d.id = ds.developer_id
        LEFT JOIN developer_specializations dspec ON d.id = dspec.developer_id
        LEFT JOIN developer_education dedu ON d.id = dedu.developer_id
        LEFT JOIN developer_certifications dcert ON d.id = dcert.developer_id
        LEFT JOIN developer_portfolio dport ON d.id = dport.developer_id
        LEFT JOIN developer_languages dlang ON d.id = dlang.developer_id
        GROUP BY d.id
      `);
      
      // Process the results to match the DeveloperProfile interface
      return (rows as any[]).map(row => {
        // Parse skills
        const skills = [];
        if (row.skills_names && row.skills_names !== 'null') {
          try {
            const names = JSON.parse(row.skills_names);
            const levels = JSON.parse(row.skills_levels);
            const experience = JSON.parse(row.skills_experience);
            const endorsed = JSON.parse(row.skills_endorsed);
            
            for (let i = 0; i < names.length; i++) {
              if (names[i] !== null) {
                skills.push({
                  name: names[i],
                  level: levels[i],
                  yearsOfExperience: experience[i],
                  endorsed: endorsed[i]
                });
              }
            }
          } catch (e) {
            console.warn('Error parsing developer skills:', e);
          }
        }
        
        // Parse specializations
        let specializations: string[] = [];
        if (row.specializations && row.specializations !== 'null') {
          try {
            specializations = JSON.parse(row.specializations).filter((s: unknown) => s !== null);
          } catch (e) {
            console.warn('Error parsing developer specializations:', e);
          }
        }
        
        // Parse education
        const education = [];
        if (row.education_institutions && row.education_institutions !== 'null') {
          try {
            const institutions = JSON.parse(row.education_institutions);
            const degrees = JSON.parse(row.education_degrees);
            const fields = JSON.parse(row.education_fields);
            const startYears = JSON.parse(row.education_start_years);
            const endYears = JSON.parse(row.education_end_years);
            
            for (let i = 0; i < institutions.length; i++) {
              if (institutions[i] !== null) {
                education.push({
                  institution: institutions[i],
                  degree: degrees[i],
                  field: fields[i],
                  startYear: startYears[i],
                  endYear: endYears[i]
                });
              }
            }
          } catch (e) {
            console.warn('Error parsing developer education:', e);
          }
        }
        
        // Parse certifications
        const certifications = [];
        if (row.certification_names && row.certification_names !== 'null') {
          try {
            const names = JSON.parse(row.certification_names);
            const issuers = JSON.parse(row.certification_issuers);
            const issueDates = JSON.parse(row.certification_issue_dates);
            
            for (let i = 0; i < names.length; i++) {
              if (names[i] !== null) {
                certifications.push({
                  name: names[i],
                  issuer: issuers[i],
                  issueDate: issueDates[i]
                });
              }
            }
          } catch (e) {
            console.warn('Error parsing developer certifications:', e);
          }
        }
        
        // Parse portfolio
        const portfolio = [];
        if (row.portfolio_ids && row.portfolio_ids !== 'null') {
          try {
            const ids = JSON.parse(row.portfolio_ids);
            const titles = JSON.parse(row.portfolio_titles);
            const descriptions = JSON.parse(row.portfolio_descriptions);
            
            for (let i = 0; i < ids.length; i++) {
              if (ids[i] !== null) {
                portfolio.push({
                  id: ids[i],
                  title: titles[i],
                  description: descriptions[i]
                });
              }
            }
          } catch (e) {
            console.warn('Error parsing developer portfolio:', e);
          }
        }
        
        // Parse languages
        const languages = [];
        if (row.language_names && row.language_names !== 'null') {
          try {
            const names = JSON.parse(row.language_names);
            const proficiencies = JSON.parse(row.language_proficiencies);
            
            for (let i = 0; i < names.length; i++) {
              if (names[i] !== null) {
                languages.push({
                  name: names[i],
                  proficiency: proficiencies[i]
                });
              }
            }
          } catch (e) {
            console.warn('Error parsing developer languages:', e);
          }
        }
        
        // Parse JSON fields with error handling
        let badges = [];
        try {
          badges = row.badges ? JSON.parse(row.badges) : [];
        } catch (e) {
          console.warn('Error parsing developer badges:', e);
        }
        
        let frameworks = [];
        try {
          frameworks = row.frameworks ? JSON.parse(row.frameworks) : [];
        } catch (e) {
          console.warn('Error parsing developer frameworks:', e);
        }
        
        let programmingLanguages = [];
        try {
          programmingLanguages = row.programming_languages ? JSON.parse(row.programming_languages) : [];
        } catch (e) {
          console.warn('Error parsing developer programming languages:', e);
        }
        
        let apiExperience = [];
        try {
          apiExperience = row.api_experience ? JSON.parse(row.api_experience) : [];
        } catch (e) {
          console.warn('Error parsing developer API experience:', e);
        }
        
        let preferredProjectTypes = [];
        try {
          preferredProjectTypes = row.preferred_project_types ? JSON.parse(row.preferred_project_types) : [];
        } catch (e) {
          console.warn('Error parsing developer preferred project types:', e);
        }
        
        return {
          id: row.id,
          type: 'developer',
          name: row.name,
          email: row.email,
          avatar: row.avatar,
          location: row.location,
          timezone: row.timezone,
          hourlyRate: row.hourly_rate,
          currency: row.currency,
          experience: row.experience,
          rating: row.rating,
          reviewCount: row.review_count,
          completedProjects: row.completed_projects,
          responseTime: row.response_time,
          lastActive: row.last_active,
          verified: row.verified,
          topRated: row.top_rated,
          badges,
          description: row.description,
          skills,
          specializations,
          githubUrl: row.github_url,
          linkedinUrl: row.linkedin_url,
          websiteUrl: row.website_url,
          education,
          certifications,
          frameworks,
          programmingLanguages,
          apiExperience,
          preferredProjectTypes,
          portfolio,
          languages,
          createdAt: row.created_at
        } as DeveloperProfile;
      });
    } catch (error) {
      console.error('Error fetching developers from database:', error);
      throw error;
    }
  }
  
  return [];
};

export const getDeveloperById = async (id: string): Promise<DeveloperProfile | null> => {
  if (await isDatabaseAvailable()) {
    try {
      const [rows] = await executeQuery(`
        SELECT d.*,
               JSON_ARRAYAGG(ds.skill_name) as skills_names,
               JSON_ARRAYAGG(ds.level) as skills_levels,
               JSON_ARRAYAGG(ds.years_of_experience) as skills_experience,
               JSON_ARRAYAGG(ds.endorsed) as skills_endorsed,
               JSON_ARRAYAGG(dspec.specialization) as specializations,
               JSON_ARRAYAGG(dedu.institution) as education_institutions,
               JSON_ARRAYAGG(dedu.degree) as education_degrees,
               JSON_ARRAYAGG(dedu.field) as education_fields,
               JSON_ARRAYAGG(dedu.start_year) as education_start_years,
               JSON_ARRAYAGG(dedu.end_year) as education_end_years,
               JSON_ARRAYAGG(dcert.name) as certification_names,
               JSON_ARRAYAGG(dcert.issuer) as certification_issuers,
               JSON_ARRAYAGG(dcert.issue_date) as certification_issue_dates,
               JSON_ARRAYAGG(dport.id) as portfolio_ids,
               JSON_ARRAYAGG(dport.title) as portfolio_titles,
               JSON_ARRAYAGG(dport.description) as portfolio_descriptions,
               JSON_ARRAYAGG(dlang.language_name) as language_names,
               JSON_ARRAYAGG(dlang.proficiency) as language_proficiencies
        FROM developers d
        LEFT JOIN developer_skills ds ON d.id = ds.developer_id
        LEFT JOIN developer_specializations dspec ON d.id = dspec.developer_id
        LEFT JOIN developer_education dedu ON d.id = dedu.developer_id
        LEFT JOIN developer_certifications dcert ON d.id = dcert.developer_id
        LEFT JOIN developer_portfolio dport ON d.id = dport.developer_id
        LEFT JOIN developer_languages dlang ON d.id = dlang.developer_id
        WHERE d.id = ?
        GROUP BY d.id
      `, [id]);
      
      const developers = rows as any[];
      if (developers.length === 0) return null;
      
      const row = developers[0];
      
      // Parse skills
      const skills = [];
      if (row.skills_names && row.skills_names !== 'null') {
        try {
          const names = JSON.parse(row.skills_names);
          const levels = JSON.parse(row.skills_levels);
          const experience = JSON.parse(row.skills_experience);
          const endorsed = JSON.parse(row.skills_endorsed);
          
          for (let i = 0; i < names.length; i++) {
            if (names[i] !== null) {
              skills.push({
                name: names[i],
                level: levels[i],
                yearsOfExperience: experience[i],
                endorsed: endorsed[i]
              });
            }
          }
        } catch (e) {
          console.warn('Error parsing developer skills:', e);
        }
      }
      
      // Parse specializations
      let specializations: string[] = [];
      if (row.specializations && row.specializations !== 'null') {
        try {
          specializations = JSON.parse(row.specializations).filter((s: any) => s !== null);
        } catch (e) {
          console.warn('Error parsing developer specializations:', e);
        }
      }
      
      // Parse education
      const education = [];
      if (row.education_institutions && row.education_institutions !== 'null') {
        try {
          const institutions = JSON.parse(row.education_institutions);
          const degrees = JSON.parse(row.education_degrees);
          const fields = JSON.parse(row.education_fields);
          const startYears = JSON.parse(row.education_start_years);
          const endYears = JSON.parse(row.education_end_years);
          
          for (let i = 0; i < institutions.length; i++) {
            if (institutions[i] !== null) {
              education.push({
                institution: institutions[i],
                degree: degrees[i],
                field: fields[i],
                startYear: startYears[i],
                endYear: endYears[i]
              });
            }
          }
        } catch (e) {
          console.warn('Error parsing developer education:', e);
        }
      }
      
      // Parse certifications
      const certifications = [];
      if (row.certification_names && row.certification_names !== 'null') {
        try {
          const names = JSON.parse(row.certification_names);
          const issuers = JSON.parse(row.certification_issuers);
          const issueDates = JSON.parse(row.certification_issue_dates);
          
          for (let i = 0; i < names.length; i++) {
            if (names[i] !== null) {
              certifications.push({
                name: names[i],
                issuer: issuers[i],
                issueDate: issueDates[i]
              });
            }
          }
        } catch (e) {
          console.warn('Error parsing developer certifications:', e);
        }
      }
      
      // Parse portfolio
      const portfolio = [];
      if (row.portfolio_ids && row.portfolio_ids !== 'null') {
        try {
          const ids = JSON.parse(row.portfolio_ids);
          const titles = JSON.parse(row.portfolio_titles);
          const descriptions = JSON.parse(row.portfolio_descriptions);
          
          for (let i = 0; i < ids.length; i++) {
            if (ids[i] !== null) {
              portfolio.push({
                id: ids[i],
                title: titles[i],
                description: descriptions[i]
              });
            }
          }
        } catch (e) {
          console.warn('Error parsing developer portfolio:', e);
        }
      }
      
      // Parse languages
      const languages = [];
      if (row.language_names && row.language_names !== 'null') {
        try {
          const names = JSON.parse(row.language_names);
          const proficiencies = JSON.parse(row.language_proficiencies);
          
          for (let i = 0; i < names.length; i++) {
            if (names[i] !== null) {
              languages.push({
                name: names[i],
                proficiency: proficiencies[i]
              });
            }
          }
        } catch (e) {
          console.warn('Error parsing developer languages:', e);
        }
      }
      
      // Parse JSON fields with error handling
      let badges = [];
      try {
        badges = row.badges ? JSON.parse(row.badges) : [];
      } catch (e) {
        console.warn('Error parsing developer badges:', e);
      }
      
      let frameworks = [];
      try {
        frameworks = row.frameworks ? JSON.parse(row.frameworks) : [];
      } catch (e) {
        console.warn('Error parsing developer frameworks:', e);
      }
      
      let programmingLanguages = [];
      try {
        programmingLanguages = row.programming_languages ? JSON.parse(row.programming_languages) : [];
      } catch (e) {
        console.warn('Error parsing developer programming languages:', e);
      }
      
      let apiExperience = [];
      try {
        apiExperience = row.api_experience ? JSON.parse(row.api_experience) : [];
      } catch (e) {
        console.warn('Error parsing developer API experience:', e);
      }
      
      let preferredProjectTypes = [];
      try {
        preferredProjectTypes = row.preferred_project_types ? JSON.parse(row.preferred_project_types) : [];
      } catch (e) {
        console.warn('Error parsing developer preferred project types:', e);
      }
      
      return {
        id: row.id,
        type: 'developer',
        name: row.name,
        email: row.email,
        avatar: row.avatar,
        location: row.location,
        timezone: row.timezone,
        hourlyRate: row.hourly_rate,
        currency: row.currency,
        experience: row.experience,
        rating: row.rating,
        reviewCount: row.review_count,
        completedProjects: row.completed_projects,
        responseTime: row.response_time,
        lastActive: row.last_active,
        verified: row.verified,
        topRated: row.top_rated,
        badges,
        description: row.description,
        skills,
        specializations,
        githubUrl: row.github_url,
        linkedinUrl: row.linkedin_url,
        websiteUrl: row.website_url,
        education,
        certifications,
        frameworks,
        programmingLanguages,
        apiExperience,
        preferredProjectTypes,
        portfolio,
        languages,
        createdAt: row.created_at
      } as DeveloperProfile;
    } catch (error) {
      console.error('Error fetching developer from database:', error);
      throw error;
    }
  }
  
  return null;
};

// Vendor queries
export const getVendors = async (): Promise<VendorProfile[]> => {
  if (await isDatabaseAvailable()) {
    try {
      const [rows] = await executeQuery(`
        SELECT v.*,
               JSON_ARRAYAGG(vs.name) as service_names,
               JSON_ARRAYAGG(vs.description) as service_descriptions,
               JSON_ARRAYAGG(vs.category) as service_categories,
               JSON_ARRAYAGG(vs.pricing) as service_pricing,
               JSON_ARRAYAGG(vs.delivery_time) as service_delivery_times,
               JSON_ARRAYAGG(vport.id) as portfolio_ids,
               JSON_ARRAYAGG(vport.title) as portfolio_titles,
               JSON_ARRAYAGG(vport.description) as portfolio_descriptions,
               JSON_ARRAYAGG(vlang.language_name) as language_names,
               JSON_ARRAYAGG(vlang.proficiency) as language_proficiencies
        FROM vendors v
        LEFT JOIN vendor_services vs ON v.id = vs.vendor_id
        LEFT JOIN vendor_portfolio vport ON v.id = vport.vendor_id
        LEFT JOIN vendor_languages vlang ON v.id = vlang.vendor_id
        GROUP BY v.id
      `);
      
      // Process the results to match the VendorProfile interface
      return (rows as any[]).map(row => {
        // Parse services
        const services = [];
        if (row.service_names && row.service_names !== 'null') {
          try {
            const names = JSON.parse(row.service_names);
            const descriptions = JSON.parse(row.service_descriptions);
            const categories = JSON.parse(row.service_categories);
            const pricing = JSON.parse(row.service_pricing);
            const deliveryTimes = JSON.parse(row.service_delivery_times);
            
            for (let i = 0; i < names.length; i++) {
              if (names[i] !== null) {
                services.push({
                  name: names[i],
                  description: descriptions[i],
                  category: categories[i],
                  pricing: pricing[i],
                  deliveryTime: deliveryTimes[i]
                });
              }
            }
          } catch (e) {
            console.warn('Error parsing vendor services:', e);
          }
        }
        
        // Parse portfolio
        const portfolio = [];
        if (row.portfolio_ids && row.portfolio_ids !== 'null') {
          try {
            const ids = JSON.parse(row.portfolio_ids);
            const titles = JSON.parse(row.portfolio_titles);
            const descriptions = JSON.parse(row.portfolio_descriptions);
            
            for (let i = 0; i < ids.length; i++) {
              if (ids[i] !== null) {
                portfolio.push({
                  id: ids[i],
                  title: titles[i],
                  description: descriptions[i]
                });
              }
            }
          } catch (e) {
            console.warn('Error parsing vendor portfolio:', e);
          }
        }
        
        // Parse languages
        const languages = [];
        if (row.language_names && row.language_names !== 'null') {
          try {
            const names = JSON.parse(row.language_names);
            const proficiencies = JSON.parse(row.language_proficiencies);
            
            for (let i = 0; i < names.length; i++) {
              if (names[i] !== null) {
                languages.push({
                  name: names[i],
                  proficiency: proficiencies[i]
                });
              }
            }
          } catch (e) {
            console.warn('Error parsing vendor languages:', e);
          }
        }
        
        // Parse JSON fields with error handling
        let badges = [];
        try {
          badges = row.badges ? JSON.parse(row.badges) : [];
        } catch (e) {
          console.warn('Error parsing vendor badges:', e);
        }
        
        let industries = [];
        try {
          industries = row.industries ? JSON.parse(row.industries) : [];
        } catch (e) {
          console.warn('Error parsing vendor industries:', e);
        }
        
        return {
          id: row.id,
          type: 'vendor',
          name: row.name,
          email: row.email,
          avatar: row.avatar,
          location: row.location,
          timezone: row.timezone,
          hourlyRate: row.hourly_rate,
          currency: row.currency,
          experience: row.experience,
          rating: row.rating,
          reviewCount: row.review_count,
          completedProjects: row.completed_projects,
          responseTime: row.response_time,
          lastActive: row.last_active,
          verified: row.verified,
          topRated: row.top_rated,
          badges,
          description: row.description,
          companyName: row.company_name,
          companySize: row.company_size,
          teamMembers: row.team_members,
          clientRetentionRate: row.client_retention_rate,
          averageProjectDuration: row.average_project_duration,
          minimumProjectBudget: row.minimum_project_budget,
          maxConcurrentProjects: row.max_concurrent_projects,
          businessRegistration: row.business_registration,
          insuranceCoverage: row.insurance_coverage,
          ndaSigning: row.nda_signing,
          paymentTerms: row.payment_terms,
          services,
          industries,
          portfolio,
          languages,
          createdAt: row.created_at
        } as VendorProfile;
      });
    } catch (error) {
      console.error('Error fetching vendors from database:', error);
      throw error;
    }
  }
  
  return [];
};

export const getVendorById = async (id: string): Promise<VendorProfile | null> => {
  if (await isDatabaseAvailable()) {
    try {
      const [rows] = await executeQuery(`
        SELECT v.*,
               JSON_ARRAYAGG(vs.name) as service_names,
               JSON_ARRAYAGG(vs.description) as service_descriptions,
               JSON_ARRAYAGG(vs.category) as service_categories,
               JSON_ARRAYAGG(vs.pricing) as service_pricing,
               JSON_ARRAYAGG(vs.delivery_time) as service_delivery_times,
               JSON_ARRAYAGG(vport.id) as portfolio_ids,
               JSON_ARRAYAGG(vport.title) as portfolio_titles,
               JSON_ARRAYAGG(vport.description) as portfolio_descriptions,
               JSON_ARRAYAGG(vlang.language_name) as language_names,
               JSON_ARRAYAGG(vlang.proficiency) as language_proficiencies
        FROM vendors v
        LEFT JOIN vendor_services vs ON v.id = vs.vendor_id
        LEFT JOIN vendor_portfolio vport ON v.id = vport.vendor_id
        LEFT JOIN vendor_languages vlang ON v.id = vlang.vendor_id
        WHERE v.id = ?
        GROUP BY v.id
      `, [id]);
      
      const vendors = rows as any[];
      if (vendors.length === 0) return null;
      
      const row = vendors[0];
      
      // Parse services
      const services = [];
      if (row.service_names && row.service_names !== 'null') {
        try {
          const names = JSON.parse(row.service_names);
          const descriptions = JSON.parse(row.service_descriptions);
          const categories = JSON.parse(row.service_categories);
          const pricing = JSON.parse(row.service_pricing);
          const deliveryTimes = JSON.parse(row.service_delivery_times);
          
          for (let i = 0; i < names.length; i++) {
            if (names[i] !== null) {
              services.push({
                name: names[i],
                description: descriptions[i],
                category: categories[i],
                pricing: pricing[i],
                deliveryTime: deliveryTimes[i]
              });
            }
          }
        } catch (e) {
          console.warn('Error parsing vendor services:', e);
        }
      }
      
      // Parse portfolio
      const portfolio = [];
      if (row.portfolio_ids && row.portfolio_ids !== 'null') {
        try {
          const ids = JSON.parse(row.portfolio_ids);
          const titles = JSON.parse(row.portfolio_titles);
          const descriptions = JSON.parse(row.portfolio_descriptions);
          
          for (let i = 0; i < ids.length; i++) {
            if (ids[i] !== null) {
              portfolio.push({
                id: ids[i],
                title: titles[i],
                description: descriptions[i]
              });
            }
          }
        } catch (e) {
          console.warn('Error parsing vendor portfolio:', e);
        }
      }
      
      // Parse languages
      const languages = [];
      if (row.language_names && row.language_names !== 'null') {
        try {
          const names = JSON.parse(row.language_names);
          const proficiencies = JSON.parse(row.language_proficiencies);
          
          for (let i = 0; i < names.length; i++) {
            if (names[i] !== null) {
              languages.push({
                name: names[i],
                proficiency: proficiencies[i]
              });
            }
          }
        } catch (e) {
          console.warn('Error parsing vendor languages:', e);
        }
      }
      
      // Parse JSON fields with error handling
      let badges = [];
      try {
        badges = row.badges ? JSON.parse(row.badges) : [];
      } catch (e) {
        console.warn('Error parsing vendor badges:', e);
      }
      
      let industries = [];
      try {
        industries = row.industries ? JSON.parse(row.industries) : [];
      } catch (e) {
        console.warn('Error parsing vendor industries:', e);
      }
      
      return {
        id: row.id,
        type: 'vendor',
        name: row.name,
        email: row.email,
        avatar: row.avatar,
        location: row.location,
        timezone: row.timezone,
        hourlyRate: row.hourly_rate,
        currency: row.currency,
        experience: row.experience,
        rating: row.rating,
        reviewCount: row.review_count,
        completedProjects: row.completed_projects,
        responseTime: row.response_time,
        lastActive: row.last_active,
        verified: row.verified,
        topRated: row.top_rated,
        badges,
        description: row.description,
        companyName: row.company_name,
        companySize: row.company_size,
        teamMembers: row.team_members,
        clientRetentionRate: row.client_retention_rate,
        averageProjectDuration: row.average_project_duration,
        minimumProjectBudget: row.minimum_project_budget,
        maxConcurrentProjects: row.max_concurrent_projects,
        businessRegistration: row.business_registration,
        insuranceCoverage: row.insurance_coverage,
        ndaSigning: row.nda_signing,
        paymentTerms: row.payment_terms,
        services,
        industries,
        portfolio,
        languages,
        createdAt: row.created_at
      } as VendorProfile;
    } catch (error) {
      console.error('Error fetching vendor from database:', error);
      throw error;
    }
  }
  
  return null;
};

// Customer queries
export const getCustomers = async (): Promise<CustomerProfile[]> => {
  if (await isDatabaseAvailable()) {
    try {
      const [rows] = await executeQuery('SELECT * FROM customers');
      return rows as CustomerProfile[];
    } catch (error) {
      console.error('Error fetching customers from database:', error);
      throw error;
    }
  }
  
  return [];
};

export const getCustomerById = async (id: string): Promise<CustomerProfile | null> => {
  if (await isDatabaseAvailable()) {
    try {
      const [rows] = await executeQuery('SELECT * FROM customers WHERE id = ?', [id]);
      const customers = rows as CustomerProfile[];
      return customers.length > 0 ? customers[0] : null;
    } catch (error) {
      console.error('Error fetching customer from database:', error);
      throw error;
    }
  }
  
  return null;
};

// Search queries
export const searchDevelopers = async (filters: any = {}): Promise<DeveloperProfile[]> => {
  if (await isDatabaseAvailable()) {
    try {
      let query = `
        SELECT d.*,
               JSON_ARRAYAGG(ds.skill_name) as skills_names,
               JSON_ARRAYAGG(ds.level) as skills_levels,
               JSON_ARRAYAGG(ds.years_of_experience) as skills_experience,
               JSON_ARRAYAGG(ds.endorsed) as skills_endorsed,
               JSON_ARRAYAGG(dspec.specialization) as specializations
        FROM developers d
        LEFT JOIN developer_skills ds ON d.id = ds.developer_id
        LEFT JOIN developer_specializations dspec ON d.id = dspec.developer_id
      `;
      
      const conditions = [];
      const params: any[] = [];
      
      // Apply filters
      if (filters.searchTerm) {
        conditions.push('(d.name LIKE ? OR d.description LIKE ?)');
        params.push(`%${filters.searchTerm}%`, `%${filters.searchTerm}%`);
      }
      
      if (filters.location) {
        conditions.push('d.location LIKE ?');
        params.push(`%${filters.location}%`);
      }
      
      if (filters.hourlyRateMin !== undefined) {
        conditions.push('d.hourly_rate >= ?');
        params.push(filters.hourlyRateMin);
      }
      
      if (filters.hourlyRateMax !== undefined) {
        conditions.push('d.hourly_rate <= ?');
        params.push(filters.hourlyRateMax);
      }
      
      if (filters.experienceMin !== undefined) {
        conditions.push('d.experience >= ?');
        params.push(filters.experienceMin);
      }
      
      if (filters.rating !== undefined) {
        conditions.push('d.rating >= ?');
        params.push(filters.rating);
      }
      
      if (filters.verified !== undefined) {
        conditions.push('d.verified = ?');
        params.push(filters.verified);
      }
      
      if (filters.topRated !== undefined) {
        conditions.push('d.top_rated = ?');
        params.push(filters.topRated);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' GROUP BY d.id';
      
      // Add pagination
      if (filters.limit !== undefined && filters.offset !== undefined) {
        query += ' LIMIT ? OFFSET ?';
        params.push(filters.limit, filters.offset);
      }
      
      const [rows] = await executeQuery(query, params);
      
      // Process the results to match the DeveloperProfile interface
      return (rows as any[]).map(row => {
        // Parse skills
        const skills = [];
        if (row.skills_names && row.skills_names !== 'null') {
          try {
            const names = JSON.parse(row.skills_names);
            const levels = JSON.parse(row.skills_levels);
            const experience = JSON.parse(row.skills_experience);
            const endorsed = JSON.parse(row.skills_endorsed);
            
            for (let i = 0; i < names.length; i++) {
              if (names[i] !== null) {
                skills.push({
                  name: names[i],
                  level: levels[i],
                  yearsOfExperience: experience[i],
                  endorsed: endorsed[i]
                });
              }
            }
          } catch (e) {
            console.warn('Error parsing developer skills:', e);
          }
        }
        
        // Parse specializations
        let specializations: string[] = [];
        if (row.specializations && row.specializations !== 'null') {
          try {
            specializations = JSON.parse(row.specializations).filter((s: any) => s !== null);
          } catch (e) {
            console.warn('Error parsing developer specializations:', e);
          }
        }
        
        // Parse JSON fields with error handling
        let badges = [];
        try {
          badges = row.badges ? JSON.parse(row.badges) : [];
        } catch (e) {
          console.warn('Error parsing developer badges:', e);
        }
        
        let frameworks = [];
        try {
          frameworks = row.frameworks ? JSON.parse(row.frameworks) : [];
        } catch (e) {
          console.warn('Error parsing developer frameworks:', e);
        }
        
        let programmingLanguages = [];
        try {
          programmingLanguages = row.programming_languages ? JSON.parse(row.programming_languages) : [];
        } catch (e) {
          console.warn('Error parsing developer programming languages:', e);
        }
        
        let apiExperience = [];
        try {
          apiExperience = row.api_experience ? JSON.parse(row.api_experience) : [];
        } catch (e) {
          console.warn('Error parsing developer API experience:', e);
        }
        
        let preferredProjectTypes = [];
        try {
          preferredProjectTypes = row.preferred_project_types ? JSON.parse(row.preferred_project_types) : [];
        } catch (e) {
          console.warn('Error parsing developer preferred project types:', e);
        }
        
        return {
          id: row.id,
          type: 'developer',
          name: row.name,
          email: row.email,
          avatar: row.avatar,
          location: row.location,
          timezone: row.timezone,
          hourlyRate: row.hourly_rate,
          currency: row.currency,
          experience: row.experience,
          rating: row.rating,
          reviewCount: row.review_count,
          completedProjects: row.completed_projects,
          responseTime: row.response_time,
          lastActive: row.last_active,
          verified: row.verified,
          topRated: row.top_rated,
          badges,
          description: row.description,
          skills,
          specializations,
          githubUrl: row.github_url,
          linkedinUrl: row.linkedin_url,
          websiteUrl: row.website_url,
          education: [],
          certifications: [],
          frameworks,
          programmingLanguages,
          apiExperience,
          preferredProjectTypes,
          portfolio: [],
          languages: [],
          createdAt: row.created_at
        } as DeveloperProfile;
      });
    } catch (error) {
      console.error('Error searching developers in database:', error);
      throw error;
    }
  }
  
  return [];
};

export const searchVendors = async (filters: any = {}): Promise<VendorProfile[]> => {
  if (await isDatabaseAvailable()) {
    try {
      let query = `
        SELECT v.*,
               JSON_ARRAYAGG(vs.name) as service_names,
               JSON_ARRAYAGG(vs.category) as service_categories
        FROM vendors v
        LEFT JOIN vendor_services vs ON v.id = vs.vendor_id
      `;
      
      const conditions = [];
      const params: any[] = [];
      
      // Apply filters
      if (filters.searchTerm) {
        conditions.push('(v.name LIKE ? OR v.description LIKE ? OR v.company_name LIKE ?)');
        params.push(`%${filters.searchTerm}%`, `%${filters.searchTerm}%`, `%${filters.searchTerm}%`);
      }
      
      if (filters.location) {
        conditions.push('v.location LIKE ?');
        params.push(`%${filters.location}%`);
      }
      
      if (filters.hourlyRateMin !== undefined) {
        conditions.push('v.hourly_rate >= ?');
        params.push(filters.hourlyRateMin);
      }
      
      if (filters.hourlyRateMax !== undefined) {
        conditions.push('v.hourly_rate <= ?');
        params.push(filters.hourlyRateMax);
      }
      
      if (filters.companySize) {
        conditions.push('v.company_size = ?');
        params.push(filters.companySize);
      }
      
      if (filters.rating !== undefined) {
        conditions.push('v.rating >= ?');
        params.push(filters.rating);
      }
      
      if (filters.verified !== undefined) {
        conditions.push('v.verified = ?');
        params.push(filters.verified);
      }
      
      if (filters.topRated !== undefined) {
        conditions.push('v.top_rated = ?');
        params.push(filters.topRated);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' GROUP BY v.id';
      
      // Add pagination
      if (filters.limit !== undefined && filters.offset !== undefined) {
        query += ' LIMIT ? OFFSET ?';
        params.push(filters.limit, filters.offset);
      }
      
      const [rows] = await executeQuery(query, params);
      
      // Process the results to match the VendorProfile interface
      return (rows as any[]).map(row => {
        // Parse services
        const services = [];
        if (row.service_names && row.service_names !== 'null') {
          try {
            const names = JSON.parse(row.service_names);
            const categories = JSON.parse(row.service_categories);
            
            for (let i = 0; i < names.length; i++) {
              if (names[i] !== null) {
                services.push({
                  name: names[i],
                  description: '',
                  category: categories[i],
                  pricing: 'Fixed',
                  deliveryTime: ''
                });
              }
            }
          } catch (e) {
            console.warn('Error parsing vendor services:', e);
          }
        }
        
        // Parse JSON fields with error handling
        let badges = [];
        try {
          badges = row.badges ? JSON.parse(row.badges) : [];
        } catch (e) {
          console.warn('Error parsing vendor badges:', e);
        }
        
        let industries = [];
        try {
          industries = row.industries ? JSON.parse(row.industries) : [];
        } catch (e) {
          console.warn('Error parsing vendor industries:', e);
        }
        
        return {
          id: row.id,
          type: 'vendor',
          name: row.name,
          email: row.email,
          avatar: row.avatar,
          location: row.location,
          timezone: row.timezone,
          hourlyRate: row.hourly_rate,
          currency: row.currency,
          experience: row.experience,
          rating: row.rating,
          reviewCount: row.review_count,
          completedProjects: row.completed_projects,
          responseTime: row.response_time,
          lastActive: row.last_active,
          verified: row.verified,
          topRated: row.top_rated,
          badges,
          description: row.description,
          companyName: row.company_name,
          companySize: row.company_size,
          teamMembers: row.team_members,
          clientRetentionRate: row.client_retention_rate,
          averageProjectDuration: row.average_project_duration,
          minimumProjectBudget: row.minimum_project_budget,
          maxConcurrentProjects: row.max_concurrent_projects,
          businessRegistration: row.business_registration,
          insuranceCoverage: row.insurance_coverage,
          ndaSigning: row.nda_signing,
          paymentTerms: row.payment_terms,
          services,
          industries,
          portfolio: [],
          languages: [],
          createdAt: row.created_at
        } as VendorProfile;
      });
    } catch (error) {
      console.error('Error searching vendors in database:', error);
      throw error;
    }
  }
  
  return [];
};

// Get total count of developers with filters
export const getDevelopersCount = async (filters: any = {}): Promise<number> => {
  if (await isDatabaseAvailable()) {
    try {
      let query = 'SELECT COUNT(DISTINCT d.id) as count FROM developers d';
      const conditions = [];
      const params: any[] = [];
      
      // Apply filters
      if (filters.searchTerm) {
        conditions.push('(d.name LIKE ? OR d.description LIKE ?)');
        params.push(`%${filters.searchTerm}%`, `%${filters.searchTerm}%`);
      }
      
      if (filters.location) {
        conditions.push('d.location LIKE ?');
        params.push(`%${filters.location}%`);
      }
      
      if (filters.hourlyRateMin !== undefined) {
        conditions.push('d.hourly_rate >= ?');
        params.push(filters.hourlyRateMin);
      }
      
      if (filters.hourlyRateMax !== undefined) {
        conditions.push('d.hourly_rate <= ?');
        params.push(filters.hourlyRateMax);
      }
      
      if (filters.experienceMin !== undefined) {
        conditions.push('d.experience >= ?');
        params.push(filters.experienceMin);
      }
      
      if (filters.rating !== undefined) {
        conditions.push('d.rating >= ?');
        params.push(filters.rating);
      }
      
      if (filters.verified !== undefined) {
        conditions.push('d.verified = ?');
        params.push(filters.verified);
      }
      
      if (filters.topRated !== undefined) {
        conditions.push('d.top_rated = ?');
        params.push(filters.topRated);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      const [rows] = await executeQuery(query, params);
      return (rows as any[])[0]?.count || 0;
    } catch (error) {
      console.error('Error getting developers count:', error);
      throw error;
    }
  }
  
  return 0;
};

// Get total count of vendors with filters
export const getVendorsCount = async (filters: any = {}): Promise<number> => {
  if (await isDatabaseAvailable()) {
    try {
      let query = 'SELECT COUNT(DISTINCT v.id) as count FROM vendors v';
      const conditions = [];
      const params: any[] = [];
      
      // Apply filters
      if (filters.searchTerm) {
        conditions.push('(v.name LIKE ? OR v.description LIKE ? OR v.company_name LIKE ?)');
        params.push(`%${filters.searchTerm}%`, `%${filters.searchTerm}%`, `%${filters.searchTerm}%`);
      }
      
      if (filters.location) {
        conditions.push('v.location LIKE ?');
        params.push(`%${filters.location}%`);
      }
      
      if (filters.hourlyRateMin !== undefined) {
        conditions.push('v.hourly_rate >= ?');
        params.push(filters.hourlyRateMin);
      }
      
      if (filters.hourlyRateMax !== undefined) {
        conditions.push('v.hourly_rate <= ?');
        params.push(filters.hourlyRateMax);
      }
      
      if (filters.companySize) {
        conditions.push('v.company_size = ?');
        params.push(filters.companySize);
      }
      
      if (filters.rating !== undefined) {
        conditions.push('v.rating >= ?');
        params.push(filters.rating);
      }
      
      if (filters.verified !== undefined) {
        conditions.push('v.verified = ?');
        params.push(filters.verified);
      }
      
      if (filters.topRated !== undefined) {
        conditions.push('v.top_rated = ?');
        params.push(filters.topRated);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      const [rows] = await executeQuery(query, params);
      return (rows as any[])[0]?.count || 0;
    } catch (error) {
      console.error('Error getting vendors count:', error);
      throw error;
    }
  }
  
  return 0;
};

// Get distinct skills for filtering
export const getDistinctSkills = async (): Promise<string[]> => {
  if (await isDatabaseAvailable()) {
    try {
      const [rows] = await executeQuery(`
        SELECT DISTINCT skill_name as skill
        FROM developer_skills
        WHERE skill_name IS NOT NULL
        ORDER BY skill_name
      `);
      return (rows as any[]).map(row => row.skill);
    } catch (error) {
      console.error('Error getting distinct skills:', error);
      throw error;
    }
  }
  
  return [];
};

// Get distinct specializations for filtering
export const getDistinctSpecializations = async (): Promise<string[]> => {
  if (await isDatabaseAvailable()) {
    try {
      const [rows] = await executeQuery(`
        SELECT DISTINCT specialization
        FROM developer_specializations
        WHERE specialization IS NOT NULL
        ORDER BY specialization
      `);
      return (rows as any[]).map(row => row.specialization);
    } catch (error) {
      console.error('Error getting distinct specializations:', error);
      throw error;
    }
  }
  
  return [];
};

// Get distinct locations for filtering
export const getDistinctLocations = async (): Promise<string[]> => {
  if (await isDatabaseAvailable()) {
    try {
      const [rows] = await executeQuery(`
        SELECT DISTINCT location
        FROM (
          SELECT location FROM developers
          UNION
          SELECT location FROM vendors
          UNION
          SELECT location FROM customers
        ) AS all_locations
        WHERE location IS NOT NULL
        ORDER BY location
      `);
      return (rows as any[]).map(row => row.location);
    } catch (error) {
      console.error('Error getting distinct locations:', error);
      throw error;
    }
  }
  
  return [];
};

// Get distinct services for filtering
export const getDistinctServices = async (): Promise<string[]> => {
  if (await isDatabaseAvailable()) {
    try {
      const [rows] = await executeQuery(`
        SELECT DISTINCT name as service
        FROM vendor_services
        WHERE name IS NOT NULL
        ORDER BY name
      `);
      return (rows as any[]).map(row => row.service);
    } catch (error) {
      console.error('Error getting distinct services:', error);
      throw error;
    }
  }
  
  return [];
};

// Get distinct industries for filtering
export const getDistinctIndustries = async (): Promise<string[]> => {
  if (await isDatabaseAvailable()) {
    try {
      const [rows] = await executeQuery(`
        SELECT DISTINCT industry
        FROM customers
        WHERE industry IS NOT NULL
        ORDER BY industry
      `);
      return (rows as any[]).map(row => row.industry);
    } catch (error) {
      console.error('Error getting distinct industries:', error);
      throw error;
    }
  }
  
  return [];
};