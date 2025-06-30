import {
  IsString,
  IsArray,
  IsObject,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceType } from '../entities/service-type.enum';

// Verification Generation Request DTO
export class VerificationGenerationRequestDto {
  @IsEnum(ServiceType)
  serviceType!: ServiceType;

  @IsString()
  userIdentity!: string;
}

// Main Request DTO
export class VerificationGenerationMainRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VerificationGenerationRequestDto)
  data!: VerificationGenerationRequestDto[];
}

// Verification Generation Response DTO
export class VerificationGenerationResponseDto {
  @IsString()
  userIdentity!: string;

  @IsString()
  serviceType!: string;

  @IsString()
  requestId!: string;

  @IsString()
  token!: string;
}

// Response Message DTO
export class ResponseMessageDto {
  @IsString()
  type!: 'S' | 'E'; // S for Success, E for Error

  @IsString()
  id!: string;

  @IsString()
  text!: string;
}

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

// Main Response DTO for 200 success
export class VerificationGenerationMainResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VerificationGenerationResponseDto)
  data!: VerificationGenerationResponseDto[];

  @IsObject()
  @ValidateNested()
  @Type(() => ResponseMessageDto)
  responseMessages!: ResponseMessageDto;

  @IsObject()
  @ValidateNested()
  @Type(() => MessagesDto)
  messages!: MessagesDto;
}

// Error Response DTO for 400, 401, 403
export class VerificationGenerationErrorResponseDto {
  @IsArray()
  data!: any[];

  @IsObject()
  @ValidateNested()
  @Type(() => ResponseMessageDto)
  responseMessages!: ResponseMessageDto;
}
