import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ResendVerificationService } from '../services/resend-verification.service';
import {
  ResendVerificationMainRequestDto,
  ResendVerificationMainResponseDto,
  ResendVerificationErrorResponseDto,
} from '../dto/resend-verification.dto';
import { ApiAuthGuard } from '../guards/api-auth.guard';
import { AuthenticatedApplication } from '../decorators/authenticated-application.decorator';

@ApiTags('Resend Verification')
@Controller('applications')
@UseGuards(ApiAuthGuard)
export class ResendVerificationController {
  constructor(
    private readonly resendVerificationService: ResendVerificationService,
  ) {}

  @Post(':applicationCode/resend-verification')
  @ApiOperation({ summary: 'Resend verification tokens for existing requests' })
  @ApiParam({ name: 'applicationCode', description: 'Application ID' })
  @ApiBody({ type: ResendVerificationMainRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Verification tokens resent successfully',
    type: ResendVerificationMainResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Request expired, max resend attempts exceeded, or application inactive',
    type: ResendVerificationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ResendVerificationErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    type: ResendVerificationErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Verification request not found',
    type: ResendVerificationErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Verification request already verified',
    type: ResendVerificationErrorResponseDto,
  })
  async resendVerification(
    @Param('applicationCode') applicationCode: string,
    @Body() request: ResendVerificationMainRequestDto,
    @AuthenticatedApplication() _authenticatedApp: any,
  ): Promise<ResendVerificationMainResponseDto> {
    return this.resendVerificationService.resendVerification(
      applicationCode,
      request,
    );
  }
}
