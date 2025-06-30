import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  constructor(private readonly loggerService: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // Remove sensitive headers from response
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=()',
    );

    // Log suspicious requests
    this.logSecurityEvents(req);

    next();
  }

  private logSecurityEvents(req: Request): void {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /union\s+select/i,
      /drop\s+table/i,
      /delete\s+from/i,
      /insert\s+into/i,
      /update\s+set/i,
    ];

    const url = req.url.toLowerCase();
    const userAgent = req.get('User-Agent') || '';
    const ip = req.ip;

    // Check for suspicious patterns in URL
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) {
        this.loggerService.logSecurity('Suspicious URL Pattern Detected', {
          pattern: pattern.source,
          url: req.url,
          ip,
          userAgent,
          method: req.method,
        });
        break;
      }
    }

    // Check for suspicious user agents
    const suspiciousUserAgents = [
      /sqlmap/i,
      /nikto/i,
      /nmap/i,
      /w3af/i,
      /burp/i,
      /zap/i,
    ];

    for (const pattern of suspiciousUserAgents) {
      if (pattern.test(userAgent)) {
        this.loggerService.logSecurity('Suspicious User Agent Detected', {
          pattern: pattern.source,
          userAgent,
          ip,
          url: req.url,
          method: req.method,
        });
        break;
      }
    }

    // Log requests from known malicious IPs (example)
    const maliciousIPs = process.env.MALICIOUS_IPS?.split(',') || [];
    if (maliciousIPs.includes(ip || 'unknown')) {
      this.loggerService.logSecurity('Request from Known Malicious IP', {
        ip,
        url: req.url,
        userAgent,
        method: req.method,
      });
    }
  }
}
