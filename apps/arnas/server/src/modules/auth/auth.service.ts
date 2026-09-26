import bcrypt from 'bcrypt';
import { FastifyInstance } from 'fastify';
import prisma from '../../db/prisma.js';
import { LoginInput } from './auth.schema.js';
import { TokenPayload } from '../../types/auth.js';

export class AuthService {
  /**
   * Authenticate a user and register the device if supplied
   */
  public async login(fastify: FastifyInstance, input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: { family: true },
    });

    if (!user) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Register or update device
    let deviceId: string | undefined;
    if (input.deviceName && input.platform) {
      const device = await prisma.device.upsert({
        where: {
          id: `${user.id}_${input.deviceName}`,
        },
        update: {
          lastSeenAt: new Date(),
          platform: input.platform,
        },
        create: {
          id: `${user.id}_${input.deviceName}`,
          userId: user.id,
          deviceName: input.deviceName,
          platform: input.platform,
        },
      });
      deviceId = device.id;
    }

    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      familyId: user.familyId,
    };

    const accessToken = fastify.jwt.sign(payload, { expiresIn: '7d' });
    const refreshToken = fastify.jwt.sign(payload, { expiresIn: '30d' });

    return {
      accessToken,
      refreshToken,
      expiresIn: 7 * 86400,
      deviceId,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        familyId: user.familyId,
        familyName: user.family.name,
        storageQuotaBytes: user.storageQuotaBytes.toString(),
        usedStorageBytes: user.usedStorageBytes.toString(),
      },
    };
  }

  /**
   * Refreshes an access token given a valid refresh token
   */
  public async refreshToken(fastify: FastifyInstance, refreshToken: string) {
    try {
      const decoded = fastify.jwt.verify<TokenPayload>(refreshToken);

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        const error: any = new Error('User not found');
        error.statusCode = 401;
        throw error;
      }

      const payload: TokenPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        familyId: user.familyId,
      };

      const newAccessToken = fastify.jwt.sign(payload, { expiresIn: '7d' });

      return {
        accessToken: newAccessToken,
        expiresIn: 7 * 86400,
      };
    } catch (err) {
      const error: any = new Error('Invalid or expired refresh token');
      error.statusCode = 401;
      throw error;
    }
  }

  /**
   * Retrieves profile of current user
   */
  public async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        family: true,
        devices: {
          orderBy: { lastSeenAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      familyId: user.familyId,
      familyName: user.family.name,
      storageQuotaBytes: user.storageQuotaBytes.toString(),
      usedStorageBytes: user.usedStorageBytes.toString(),
      devices: user.devices.map((d) => ({
        id: d.id,
        name: d.deviceName,
        platform: d.platform,
        lastSeenAt: d.lastSeenAt,
      })),
    };
  }
}

export const authService = new AuthService();
