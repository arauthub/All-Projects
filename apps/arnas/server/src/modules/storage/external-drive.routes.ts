import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { externalDriveService } from './external-drive.service.js';

const attachDriveSchema = z.object({
  mountPath: z.string().min(1),
  name: z.string().optional(),
  mediaType: z.enum(['SSD', 'HDD', 'NVME']).optional(),
  setAsPrimaryTarget: z.boolean().optional(),
});

const setPrimarySchema = z.object({
  nodeId: z.string().min(1),
});

const benchmarkSchema = z.object({
  mountPath: z.string().min(1),
});

const ejectSchema = z.object({
  nodeId: z.string().min(1),
});

const simulateSchema = z.object({
  preset: z.enum(['samsung_t7', 'seagate_hdd', 'sandisk_ssd']).default('samsung_t7'),
  setAsPrimaryTarget: z.boolean().default(true),
});

export const externalDriveRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/v1/storage/external-drives
  fastify.get('/', {
    schema: {
      tags: ['External Drive NAS'],
      summary: 'Scan host machine for external HDD/SSD volumes and list attached NAS drives',
      security: [{ bearerAuth: [] }],
    },
  }, async (_request, reply) => {
    const drives = await externalDriveService.scanExternalDrives();
    return reply.status(200).send({
      drives,
      totalDetected: drives.length,
      primaryTarget: drives.find((d) => d.isPrimaryWirelessTarget) || null,
    });
  });

  // POST /api/v1/storage/external-drives/attach
  fastify.post('/attach', {
    schema: {
      tags: ['External Drive NAS'],
      summary: 'Attach an external HDD/SSD as an active NAS storage node for wireless mobile sync',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ message: 'Only administrators can attach external storage drives.' });
    }
    const input = attachDriveSchema.parse(request.body);
    const attached = await externalDriveService.attachExternalDrive(input);
    return reply.status(201).send(attached);
  });

  // POST /api/v1/storage/external-drives/set-primary
  fastify.post('/set-primary', {
    schema: {
      tags: ['External Drive NAS'],
      summary: 'Set an external drive as the primary wireless sync target for mobile uploads',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ message: 'Only administrators can route wireless sync targets.' });
    }
    const { nodeId } = setPrimarySchema.parse(request.body);
    const result = await externalDriveService.setPrimaryWirelessTarget(nodeId);
    return reply.status(200).send(result);
  });

  // POST /api/v1/storage/external-drives/benchmark
  fastify.post('/benchmark', {
    schema: {
      tags: ['External Drive NAS'],
      summary: 'Execute live throughput benchmark (MB/s and IOPS) on an external storage drive',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { mountPath } = benchmarkSchema.parse(request.body);
    const metrics = await externalDriveService.benchmarkDrive(mountPath);
    return reply.status(200).send(metrics);
  });

  // POST /api/v1/storage/external-drives/eject
  fastify.post('/eject', {
    schema: {
      tags: ['External Drive NAS'],
      summary: 'Flush pending writes and safely eject external drive from NAS cluster',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ message: 'Only administrators can eject storage drives.' });
    }
    const { nodeId } = ejectSchema.parse(request.body);
    const result = await externalDriveService.ejectExternalDrive(nodeId);
    return reply.status(200).send(result);
  });

  // POST /api/v1/storage/external-drives/simulate
  fastify.post('/simulate', {
    schema: {
      tags: ['External Drive NAS'],
      summary: 'Quickly mount a simulated external SSD or HDD for demo and testing',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { preset, setAsPrimaryTarget } = simulateSchema.parse(request.body || {});
    let name = 'Samsung T7 Shield 2TB (USB-C SSD)';
    let mountName = 'Samsung_T7_SSD_2TB';
    let mediaType: 'SSD' | 'HDD' | 'NVME' = 'SSD';

    if (preset === 'seagate_hdd') {
      name = 'Seagate Expansion 8TB (USB 3.0 HDD)';
      mountName = 'Seagate_Expansion_8TB';
      mediaType = 'HDD';
    } else if (preset === 'sandisk_ssd') {
      name = 'SanDisk Extreme PRO 4TB (Thunderbolt NVMe)';
      mountName = 'SanDisk_Extreme_4TB';
      mediaType = 'NVME';
    }

    const drivesDir = (externalDriveService as any).simulatedDrivesDir;
    const mountPath = `${drivesDir}/${mountName}`;

    const drive = await externalDriveService.attachExternalDrive({
      mountPath,
      name,
      mediaType,
      setAsPrimaryTarget,
    });

    return reply.status(201).send(drive);
  });
};
