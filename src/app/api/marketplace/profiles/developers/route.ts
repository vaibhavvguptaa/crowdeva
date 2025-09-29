import { NextResponse } from 'next/server';
import pool from '@/lib/db/connection';
import { formatMySQLDateTime } from '@/lib/utils';

// POST /api/marketplace/profiles/developers
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      email,
      avatar,
      location,
      timezone,
      hourlyRate,
      currency,
      experience,
      rating,
      reviewCount,
      completedProjects,
      responseTime,
      lastActive,
      verified,
      topRated,
      badges,
      description,
      githubUrl,
      linkedinUrl,
      websiteUrl,
      frameworks,
      programmingLanguages,
      apiExperience,
      preferredProjectTypes,
      skills = [],
      specializations = [],
      education = [],
      certifications = [],
      portfolio = [],
      languages = []
    } = body;

    if (!pool) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    const connection = await pool.getConnection();
    
    try {
      // Start transaction
      await connection.beginTransaction();
      
      // Insert developer profile
      await connection.execute(`
        INSERT INTO developers (
          id, name, email, avatar, location, timezone, hourly_rate, currency,
          experience, rating, review_count, completed_projects, response_time,
          last_active, verified, top_rated, badges, description, github_url,
          linkedin_url, website_url, frameworks, programming_languages,
          api_experience, preferred_project_types, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        name,
        email,
        avatar,
        location,
        timezone,
        hourlyRate,
        currency,
        experience,
        rating,
        reviewCount,
        completedProjects,
        responseTime,
        lastActive,
        verified,
        topRated,
        JSON.stringify(badges),
        description,
        githubUrl,
        linkedinUrl,
        websiteUrl,
        JSON.stringify(frameworks),
        JSON.stringify(programmingLanguages),
        JSON.stringify(apiExperience),
        JSON.stringify(preferredProjectTypes),
        formatMySQLDateTime()
      ]);

      // Insert skills
      for (const skill of skills) {
        await connection.execute(`
          INSERT INTO developer_skills (
            developer_id, skill_name, level, years_of_experience, endorsed
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          id,
          skill.name,
          skill.level,
          skill.yearsOfExperience,
          skill.endorsed
        ]);
      }

      // Insert specializations
      for (const specialization of specializations) {
        await connection.execute(`
          INSERT INTO developer_specializations (
            developer_id, specialization
          ) VALUES (?, ?)
        `, [id, specialization]);
      }

      // Insert education
      for (const edu of education) {
        await connection.execute(`
          INSERT INTO developer_education (
            developer_id, institution, degree, field, start_year, end_year, description
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          id,
          edu.institution,
          edu.degree,
          edu.field,
          edu.startYear,
          edu.endYear,
          edu.description
        ]);
      }

      // Insert certifications
      for (const cert of certifications) {
        await connection.execute(`
          INSERT INTO developer_certifications (
            developer_id, name, issuer, issue_date, expiry_date, credential_id, credential_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          id,
          cert.name,
          cert.issuer,
          cert.issueDate,
          cert.expiryDate,
          cert.credentialId,
          cert.credentialUrl
        ]);
      }

      // Insert portfolio items
      for (const item of portfolio) {
        await connection.execute(`
          INSERT INTO developer_portfolio (
            id, developer_id, title, description, image_url, project_url, technologies, completed_at, client_testimonial
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          item.id,
          id,
          item.title,
          item.description,
          item.imageUrl,
          item.projectUrl,
          JSON.stringify(item.technologies),
          item.completedAt,
          item.clientTestimonial
        ]);
      }

      // Insert languages
      for (const lang of languages) {
        await connection.execute(`
          INSERT INTO developer_languages (
            developer_id, language_name, proficiency
          ) VALUES (?, ?, ?)
        `, [
          id,
          lang.name,
          lang.proficiency
        ]);
      }

      // Commit transaction
      await connection.commit();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Developer profile created successfully',
        id 
      });
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      console.error('Error creating developer profile:', error);
      return NextResponse.json(
        { error: 'Failed to create developer profile' },
        { status: 500 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error parsing request:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}