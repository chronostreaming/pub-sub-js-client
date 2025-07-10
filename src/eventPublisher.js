export class EventPublisherConfig {
  constructor(org, topic, subscription) {
    this.org = org;
    this.topic = topic;
    this.subscription = subscription;
  }
}

export class EventPublisher {
  constructor(config, client, errorHandler) {
    this.config = config;
    this.client = client;
    this.errorHandler = errorHandler || (() => {});
  }

  async publish(eventRequest) {
    return this.publishMany([eventRequest]);
  }

  async publishMany(eventRequests) {
    try {
      return await this.client.publishEvents(this.config.org, this.config.topic, eventRequests);
    } catch (e) {
      this.errorHandler(e, eventRequests);
      return 0;
    }
  }
}
