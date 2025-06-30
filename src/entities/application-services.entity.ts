import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApplicationOnboarding } from './application-onboarding.entity';
import { ServiceType } from './service-type.enum';

@Entity('application_services')
@Index(['application_id', 'service_type'], { unique: true })
export class ApplicationService {
  @PrimaryGeneratedColumn('uuid')
  service_id: string;

  @Column({ type: 'uuid', comment: "Linked to the onboarded application's ID" })
  application_id: string;

  @Column({
    type: 'enum',
    enum: ServiceType,
    comment: 'authMO: mobile auth using OTP, authEO: email auth using OTP, etc',
  })
  service_type: ServiceType;

  @Column({
    type: 'varchar',
    nullable: true,
    comment:
      'Base URL of client application to generate Verification Link with (application to Link verification only)',
  })
  verification_link_route: string | null;

  @Column({
    type: 'jsonb',
    comment:
      'Client Callback URL and payload in case of success in auth/verification',
  })
  success_callback_config: object;

  @Column({
    type: 'jsonb',
    comment:
      'Client Callback URL and payload in case of error in auth/verification',
  })
  error_callback_config: object;

  @Column({
    type: 'jsonb',
    comment: 'Configuration for verification attempts and code length',
  })
  verification_config: object;

  @Column({
    type: 'boolean',
    comment: 'Indicates if the service is currently active',
  })
  is_active: boolean;

  @CreateDateColumn({ comment: 'Timestamp when the service was added' })
  created_at: Date;

  @UpdateDateColumn({ comment: 'Timestamp when the service was last modified' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => ApplicationOnboarding, (application) => application.services)
  @JoinColumn({ name: 'application_id' })
  application: ApplicationOnboarding;
}
