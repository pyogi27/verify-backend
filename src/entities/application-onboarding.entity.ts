import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApplicationService } from './application-services.entity';
import { AuthVerificationRequest } from './auth-verification-requests.entity';

@Entity('application_onboarding')
export class ApplicationOnboarding {
  @PrimaryGeneratedColumn('uuid')
  application_id: string;

  @Column({
    type: 'varchar',
    comment: 'The name of the application being onboarded',
  })
  application_name: string;

  @Column({
    type: 'varchar',
    comment: 'The unique API key assigned to the application',
  })
  api_key: string;

  @Column({
    type: 'varchar',
    comment: 'API Key secret assigned to application',
  })
  api_secret: string;

  @Column({ type: 'timestamp', comment: 'API KEY expiry date-time' })
  api_key_expiry: Date;

  @Column({
    type: 'boolean',
    comment: 'Indicates if the application is currently active',
  })
  is_active: boolean;

  @CreateDateColumn({ comment: 'Timestamp of application registration' })
  created_at: Date;

  @UpdateDateColumn({
    comment: 'Timestamp of the last update to the application record',
  })
  updated_at: Date;

  // Relations
  @OneToMany(() => ApplicationService, (service) => service.application)
  services: ApplicationService[];

  @OneToMany(() => AuthVerificationRequest, (request) => request.application)
  verification_requests: AuthVerificationRequest[];
}
