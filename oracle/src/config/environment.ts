import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT || 4000,
  REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pulsestack',
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
  ORACLE_PRIVATE_KEY: process.env.ORACLE_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  TELEMETRY_CONTRACT_ADDRESS: process.env.TELEMETRY_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  CHAIN_ID: 31337
};
