/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["dotenv/config"],
  testMatch: ["**/test/**/*.test.ts"],
  // Suítes com --runInBand crescem a cada story; o pool de conexões do banco
  // free-tier (connection_limit=3) pode causar contenção transitória entre
  // suítes que sobe uma app Nest completa (visto na Story 2.3). 5s é curto
  // demais para isso, mesmo sem regressão real de performance.
  testTimeout: 15000,
};
