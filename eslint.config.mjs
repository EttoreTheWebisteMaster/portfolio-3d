import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "(?<!globals)\\.(css|scss|sass|less)$",
              message: "All styles live in src/app/globals.css.",
            },
            {
              regex: "^(gsap|@gsap/react)(/|$)",
              message: "Import GSAP from @/lib/gsap (plugins registered once).",
            },
          ],
        },
      ],
      "react/forbid-dom-props": [
        "error",
        {
          forbid: [
            { propName: "style", message: "Move styles to globals.css." },
          ],
        },
      ],
      "react/jsx-no-useless-fragment": "error",
      "react/self-closing-comp": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "max-lines": [
        "warn",
        { max: 200, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    files: ["src/lib/gsap.ts"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    files: ["scripts/**", ".claude/**"],
    rules: { "no-console": "off", "max-lines": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "design/**",
    ".agents/**",
    "shots/**",
    "next-env.d.ts",
  ]),
]);
