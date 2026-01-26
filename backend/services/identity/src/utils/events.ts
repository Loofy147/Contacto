export interface UserRegisteredEvent {
  eventType: 'USER_REGISTERED';
  eventId: string;
  timestamp: Date;
  data: {
    userId: string;
    email: string;
    role: string;
  };
}

export interface UserLoggedInEvent {
  eventType: 'USER_LOGGED_IN';
  eventId: string;
  timestamp: Date;
  data: {
    userId: string;
    ip: string;
  };
}
