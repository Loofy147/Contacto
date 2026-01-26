export interface ProfessionalCreatedEvent {
  eventType: 'PROFESSIONAL_CREATED';
  eventId: string;
  timestamp: Date;
  data: {
    professionalId: string;
    userId: string;
  };
}

export interface ProfessionalViewedEvent {
  eventType: 'PROFESSIONAL_VIEWED';
  eventId: string;
  timestamp: Date;
  data: {
    professionalId: string;
    ip?: string;
    userAgent?: string;
  };
}
