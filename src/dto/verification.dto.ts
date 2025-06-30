import { IsString, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Verification Request DTO
export class VerificationRequestDto {
  @IsString()
  requestId!: string;

  @IsString()
  token!: string;
}

// Main Request DTO
export class VerificationMainRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VerificationRequestDto)
  data!: VerificationRequestDto[];
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
export class VerificationMainResponseDto {
  @IsArray()
  data!: any[];

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
export class VerificationErrorResponseDto {
  @IsArray()
  data!: any[];

  @IsObject()
  @ValidateNested()
  @Type(() => ResponseMessageDto)
  responseMessages!: ResponseMessageDto;
}
