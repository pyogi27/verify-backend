import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ServiceDeletionService } from '../services/service-deletion.service';
import {
  ServiceDeletionMainResponseDto,
  ServiceDeletionErrorResponseDto,
} from '../dto/service-deletion.dto';
import { ApiAuthGuard } from '../guards/api-auth.guard';
import { AuthenticatedApplication } from '../decorators/authenticated-application.decorator';
import { ServiceType } from '../entities/service-type.enum';

@ApiTags('Service Deletion')
@Controller('applications')
@UseGuards(ApiAuthGuard)
export class ServiceDeletionController {
  constructor(
    private readonly serviceDeletionService: ServiceDeletionService,
  ) {}

  @Delete(':applicationCode/services/:serviceType')
  @ApiOperation({ summary: 'Delete a service from an existing application' })
  @ApiParam({ name: 'applicationCode', description: 'Application ID' })
  @ApiParam({
    name: 'serviceType',
    description: 'Service type to delete',
    enum: ServiceType,
    example: 'authMO',
  })
  @ApiResponse({
    status: 200,
    description: 'Service deleted successfully',
    type: ServiceDeletionMainResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    type: ServiceDeletionErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ServiceDeletionErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    type: ServiceDeletionErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Application or service not found',
    type: ServiceDeletionErrorResponseDto,
  })
  async deleteService(
    @Param('applicationCode') applicationCode: string,
    @Param('serviceType') serviceType: ServiceType,
    @AuthenticatedApplication() authenticatedApp: any,
  ): Promise<ServiceDeletionMainResponseDto> {
    return this.serviceDeletionService.deleteService(
      applicationCode,
      serviceType,
    );
  }
}
