const isTest = process.env.NODE_ENV === 'test';

const config = {
  // Disable heavy PostCSS/Tailwind processing during unit tests to speed up and avoid plugin load errors
  plugins: isTest ? [] : ["@tailwindcss/postcss"],
};

export default config;
