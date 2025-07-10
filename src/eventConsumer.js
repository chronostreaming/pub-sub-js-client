export class EventConsumerConfig {
  constructor(org, topic, subscription, batchSize, intervalMillis, handler) {
    this.org = org;
    this.topic = topic;
    this.subscription = subscription;
    this.batchSize = batchSize;
    this.intervalMillis = intervalMillis;
    this.handler = handler;
  }
}

export class EventConsumer {
  constructor(client, eventsHandler, config, errorHandler = () => {}) {
    this.client = client;
    this.eventsHandler = eventsHandler;
    this.config = config;
    this.errorHandler = errorHandler;
    this.interval = null;
  }

  start() {
    if (this.interval) return;
    this.interval = setInterval(async () => {
      try {
        await this.client.consumeEvents(
          this.config.org,
          this.config.topic,
          this.config.subscription,
          this.config.batchSize,
          this.eventsHandler
        );
      } catch (e) {
        this.errorHandler(e);
      }
    }, this.config.intervalMillis);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  close() {
    this.stop();
  }
}
