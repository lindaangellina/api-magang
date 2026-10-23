import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
  },
  testMatch: ["<rootDir>/tests/integration/**/*.test.ts"],
  setupFiles: ["<rootDir>/tests/integration/setup.ts"],
  setupFilesAfterEnv: ["<rootDir>/tests/setupAfterEnv.ts"],
  clearMocks: true,
  testTimeout: 30000,
  // Semua file integration test memakai SATU database dan saling TRUNCATE.
  // Kalau berjalan paralel, test satu file bisa menghapus data file lain.
  maxWorkers: 1,
};

export default config;