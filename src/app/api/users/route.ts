import { NextRequest, NextResponse } from 'next/server';
import { getKeycloakConfig } from '@/lib/config';
import { CSRFProtection } from '@/lib/csrf';
import { AuthUserType } from '@/types/auth';
import * as dbQueries from '@/lib/db/queries';
import { getServerSession } from '@/lib/session';

interface RegistrationRequest {
  email: string;
  password: string;
  companyName: string;
  firstName: string;
  lastName: string;
  group: AuthUserType;
}

interface KeycloakUserPayload {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  emailVerified: boolean;
  groups: string[];
  attributes: Record<string, string[]>;
  credentials: Array<{ type: string; value: string; temporary: boolean }>;
  requiredActions?: string[];
}

export async function POST(request: NextRequest) {
  try {
    // CSRF validation for state-changing request
    if (!CSRFProtection.validateToken(request)) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    // NOTE: Registration endpoint should NOT require authentication
    // as users are creating accounts and don't have credentials yet
    
    const body: RegistrationRequest = await request.json();
    let { email, password, companyName, firstName, lastName, group } = body;
    
    // Log the received data for debugging
    console.log('Received registration data:', { email, password: '***', companyName, firstName, lastName, group });
    console.log('Company name length:', companyName?.length);
    console.log('Company name is empty string:', companyName === '');
    console.log('Company name is falsy:', !companyName);
    console.log('Company name trimmed is empty:', !companyName || companyName.trim() === '');

    // Validate required fields
    // For developers, companyName is optional (front-end hides it). For others it is required.
    if (!email || !password || !firstName || !lastName || !group) {
      console.log('Missing required fields:', { email: !!email, password: !!password, firstName: !!firstName, lastName: !!lastName, group: !!group });
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Additional validation for companyName based on user type
    // Updated logic to properly handle null/undefined values
    if (group !== 'developers') {
      // For vendors and customers, companyName is required
      // Handle case where companyName might be an empty string instead of null
      console.log('Checking company name for non-developer:', { companyName, trimmed: companyName?.trim() });
      if (companyName === null || companyName === undefined || companyName.trim() === '') {
        console.log('Company name validation failed for non-developer:', { group, companyName, trimmed: companyName?.trim() });
        return NextResponse.json(
          { error: 'Company name is required for vendors and customers' },
          { status: 400 }
        );
      }
      // Trim companyName for vendors/customers
      companyName = companyName.trim();
    } else {
      // For developers, set a default if not provided
      if (!companyName || companyName.trim() === '') {
        companyName = 'Developer'; // sensible default / placeholder
      } else {
        companyName = companyName.trim();
      }
    }
    
    // Trim all other string values to remove whitespace
    email = email.trim();
    firstName = firstName.trim();
    lastName = lastName.trim();
    group = group.trim() as AuthUserType;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Validate auth type
    if (!['customers', 'developers', 'vendors'].includes(group)) {
      return NextResponse.json(
        { error: 'Invalid user type' },
        { status: 400 }
      );
    }

    const config = getKeycloakConfig(group);
    
    const requireTotp = process.env.KEYCLOAK_REQUIRE_TOTP === 'true';

    // Get admin token to create user
    const adminToken = await getAdminToken();
    if (!adminToken) {
      console.error('Failed to get admin token');
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Ensure the group exists in Keycloak
    const groupExists = await ensureGroupExists(adminToken, config, group);
    if (!groupExists) {
      console.error('Failed to create group in Keycloak');
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Prepare user data for Keycloak
  const userData: KeycloakUserPayload = {
      username: email,
      email: email,
      firstName: firstName,
      lastName: lastName,
      enabled: true,
      emailVerified: false,
      groups: [group],
      attributes: {
        companyName: [companyName || ''],
        userType: [group]
      },
      credentials: [{
        type: 'password',
        value: password,
        temporary: false
      }]
    };

    // Enforce TOTP configuration on first login if enabled
    if (requireTotp) {
      userData.requiredActions = ['CONFIGURE_TOTP'];
    }

    // Create user in Keycloak
    console.log('Creating user with config:', {
      url: config.url,
      realm: config.realm,
      clientId: config.clientId
    });
    
    console.log('User data being sent to Keycloak:', JSON.stringify(userData, null, 2));
    
    const createUserResponse = await fetch(
      `${config.url}/admin/realms/${config.realm}/users`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000)
      }
    );

    console.log('Keycloak user creation response status:', createUserResponse.status);
    console.log('Keycloak user creation response headers:', Object.fromEntries(createUserResponse.headers.entries()));
    
    if (!createUserResponse.ok) {
      const errorData = await createUserResponse.text();
      console.error('Keycloak user creation failed:', createUserResponse.status, errorData);
      
      if (createUserResponse.status === 409) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }

    console.log('User created successfully in Keycloak');
    
    return NextResponse.json(
      { 
        message: requireTotp
          ? 'Account created. Please verify your email. On first sign-in you will be required to configure 2FA (authenticator app).'
          : 'Account created successfully. Please check your email to verify your account. (Enable 2FA afterwards in Account Security settings for better protection.)',
        success: true,
        requireTotp
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Function to ensure a group exists in Keycloak
async function ensureGroupExists(adminToken: string, config: any, groupName: string): Promise<boolean> {
  try {
    // First, check if the group already exists
    const groupsResponse = await fetch(
      `${config.url}/admin/realms/${config.realm}/groups`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(5000)
      }
    );

    if (!groupsResponse.ok) {
      const errorText = await groupsResponse.text();
      console.error('Failed to fetch groups from Keycloak:', groupsResponse.status, errorText);
      return false;
    }

    const groups = await groupsResponse.json();
    const existingGroup = groups.find((g: any) => g.name === groupName);
    
    if (existingGroup) {
      console.log(`Group ${groupName} already exists in realm ${config.realm}`);
      return true;
    }

    // If the group doesn't exist, create it
    console.log(`Creating group ${groupName} in realm ${config.realm}`);
    const createGroupResponse = await fetch(
      `${config.url}/admin/realms/${config.realm}/groups`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: groupName }),
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(5000)
      }
    );

    if (!createGroupResponse.ok) {
      const errorText = await createGroupResponse.text();
      console.error('Failed to create group in Keycloak:', createGroupResponse.status, errorText);
      return false;
    }

    console.log(`Group ${groupName} created successfully in realm ${config.realm}`);
    return true;
  } catch (error) {
    console.error('Error ensuring group exists:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error when connecting to Keycloak to ensure group exists.');
    }
    return false;
  }
}

