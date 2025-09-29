'use client';

import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { TabSwitcher } from '@/components/signin/TabSwitcher';
import { AnimatedContent } from '@/components/signin/AnimatedContent';
import { ClientOnly } from '@/components/Ui/ClientOnly';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { AuthUserType } from '@/types/auth';
import { generateStructuredData } from '@/lib/seo';

function ForgotPasswordInner() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [activeTab, setActiveTab] = useState<AuthUserType>((searchParams?.get('type') as AuthUserType) || 'customers');
	const [structuredData, setStructuredData] = useState<any>(generateStructuredData(activeTab));

	// Update structured data when tab changes
	React.useEffect(() => {
		setStructuredData(generateStructuredData(activeTab));
		const newPath = `/forgot-password?type=${activeTab}`;
		try {
			window.history.replaceState(null, '', newPath);
		} catch {/* noop */}
	}, [activeTab]);

	const goBackToSignIn = () => { router.push(`/signin?type=${activeTab}`); };

	return (
		<>
			<ClientOnly>
				<script 
					type="application/ld+json" 
					dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} 
					// Note: In a production environment, we would use a nonce here
					// For now, we're relying on the CSP configuration in middleware
				/>
			</ClientOnly>
			<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
				<div className="w-full max-w-6xl mx-auto">
					<div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
						<div className="grid lg:grid-cols-2 min-h-[560px] lg:min-h-[600px]">
							{/* Left Panel */}
							<div className="p-4 lg:p-6 flex flex-col justify-center relative h-full">
								<div className="absolute top-0 left-0 w-32 h-32 bg-green-100/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
								<div className="absolute bottom-0 right-0 w-48 h-48 bg-green-100/30 rounded-full translate-x-1/2 translate-y-1/2" />
								<div className="relative z-10 max-w-md mx-auto w-full">
									<AuthHeader title="Reset your password" subtitle="We will send you instructions to reset it" />
									<div className="mb-4 flex justify-center">
										<div className="overflow-x-auto">
										</div>
									</div>
									<ForgotPasswordForm onBack={goBackToSignIn} userType={activeTab} hideRealmHint />
								</div>
							</div>
							{/* Right Panel */}
							<AnimatedContent activeTab={activeTab} isTransitioning={false} />
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

export default function ForgotPasswordPage() {
	return (
		<ForgotPasswordInner />
	);
}