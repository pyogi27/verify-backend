import {
  IsString,
  IsArray,
  IsObject,
  IsOptional,
  IsEnum,
  IsNumber,
  ValidateNested,
  IsNotEmpty,
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
  successCallback!: object;

  @IsObject()
  errorCallback!: object;
}

// Application DTO
export class ApplicationDto {
  @IsString()
  @IsNotEmpty()
  applicationName!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceDto)
  services!: ServiceDto[];
}

// Request DTO
export class ApplicationRegistrationRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApplicationDto)
  data!: ApplicationDto[];
}

// Response Message DTO
export class ResponseMessageDto {
  @IsString()
  id!: string;

  @IsString()
  type!: 'S' | 'E'; // S for Success, E for Error

  @IsString()
  text!: string;
}

// Application Response DTO
export class ApplicationResponseDto {
  @IsString()
  applicationName!: string;

  @IsString()
  applicationCode!: string;

  @IsString()
  applicationKey!: string;

  @IsString()
  applicationKeySecret!: string;

  @IsNumber()
  applicationKeyExpiry!: number;

  @IsArray()
  @IsString({ each: true })
  servicesSubscribed!: string[];
}

// Response DTO
export class ApplicationRegistrationResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApplicationResponseDto)
  data!: ApplicationResponseDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResponseMessageDto)
  responseMessages!: ResponseMessageDto[];
}
