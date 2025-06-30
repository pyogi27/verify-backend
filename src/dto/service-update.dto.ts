import {
  IsString,
  IsObject,
  IsOptional,
  IsNumber,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

// Verification Config DTO
export class VerificationConfigDto {
  @IsNumber()
  maxResendCount!: number;

  @IsNumber()
  maxAttemptCount!: number;

  @IsNumber()
  tokenLength!: number;

  @IsString()
  tokenPattern!: string;

  @IsNumber()
  expiryTime!: number;
}

// Callback DTO
export class CallbackDto {
  @IsString()
  callbackUrl!: string;

  @IsString()
  callbackMethod!: string;

  @IsObject()
  payload!: object;
}

// Service Update Request DTO
export class ServiceUpdateRequestDto {
  @IsOptional()
  @IsString()
  verificationLinkRoute?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => VerificationConfigDto)
  verificationConfig!: VerificationConfigDto;

  @IsObject()
  @ValidateNested()
  @Type(() => CallbackDto)
  successCallback!: CallbackDto;

  @IsObject()
  @ValidateNested()
  @Type(() => CallbackDto)
  errorCallback!: CallbackDto;
}

// Service Update Main Request DTO
export class ServiceUpdateMainRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceUpdateRequestDto)
  data!: ServiceUpdateRequestDto[];
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

// Main Response DTO
export class ServiceUpdateMainResponseDto {
  @IsArray()
  data!: any[];

  @IsObject()
  @ValidateNested()
  @Type(() => ResponseMessageDto)
  responseMessages!: ResponseMessageDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MessagesDto)
  messages?: MessagesDto;
}
