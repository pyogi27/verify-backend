import { ApplicationOnboarding } from '../../entities/application-onboarding.entity';

declare global {
  namespace Express {
    interface Request {
      application?: ApplicationOnboarding;
    }
  }
}
