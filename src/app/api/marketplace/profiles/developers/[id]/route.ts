import { NextResponse } from 'next/server';
import pool from '@/lib/db/connection';
import { formatMySQLDateTime } from '@/lib/utils';

// PUT /api/marketplace/profiles/developers/:id
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const {
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
      
      // Update developer profile
      await connection.execute(`
        UPDATE developers SET
          name = ?, email = ?, avatar = ?, location = ?, timezone = ?,
          hourly_rate = ?, currency = ?, experience = ?, rating = ?,
          review_count = ?, completed_projects = ?, response_time = ?,
          last_active = ?, verified = ?, top_rated = ?, badges = ?,
          description = ?, github_url = ?, linkedin_url = ?, website_url = ?,
          frameworks = ?, programming_languages = ?, api_experience = ?,
          preferred_project_types = ?, updated_at = ?
        WHERE id = ?
      `, [
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
        formatMySQLDateTime(),
        id
      ]);

      // Delete existing related data
      await connection.execute('DELETE FROM developer_skills WHERE developer_id = ?', [id]);
      await connection.execute('DELETE FROM developer_specializations WHERE developer_id = ?', [id]);
      await connection.execute('DELETE FROM developer_education WHERE developer_id = ?', [id]);
      await connection.execute('DELETE FROM developer_certifications WHERE developer_id = ?', [id]);
      await connection.execute('DELETE FROM developer_portfolio WHERE developer_id = ?', [id]);
      await connection.execute('DELETE FROM developer_languages WHERE developer_id = ?', [id]);

      // Insert new skills
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

      // Insert new specializations
      for (const specialization of specializations) {
        await connection.execute(`
          INSERT INTO developer_specializations (
            developer_id, specialization
          ) VALUES (?, ?)
        `, [id, specialization]);
      }

      // Insert new education
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

      // Insert new certifications
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

      // Insert new portfolio items
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

      // Insert new languages
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
        message: 'Developer profile updated successfully',
        id 
      });
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      console.error('Error updating developer profile:', error);
      return NextResponse.json(
        { error: 'Failed to update developer profile' },
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