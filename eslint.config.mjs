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
    ignores: ["src/submodule/**/*", "src/test/**/*", "**/*.test.ts", "**/*.test.tsx"],
  },
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // any型を禁止
      "@typescript-eslint/no-explicit-any": "error",

      // ts-ignore, ts-nocheck, ts-expect-errorを禁止
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-ignore": true,
          "ts-nocheck": true,
          "ts-expect-error": true,
        },
      ],

      // 型アサーション(as)を制限（オブジェクトリテラルでの使用を禁止）
      // 注: `as any` は no-unsafe-* ルールで禁止される
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
          assertionStyle: "as",
          objectLiteralTypeAssertions: "never",
        },
      ],

      // non-null assertion (!) を禁止
      "@typescript-eslint/no-non-null-assertion": "error",

      // 未使用の変数を禁止
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // 浮動Promise（awaitされていないPromise）を禁止
      "@typescript-eslint/no-floating-promises": "error",

      // 安全でないメンバーアクセス（外部ライブラリとの統合でwarnに）
      "@typescript-eslint/no-unsafe-member-access": "warn",

      // 安全でない呼び出し（外部ライブラリとの統合でwarnに）
      "@typescript-eslint/no-unsafe-call": "warn",

      // 安全でない代入（外部ライブラリとの統合でwarnに）
      "@typescript-eslint/no-unsafe-assignment": "warn",

      // 安全でないreturn（外部ライブラリとの統合でwarnに）
      "@typescript-eslint/no-unsafe-return": "warn",

      // 安全でない引数（外部ライブラリとの統合でwarnに）
      "@typescript-eslint/no-unsafe-argument": "warn",

      // オブジェクトリテラルでの型強制を禁止
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          disallowTypeAnnotations: true,
        },
      ],

      // 不要な型アサーションを禁止
      "@typescript-eslint/no-unnecessary-type-assertion": "error",

      // 厳密な等価比較を強制
      eqeqeq: ["error", "always"],

      // varの使用を禁止
      "no-var": "error",

      // constを優先
      "prefer-const": "error",
    },
  },
];

export default eslintConfig;
