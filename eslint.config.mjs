import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "app/generated/prisma/**", // <-- اضافه شد
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // مخصوص generated
      "@typescript-eslint/no-empty-object-type": "off", // مخصوص generated
    },
  },
];

export default eslintConfig;
