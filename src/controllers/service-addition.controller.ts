import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ServiceAdditionService } from '../services/service-addition.service';
import {
  ServiceAdditionRequestDto,
  ServiceAdditionMainResponseDto,
} from '../dto/service-addition.dto';
import { ApiAuthGuard } from '../guards/api-auth.guard';
import { AuthenticatedApplication } from '../decorators/authenticated-application.decorator';

@ApiTags('Service Addition')
@Controller('applications')
@UseGuards(ApiAuthGuard)
export class ServiceAdditionController {
  constructor(
    private readonly serviceAdditionService: ServiceAdditionService,
  ) {}

  @Post(':applicationCode/services')
  @ApiOperation({ summary: 'Add services to an existing application' })
  @ApiParam({ name: 'applicationCode', description: 'Application ID' })
  @ApiBody({ type: ServiceAdditionRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Services added successfully',
    type: ServiceAdditionMainResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 409, description: 'Service already exists' })
  async addServices(
    @Param('applicationCode') applicationCode: string,
    @Body() request: ServiceAdditionRequestDto,
    @AuthenticatedApplication() authenticatedApp: any,
  ): Promise<ServiceAdditionMainResponseDto> {
    return this.serviceAdditionService.addServices(applicationCode, request);
  }
}
