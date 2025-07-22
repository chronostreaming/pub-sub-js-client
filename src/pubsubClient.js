import { EventConsumerException, EventPublishingException } from './errors.js';

export class PubSubClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  async send(url, options, throwOnError = true) {
    const resp = await fetch(url, options);
    const text = await resp.text();
    if (throwOnError && resp.status >= 400) {
      throw new Error(`Request failed with status code ${resp.status}`);
    }
    return { status: resp.status, body: text };
  }

  async publishEvents(org, topic, events) {
    const url = `${this.baseUrl}/${org}/topics/${topic}/events`;
    const resp = await this.send(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(events)
    });

    switch (resp.status) {
      case 200:
        return parseInt(resp.body);
      case 204:
        return 0;
      case 400:
        throw new EventPublishingException('Error on your request:' + resp.body);
      case 404:
        throw new EventPublishingException('Subscription, topic or organization not found');
      case 500:
        throw new EventPublishingException('Internal Server Error');
      default:
        return 0;
    }
  }

  async readEvents(org, topic, sub, batchSize) {
    const url = `${this.baseUrl}/${org}/topics/${topic}/subscriptions/${sub}/events?batchSize=${batchSize}`;
    const options = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };

    const maxRetries = 3;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const resp = await this.send(url, options, false);

      switch (resp.status) {
        case 200:
          return JSON.parse(resp.body);
        case 204:
          return [];
        case 404:
          throw new EventConsumerException('Subscription, topic or organization not found');
        case 409:
        case 500:
          if (attempt < maxRetries) {
            const pause = Math.random() * 100000;
            await new Promise(res => setTimeout(res, pause));
            continue;
          }
          if (resp.status === 409) {
            throw new EventConsumerException('Conflict while reading events');
          }
          throw new EventConsumerException('Internal Server Error');
        default:
          if (resp.status >= 400) {
            throw new Error(`Request failed with status code ${resp.status}`);
          }
          return [];
      }
    }
  }

  async commitEvents(org, topic, sub, eventIds) {
    const url = `${this.baseUrl}/${org}/topics/${topic}/subscriptions/${sub}/event-commits`;
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventIds)
    };

    const maxRetries = 3;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const resp = await this.send(url, options, false);

      switch (resp.status) {
        case 200:
          return parseInt(resp.body);
        case 204:
          return 0;
        case 400:
          throw new EventConsumerException('Error on your request:' + resp.body);
        case 404:
          throw new EventConsumerException('Subscription, topic or organization not found');
        case 409:
        case 500:
          if (attempt < maxRetries) {
            const pause = Math.random() * 100000;
            await new Promise(res => setTimeout(res, pause));
            continue;
          }
          if (resp.status === 409) {
            throw new EventConsumerException('Conflict while committing events');
          }
          throw new EventConsumerException('Internal Server Error');
        default:
          if (resp.status >= 400) {
            throw new Error(`Request failed with status code ${resp.status}`);
          }
          return 0;
      }
    }
  }

  async consumeEvents(org, topic, sub, batchSize, handler) {
    const events = await this.readEvents(org, topic, sub, batchSize);
    if (events.length === 0) {
      return;
    }
    const commitFn = async ids => {
      try {
        return await this.commitEvents(org, topic, sub, ids);
      } catch (e) {
        throw new EventConsumerException(e);
      }
    };
    await handler(events, commitFn);
  }
}
