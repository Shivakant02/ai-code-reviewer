import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

export interface JwtPayload {
  sub: string;
  username: string;
  githubId: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateOrCreateUser(profile: {
    githubId: number;
    username: string;
    email?: string;
    displayName?: string;
    avatarUrl?: string;
    accessToken: string;
  }) {
    this.logger.log(`OAuth login for: ${profile.username}`);
    return this.usersService.upsertFromGithub(profile);
  }

  generateJwt(user: { id: string; username: string; githubId: number }) {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      githubId: user.githubId,
    };
    return this.jwtService.sign(payload);
  }

  async validateJwtPayload(payload: JwtPayload) {
    return this.usersService.findById(payload.sub);
  }
}
