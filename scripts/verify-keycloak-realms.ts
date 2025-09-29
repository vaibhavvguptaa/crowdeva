/**
 * Keycloak realm & clientId verification script (TypeScript source).
 * Mirrors the compiled dist version but kept in sync for edits.
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { REALM_CONFIGS, AuthUserType } from '@/types/auth';
import { getKeycloakConfig } from '@/lib/config';

type Row = {
	authType: AuthUserType;
	envRealm: string;
	envClientId: string;
	constantRealm: string;
};

const authTypes: AuthUserType[] = ['customers', 'developers', 'vendors'];
const rows: Row[] = authTypes.map(authType => {
	const { realm, clientId } = getKeycloakConfig(authType);
	return {
		authType,
		envRealm: realm,
		envClientId: clientId,
		constantRealm: REALM_CONFIGS[authType].realm,
	};
});

const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || '';
if (!keycloakUrl) {
	console.error('ERROR: NEXT_PUBLIC_KEYCLOAK_URL is not set. Cannot proceed.');
	process.exit(1);
}

// Lightweight colored output helpers
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;

interface FetchResult {
	authType: AuthUserType;
	realm: string | undefined;
	ok: boolean;
	status?: number;
	error?: string;
	issuer?: string;
	tokenEndpoint?: string;
};

async function fetchRealmMetadata(realm: string | undefined, authType: AuthUserType): Promise<FetchResult> {
	if (!realm) {
		return { authType, realm, ok: false, error: 'EMPTY_REALM' };
	}
	const wellKnown = `${keycloakUrl}/realms/${realm}/.well-known/openid-configuration`;
	try {
		const res = await fetch(wellKnown, { method: 'GET' });
		if (!res.ok) {
			return { authType, realm, ok: false, status: res.status, error: `HTTP_${res.status}` };
		}
		const data = await res.json();
		return {
			authType,
			realm,
			ok: true,
			status: res.status,
			issuer: data.issuer,
			tokenEndpoint: data.token_endpoint,
		};
	} catch (e: any) {
		return { authType, realm, ok: false, error: e?.message || 'NETWORK_ERROR' };
	}
}

async function main() {
	console.log(cyan('\n== Keycloak Realm / Client Verification =='));
	console.log('Base URL:', keycloakUrl);

	// 1. Compare env realms with REALM_CONFIGS
	console.log('\nRealm mapping comparison:');
	rows.forEach(r => {
		const realmMatch = r.envRealm && r.constantRealm && r.envRealm === r.constantRealm;
		const realmStatus = realmMatch ? green('MATCH') : r.envRealm ? yellow('DIFF') : red('MISSING');
		if (!r.envRealm) {
			console.log(` - ${r.authType}: env realm ${red('NOT SET')} (expected constant '${r.constantRealm}') clientId='${r.envClientId || '—'}'`);
		} else {
			console.log(` - ${r.authType}: env='${r.envRealm}' constant='${r.constantRealm}' => ${realmStatus} | clientId='${r.envClientId || red('MISSING')}'`);
		}
	});

	// 2. Fetch metadata for each env realm
	console.log('\nFetching OpenID configuration for each realm (env realms):');
	const fetchResults = await Promise.all(rows.map(r => fetchRealmMetadata(r.envRealm, r.authType)));
	fetchResults.forEach(fr => {
		if (!fr.realm) {
			console.log(` - ${fr.authType}: ${red('SKIP')} (no realm)`);
			return;
		}
		if (fr.ok) {
			console.log(` - ${fr.authType}: realm='${fr.realm}' ${green('OK')} (issuer: ${fr.issuer})`);
		} else {
			console.log(` - ${fr.authType}: realm='${fr.realm}' ${red('FAIL')} (${fr.error || fr.status})`);
		}
	});

	// 3. Summary / guidance
	const failures = fetchResults.filter(r => !r.ok).length;
	console.log('\nSummary:');
	if (failures === 0) {
		console.log(green(' All configured realms responded with valid metadata.'));
	} else {
		console.log(red(` ${failures} realm(s) failed metadata fetch. See above.`));
	}
	const missingClientIds = rows.filter(r => !r.envClientId).length;
	if (missingClientIds > 0) {
		console.log(red(` ${missingClientIds} realm(s) missing clientId env vars.`));
	}
	const diffs = rows.filter(r => r.envRealm && r.constantRealm && r.envRealm !== r.constantRealm).length;
	if (diffs) {
		console.log(yellow(` ${diffs} realm name differences between env + REALM_CONFIGS. If REALM_CONFIGS is only for display you can ignore; otherwise align them.`));
	}

	console.log('\nNext steps if issues found:');
	console.log(' 1. Ensure each realm actually exists in Keycloak and matches env var spelling.');
	console.log(' 2. Verify the clientId exists inside each realm (Clients section).');
	console.log(' 3. Add Google IdP (alias "google") to each realm if using social login.');
	console.log(' 4. Update REALM_CONFIGS in types/auth.ts if its realm strings must mirror env realms.');
	console.log('\nDone.');
}

main().catch(e => {
	console.error(red('Script error:'), e);
	process.exit(1);
});