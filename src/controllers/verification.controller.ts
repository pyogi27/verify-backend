import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { VerificationService } from '../services/verification.service';
import {
  VerificationMainRequestDto,
  VerificationMainResponseDto,
  VerificationErrorResponseDto,
} from '../dto/verification.dto';
import { ApiAuthGuard } from '../guards/api-auth.guard';
import { AuthenticatedApplication } from '../decorators/authenticated-application.decorator';

@ApiTags('Verification')
@Controller('applications')
@UseGuards(ApiAuthGuard)
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post(':applicationCode/verify')
  @ApiOperation({
    summary: 'Verify tokens for authentication/verification requests',
  })
  @ApiParam({ name: 'applicationCode', description: 'Application ID' })
  @ApiBody({ type: VerificationMainRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Verification completed successfully',
    type: VerificationMainResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Invalid token, expired request, or max attempts exceeded',
    type: VerificationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: VerificationErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    type: VerificationErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Verification request not found',
    type: VerificationErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Verification request already verified',
    type: VerificationErrorResponseDto,
  })
  async verifyTokens(
    @Param('applicationCode') applicationCode: string,
    @Body() request: VerificationMainRequestDto,
    @AuthenticatedApplication() _authenticatedApp: any,
  ): Promise<VerificationMainResponseDto> {
    return this.verificationService.verifyTokens(applicationCode, request);
  }
}
