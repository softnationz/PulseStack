import Fastify from 'fastify';
import { CONFIG } from './config/environment';
import { telemetryQueue } from './workers/queueWorkers';

const fastify = Fastify({ logger: true });

fastify.post('/webhook/github', async (request, reply) => {
  const payload = request.body as any;

  await telemetryQueue.add(`sync-${Date.now()}`, {
    projectId: payload.projectId || 1,
    repoUrl: payload.repository?.url || 'github.com/pulsestack/protocol',
    epoch: payload.epoch || Math.floor(Date.now() / 604800000),
    nonce: Math.floor(Math.random() * 10000000)
  });

  return reply.status(202).send({ processing: true });
});

const start = async () => {
  try {
    await fastify.listen({ port: Number(CONFIG.PORT), host: '0.0.0.0' });
    console.log(`PulseStack Oracle engine running on port ${CONFIG.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
