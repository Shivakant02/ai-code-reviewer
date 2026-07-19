import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService, WebhookPayload } from './webhooks.service';
import { WebhookSignatureGuard } from './webhook-signature.guard';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('github')
  @HttpCode(200)
  @UseGuards(WebhookSignatureGuard)
  @ApiOperation({ summary: 'Receive GitHub webhook events' })
  async handleGithubWebhook(
    @Headers('x-github-event') event: string,
    @Body() payload: WebhookPayload,
  ) {
    this.logger.log(`Received GitHub event: ${event}`);

    if (event === 'pull_request') {
      return this.webhooksService.handlePullRequestEvent(payload);
    }

    if (event === 'ping') {
      return { status: 'pong' };
    }

    return { status: 'ignored', event };
  }
}
