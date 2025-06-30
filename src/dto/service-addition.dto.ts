import {
  IsString,
  IsArray,
  IsObject,
  IsOptional,
  IsEnum,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceType } from '../entities/service-type.enum';

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

// Service DTO
export class ServiceDto {
  @IsEnum(ServiceType)
  serviceType!: ServiceType;

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

// Service Addition Request DTO
export class ServiceAdditionRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceDto)
  services!: ServiceDto[];
}

// Service Addition Response DTO
export class ServiceAdditionResponseDto {
  @IsArray()
  @IsString({ each: true })
  servicesSubscribed!: string[];
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
export class ServiceAdditionMainResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceAdditionResponseDto)
  data!: ServiceAdditionResponseDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResponseMessageDto)
  responseMessages!: ResponseMessageDto[];

  @IsObject()
  @ValidateNested()
  @Type(() => MessagesDto)
  messages!: MessagesDto;
}
