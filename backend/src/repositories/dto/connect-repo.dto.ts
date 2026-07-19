import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConnectRepoDto {
  @ApiProperty({ description: 'GitHub repository ID' })
  @IsString()
  githubRepoId!: string;

  @ApiProperty({ description: 'Repository owner' })
  @IsString()
  owner!: string;

  @ApiProperty({ description: 'Repository name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Full repository name (owner/name)' })
  @IsString()
  fullName!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
