import type { IdGeneratorPort } from "../../../shared/application/port/IdGenerator.port.js";
import Notification from "../../domain/entities/Notifications.js";
import { NotificationPreference } from "../../domain/enum/NotificationPreference.enum.js";
import type { NotificationRepositoryPort } from "../port/NotificationsRepo.port.js";
import type { CreateNotificationType } from "../types/CreateNotification.type.js";

class CreateNotificationUseCase {
  constructor(
    private readonly notificationRepo: NotificationRepositoryPort,
    private readonly idGenerator: IdGeneratorPort
  ) {}

  async create(notification: CreateNotificationType) {

    const id = "NOTIF-" + this.idGenerator.generate();

    const newNotif = new Notification({
      notificationId: id,
      recipientId: notification.recipientId!,
      recipientType: notification.recipientType,
      eventType: notification.eventType,
      subjectType: notification.subjectType,
      subjectId: notification.subjectId,
      messageTemplate: "",
      payload: notification.payload,
      channel: NotificationPreference.IN_APP,
      priority: notification.priority
    });

    await this.notificationRepo.save(newNotif);

    return newNotif;
  }
}

export default CreateNotificationUseCase;