import { IsString, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

// Field Message DTO
export class FieldMessageDto {
  @IsString()
  type!: string;

  @IsString()
  id!: string;

  @IsString()
  text!: string;
}

// Resource Messages DTO
export class ResourceMessagesDto {
  @IsString()
  type!: string;

  @IsString()
  text!: string;
}

// Messages DTO
export class MessagesDto {
  @IsString()
  resourceId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldMessageDto)
  fieldMessages!: FieldMessageDto[];

  @IsObject()
  @ValidateNested()
  @Type(() => ResourceMessagesDto)
  resourceMessages!: ResourceMessagesDto;
}

// Application Response DTO (reusing from application-registration.dto.ts)
export class ApplicationResponseDto {
  @IsString()
  applicationName!: string;

  @IsString()
  applicationCode!: string;

  @IsString()
  applicationKey!: string;

  @IsString()
  applicationKeySecret!: string;

  @IsString()
  applicationKeyExpiry!: number;
}

// Key Rotation Response DTO
export class KeyRotationResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApplicationResponseDto)
  data!: ApplicationResponseDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldMessageDto)
  responseMessages!: FieldMessageDto[];

  @IsObject()
  @ValidateNested()
  @Type(() => MessagesDto)
  messages!: MessagesDto;
}
