export class EventConsumerException extends Error {
  constructor(message) {
    if (message instanceof Error) {
      super(message.message);
    } else {
      super(message);
    }
    this.name = 'EventConsumerException';
  }
}

export class EventPublishingException extends Error {
  constructor(message) {
    if (message instanceof Error) {
      super(message.message);
    } else {
      super(message);
    }
    this.name = 'EventPublishingException';
  }
}
