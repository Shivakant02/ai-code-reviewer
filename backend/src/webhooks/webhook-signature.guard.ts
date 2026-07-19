import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  private readonly logger = new Logger(WebhookSignatureGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const signature = request.headers['x-hub-signature-256'] as string;

    if (!signature) {
      this.logger.warn('Missing webhook signature');
      throw new UnauthorizedException('Missing signature');
    }

    // Get the raw body for signature verification
    const rawBody = (request as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody) {
      this.logger.warn('Raw body not available');
      throw new UnauthorizedException('Cannot verify signature');
    }

    // Try to extract the repo full name from the payload to find the right secret
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody.toString());
    } catch {
      throw new UnauthorizedException('Invalid payload');
    }

    const repoFullName = (
      body.repository as { full_name?: string } | undefined
    )?.full_name;
    if (!repoFullName) {
      throw new UnauthorizedException('Missing repository information');
    }

    // Find the repo and its webhook secret
    const repo = await this.prisma.repository.findUnique({
      where: { fullName: repoFullName },
    });

    if (!repo?.webhookSecret) {
      this.logger.warn(
        `No webhook secret found for repo: ${repoFullName}`,
      );
      throw new UnauthorizedException('Repository not configured');
    }

    // Verify HMAC signature
    const expectedSignature =
      'sha256=' +
      createHmac('sha256', repo.webhookSecret)
        .update(rawBody)
        .digest('hex');

    try {
      const isValid = timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
      if (!isValid) {
        throw new UnauthorizedException('Invalid signature');
      }
    } catch {
      throw new UnauthorizedException('Invalid signature');
    }

    return true;
  }
}
