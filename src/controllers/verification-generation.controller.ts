import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { VerificationGenerationService } from '../services/verification-generation.service';
import {
  VerificationGenerationMainRequestDto,
  VerificationGenerationMainResponseDto,
  VerificationGenerationErrorResponseDto,
} from '../dto/verification-generation.dto';
import { ApiAuthGuard } from '../guards/api-auth.guard';
import { AuthenticatedApplication } from '../decorators/authenticated-application.decorator';

@ApiTags('Verification Generation')
@Controller('applications')
@UseGuards(ApiAuthGuard)
export class VerificationGenerationController {
  constructor(
    private readonly verificationGenerationService: VerificationGenerationService,
  ) {}

  @Post(':applicationCode/generate-verification')
  @ApiOperation({ summary: 'Generate verification requests for users' })
  @ApiParam({ name: 'applicationCode', description: 'Application ID' })
  @ApiBody({ type: VerificationGenerationMainRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Verification requests generated successfully',
    type: VerificationGenerationMainResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    type: VerificationGenerationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: VerificationGenerationErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    type: VerificationGenerationErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Application or service not found',
    type: VerificationGenerationErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Active verification request already exists',
    type: VerificationGenerationErrorResponseDto,
  })
  async generateVerification(
    @Param('applicationCode') applicationCode: string,
    @Body() request: VerificationGenerationMainRequestDto,
    @AuthenticatedApplication() _authenticatedApp: any,
  ): Promise<VerificationGenerationMainResponseDto> {
    return this.verificationGenerationService.generateVerification(
      applicationCode,
      request,
    );
  }
}
