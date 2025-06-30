import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected getTracker(req: Request): Promise<string> {
    // Use API key as tracker if available, otherwise use IP
    const apiKey = req.headers['x-app-auth-key'] as string;
    return Promise.resolve(apiKey || req.ip || 'unknown');
  }
}
