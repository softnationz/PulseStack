import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { CONFIG } from '../config/environment';
import { GitHubIndexer } from '../services/githubIndexer';
import { TelemetryEngine } from '../services/telemetryEngine';
import { SignerService } from '../services/signerService';

const connection = new IORedis(CONFIG.REDIS_URL, { maxRetriesPerRequest: null });
export const telemetryQueue = new Queue('telemetry-processing', { connection });

const indexer = new GitHubIndexer();
const engine = new TelemetryEngine();
const signer = new SignerService();

new Worker('telemetry-processing', async (job) => {
  console.log(`Processing telemetry job: ${job.id} for project ${job.data.projectId}`);
  const { projectId, repoUrl, epoch, nonce } = job.data;

  const rawMetrics = await indexer.fetchTelemetryData(repoUrl);
  const processed = engine.processMetrics(rawMetrics);
  const signedPayload = await signer.generateEIP712Signature(projectId, epoch, processed, nonce);

  console.log(`Signature generated: ${signedPayload.signature}`);
  return signedPayload;
}, { connection });
