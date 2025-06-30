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
import { ApplicationService } from './application-services.entity';
import { ServiceType } from './service-type.enum';

@Entity('auth_verification_requests')
@Index(['request_id', 'token'], { unique: true })
export class AuthVerificationRequest {
  @PrimaryGeneratedColumn('uuid')
  request_id: string;

  @Column({ type: 'uuid', comment: "Linked to the onboarded application's ID" })
  application_id: string;

  @Column({ type: 'uuid', comment: 'Service ID reference' })
  service_id: string;

  @Column({
    type: 'enum',
    enum: ServiceType,
    comment: 'authMO: mobile auth using OTP, authEO: email auth using OTP, etc',
  })
  service_type: ServiceType;

  @Column({
    type: 'varchar',
    comment: 'Email/Mobile of the user being authenticated/verified',
  })
  user_identity: string;

  @Column({ type: 'varchar', comment: 'OTP code or validation link token' })
  token: string;

  @Column({ type: 'timestamp', comment: 'Expiry timestamp for the OTP/link' })
  expiry_time: Date;

  @Column({ type: 'int', comment: 'Number of verification attempts made' })
  attempt_count: number;

  @Column({ type: 'int', comment: 'Maximum allowed attempts for OTP' })
  max_attempt_count: number;

  @Column({ type: 'int', comment: 'Number of resend attempts made' })
  resend_count: number;

  @Column({ type: 'int', comment: 'Maximum allowed resend attempts' })
  max_resend_count: number;

  @Column({ type: 'timestamp', comment: 'For auto-cleaning' })
  ttl: Date;

  @Column({ type: 'boolean', comment: 'Marks OTP verification status' })
  verified: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Timestamp when verification was successful',
  })
  verified_at: Date;

  @Column({
    type: 'boolean',
    comment: 'Indicates if the request is currently active',
  })
  is_active: boolean;

  @CreateDateColumn({ comment: 'Timestamp of OTP generation' })
  created_at: Date;

  @UpdateDateColumn({ comment: 'Timestamp when the record was last modified' })
  updated_at: Date;

  // Relations
  @ManyToOne(
    () => ApplicationOnboarding,
    (application) => application.verification_requests,
  )
  @JoinColumn({ name: 'application_id' })
  application: ApplicationOnboarding;

  @ManyToOne(() => ApplicationService)
  @JoinColumn({ name: 'service_id' })
  service: ApplicationService;
}
