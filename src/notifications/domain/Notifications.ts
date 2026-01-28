type NotificationChannel = "EMAIL" | "SMS" | "IN_APP";
type NotificationState = "PENDING" | "SENT" | "FAILED";

interface NotificationDTO {
  notificationId: string;

  recipientId: string;
  recipientType: "USER" | "ROLE";

  eventType: string; // DocumentApproved, TaskAssigned
  subjectType: string; // DOCUMENT, APPROVAL_TASK
  subjectId: string;

  messageTemplate: string;  // Not raw text
  payload: Record<string, any>;

  channel: NotificationChannel;
  priority: "LOW" | "NORMAL" | "HIGH";
}


class Notification {
  readonly notificationId: string;
  readonly recipientId: string;
  readonly recipientType: string;
  readonly eventType: string;
  readonly subjectType: string;
  readonly subjectId: string;
  readonly messageTemplate: string;
  readonly payload: Record<string, any>;
  readonly channel: NotificationChannel;
  readonly priority: string;

  private state: NotificationState;
  readonly createdAt: Date;

  constructor(notification: NotificationDTO) {
    this.notificationId = notification.notificationId;
    this.recipientId = notification.recipientId;
    this.recipientType = notification.recipientType;
    this.eventType = notification.eventType;
    this.subjectType = notification.subjectType;
    this.subjectId = notification.subjectId;
    this.messageTemplate = notification.messageTemplate;
    this.payload = notification.payload;
    this.channel = notification.channel;
    this.priority = notification.priority;
    this.state = "PENDING";
    this.createdAt = new Date();
  }

  markSent() {
    this.state = "SENT";
  }

  markFailed() {
    this.state = "FAILED";
  }
}
