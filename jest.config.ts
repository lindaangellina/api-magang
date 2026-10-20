import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
  },
  // tests/http dan tests/integration baru dipakai Kamis dan Jumat
  testMatch: ["<rootDir>/tests/unit/**/*.test.ts", "<rootDir>/tests/http/**/*.test.ts"],
  setupFiles: ["<rootDir>/tests/setup.ts"],
  setupFilesAfterEnv: ["<rootDir>/tests/setupAfterEnv.ts"],
  clearMocks: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/index.ts",
    "!src/migrations/**",
    "!src/scripts/**",
    "!src/**/*.d.ts",
  ],
  coverageThreshold: {
    global: { statements: 60, branches: 50, functions: 60, lines: 60 },
  },
};

export default config;