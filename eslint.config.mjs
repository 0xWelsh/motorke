const lintTargets = [
  "src/app/api/auth/**/*.js",
  "src/lib/google-auth.js",
  "src/lib/validate-env.js",
  "jest.setup.js",
];

export default [
  {
    files: lintTargets,
    ignores: ["node_modules/**", ".next/**", ".vercel/**", "coverage/**"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {},
  },
];
