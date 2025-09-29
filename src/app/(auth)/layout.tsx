import type { Metadata } from 'next';
import { generateMetadata, seoConfigs } from '@/lib/seo';

export const metadata: Metadata = generateMetadata(seoConfigs.signIn);

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
