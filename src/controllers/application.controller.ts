import {
  Controller,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ValidationPipe,
  UsePipes,
  UseGuards,
} from '@nestjs/common';
import { ApplicationRegistrationService } from '../services/application.service';
import { KeyRotationService } from '../services/key-rotation.service';
import { ApiAuthGuard } from '../guards/api-auth.guard';
import { AuthenticatedApplication } from '../decorators/authenticated-application.decorator';
import {
  ApplicationRegistrationRequestDto,
  ApplicationRegistrationResponseDto,
} from '../dto/application-registration.dto';
import { KeyRotationResponseDto } from '../dto/key-rotation.dto';

@Controller('applications')
export class ApplicationController {
  constructor(
    private readonly applicationService: ApplicationRegistrationService,
    private readonly keyRotationService: KeyRotationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async registerApplications(
    @Body() request: ApplicationRegistrationRequestDto,
  ): Promise<ApplicationRegistrationResponseDto> {
    return this.applicationService.registerApplications(request);
  }

  @Post(':applicationCode/rotate-key')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ApiAuthGuard)
  async rotateKey(
    @Param('applicationCode') applicationCode: string,
    @AuthenticatedApplication() authenticatedApplication: any,
  ): Promise<KeyRotationResponseDto> {
    return this.keyRotationService.rotateKey(
      applicationCode,
      authenticatedApplication.application_id,
    );
  }
}
