import { IsString, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Resend Verification Request DTO
export class ResendVerificationRequestDto {
  @IsString()
  requestId!: string;
}

// Main Request DTO
export class ResendVerificationMainRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResendVerificationRequestDto)
  data!: ResendVerificationRequestDto[];
}

// Resend Verification Response DTO
export class ResendVerificationResponseDto {
  @IsString()
  userIdentity!: string;

  @IsString()
  serviceType!: string;

  @IsString()
  requestId!: string;
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
export class ResendVerificationMainResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResendVerificationResponseDto)
  data!: ResendVerificationResponseDto[];

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
export class ResendVerificationErrorResponseDto {
  @IsArray()
  data!: any[];

  @IsObject()
  @ValidateNested()
  @Type(() => ResponseMessageDto)
  responseMessages!: ResponseMessageDto;
}
