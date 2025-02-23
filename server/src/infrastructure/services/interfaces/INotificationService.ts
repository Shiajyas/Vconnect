

import { SUser } from "../../../core/domain/interfaces/SUser";

export interface NotificationService {
  sendNotification(recipients: string[], message: any): void;
}