async function getAdminToken(): Promise<string | null> {
  try {
    // Use the public Keycloak URL from environment variables
    const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL;
    // Use the correct admin username from Docker Compose
    const adminUsername = process.env.KEYCLOAK_ADMIN || 'admin@keycloak.local';
    const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD;

    if (!keycloakUrl || !adminPassword) {
      console.error('Missing Keycloak configuration');
      console.error('NEXT_PUBLIC_KEYCLOAK_URL:', keycloakUrl);
      console.error('KEYCLOAK_ADMIN:', adminUsername);
      console.error('KEYCLOAK_ADMIN_PASSWORD:', !!adminPassword);
      return null;
    }

    // Use the correct token endpoint for the master realm
    const tokenEndpoint = `${keycloakUrl}/realms/master/protocol/openid-connect/token`;
    
    const formData = new URLSearchParams();
    formData.append('grant_type', 'password');
    formData.append('client_id', 'admin-cli');
    formData.append('username', adminUsername);
    formData.append('password', adminPassword);

    console.log('Attempting to get admin token from:', tokenEndpoint);
    console.log('Admin username:', adminUsername);
    
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get admin token:', response.status, errorText);
      return null;
    }

    const tokenData = await response.json();
    console.log('Admin token acquired successfully');
    return tokenData.access_token;
    
  } catch (error) {
    console.error('Error getting admin token:', error);
    // Add more specific error handling
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error when connecting to Keycloak. Please check:');
      console.error('1. Keycloak server is running and accessible');
      console.error('2. NEXT_PUBLIC_KEYCLOAK_URL is correctly configured');
      console.error('3. Network connectivity between the application and Keycloak');
    }
    return null;
  }
}

// GET /api/users - Get all users
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await dbQueries.getUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}