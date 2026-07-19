import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RepositoriesService } from './repositories.service';
import { ConnectRepoDto } from './dto/connect-repo.dto';

@ApiTags('Repositories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('repositories')
export class RepositoriesController {
  constructor(private readonly repositoriesService: RepositoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List connected repositories' })
  findAll(@CurrentUser('id') userId: string) {
    return this.repositoriesService.findAllByUser(userId);
  }

  @Get('github')
  @ApiOperation({ summary: 'List available GitHub repositories' })
  getGithubRepos(@CurrentUser('accessToken') token: string) {
    return this.repositoriesService.getGithubRepos(token);
  }

  @Post()
  @ApiOperation({ summary: 'Connect a GitHub repository' })
  connect(
    @CurrentUser('id') userId: string,
    @CurrentUser('accessToken') token: string,
    @Body() dto: ConnectRepoDto,
  ) {
    return this.repositoriesService.connect(userId, dto, token);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Disconnect a repository' })
  disconnect(
    @Param('id') id: string,
    @CurrentUser('accessToken') token: string,
  ) {
    return this.repositoriesService.disconnect(id, token);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle review enabled/disabled' })
  toggleReview(@Param('id') id: string) {
    return this.repositoriesService.toggleReview(id);
  }
}
