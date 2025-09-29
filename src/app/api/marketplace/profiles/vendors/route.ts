import { NextResponse } from 'next/server';
import pool from '@/lib/db/connection';
import { formatMySQLDateTime } from '@/lib/utils';

// POST /api/marketplace/profiles/vendors
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
      companyName,
      companySize,
      teamMembers,
      clientRetentionRate,
      averageProjectDuration,
      minimumProjectBudget,
      maxConcurrentProjects,
      businessRegistration,
      insuranceCoverage,
      ndaSigning,
      paymentTerms,
      industries,
      services = [],
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
      
      // Insert vendor profile
      await connection.execute(`
        INSERT INTO vendors (
          id, name, email, avatar, location, timezone, hourly_rate, currency,
          experience, rating, review_count, completed_projects, response_time,
          last_active, verified, top_rated, badges, description, company_name,
          company_size, team_members, client_retention_rate, average_project_duration,
          minimum_project_budget, max_concurrent_projects, business_registration,
          insurance_coverage, nda_signing, payment_terms, industries, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        companyName,
        companySize,
        teamMembers,
        clientRetentionRate,
        averageProjectDuration,
        minimumProjectBudget,
        maxConcurrentProjects,
        businessRegistration,
        insuranceCoverage,
        ndaSigning,
        paymentTerms,
        JSON.stringify(industries),
        formatMySQLDateTime()
      ]);

      // Insert services
      for (const service of services) {
        await connection.execute(`
          INSERT INTO vendor_services (
            vendor_id, name, description, category, pricing, delivery_time
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          id,
          service.name,
          service.description,
          service.category,
          service.pricing,
          service.deliveryTime
        ]);
      }

      // Insert portfolio items
      for (const item of portfolio) {
        await connection.execute(`
          INSERT INTO vendor_portfolio (
            id, vendor_id, title, description, image_url, project_url, technologies, completed_at, client_testimonial
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
          INSERT INTO vendor_languages (
            vendor_id, language_name, proficiency
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
        message: 'Vendor profile created successfully',
        id 
      });
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      console.error('Error creating vendor profile:', error);
      return NextResponse.json(
        { error: 'Failed to create vendor profile' },
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