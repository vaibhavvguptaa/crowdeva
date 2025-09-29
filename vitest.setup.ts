import '@testing-library/jest-dom';

// Silence Next.js style imports (tailwind) during tests
// Vitest with css disabled will ignore .css, but ensure no runtime errors
// Provide minimal mocks for matchMedia used by some components/animations
if (!window.matchMedia) {
	// @ts-ignore
	window.matchMedia = () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });
}
