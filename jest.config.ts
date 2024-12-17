import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest", // Tells Jest to use ts-jest for TypeScript files
  testEnvironment: "node", // Node environment for backend tests
  globals: {
    "ts-jest": {
      isolatedModules: true, // Improves performance by treating each file as isolated
    },
  },
};

export default config;
