import { Controller, Put, Param, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ServiceUpdateService } from '../services/service-update.service';
import {
  ServiceUpdateMainRequestDto,
  ServiceUpdateMainResponseDto,
} from '../dto/service-update.dto';
import { ApiAuthGuard } from '../guards/api-auth.guard';
import { AuthenticatedApplication } from '../decorators/authenticated-application.decorator';
import { ServiceType } from '../entities/service-type.enum';

@ApiTags('Service Update')
@Controller('applications')
@UseGuards(ApiAuthGuard)
export class ServiceUpdateController {
  constructor(private readonly serviceUpdateService: ServiceUpdateService) {}

  @Put(':applicationCode/services/:serviceType')
  @ApiOperation({
    summary: 'Update service configuration for an existing application',
  })
  @ApiParam({ name: 'applicationCode', description: 'Application ID' })
  @ApiParam({
    name: 'serviceType',
    description: 'Service type to update',
    enum: ServiceType,
    example: 'authMO',
  })
  @ApiBody({ type: ServiceUpdateMainRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Service updated successfully',
    type: ServiceUpdateMainResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Application or service not found' })
  async updateService(
    @Param('applicationCode') applicationCode: string,
    @Param('serviceType') serviceType: ServiceType,
    @Body() request: ServiceUpdateMainRequestDto,
    @AuthenticatedApplication() authenticatedApp: any,
  ): Promise<ServiceUpdateMainResponseDto> {
    return this.serviceUpdateService.updateService(
      applicationCode,
      serviceType,
      request,
    );
  }
}
