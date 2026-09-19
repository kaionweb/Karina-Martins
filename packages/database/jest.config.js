/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["dotenv/config"],
  testMatch: ["**/tests/**/*.test.ts"],
  // Mesmo ajuste já aplicado em apps/api/jest.config.js na Story 2.3: o teste de
  // seed (Story 2.4) usa execSync para rodar o script de verdade (novo processo
  // node + tsx + conexão real ao TiDB), que pode passar do timeout padrão de
  // 5s do Jest sob carga, mesmo sem regressão real de performance.
  testTimeout: 15000,
};
