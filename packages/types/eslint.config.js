import js from "@eslint/js";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

const typesOnlyMessage =
  "packages/types is types-only -- no runtime declarations (interface/type/re-export only).";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.ts"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "no-restricted-syntax": [
        "error",
        { selector: "FunctionDeclaration", message: typesOnlyMessage },
        { selector: "FunctionExpression", message: typesOnlyMessage },
        { selector: "ArrowFunctionExpression", message: typesOnlyMessage },
        { selector: "ClassDeclaration", message: typesOnlyMessage },
        { selector: "TSEnumDeclaration", message: typesOnlyMessage },
        { selector: "VariableDeclaration", message: typesOnlyMessage },
        { selector: "ExportDefaultDeclaration", message: typesOnlyMessage },
      ],
    },
  },
]);
