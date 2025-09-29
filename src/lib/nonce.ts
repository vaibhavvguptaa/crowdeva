import { headers } from 'next/headers';

// Get nonce from headers in server components
export async function getNonceFromHeaders(): Promise<string | null> {
  try {
    const headersList = await headers();
    return headersList.get('X-Nonce');
  } catch (error) {
    // headers() can only be called in server components
    // If called in client component, it will throw an error
    return null;
  }
}