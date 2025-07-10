import { EventConsumerException, EventPublishingException } from './errors.js';

export class PubSubClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  async send(url, options) {
    const resp = await fetch(url, options);
    const text = await resp.text();
    if (resp.status >= 400) {
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
    const resp = await this.send(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    switch (resp.status) {
      case 200:
        return JSON.parse(resp.body);
      case 204:
        return [];
      case 404:
        throw new EventConsumerException('Subscription, topic or organization not found');
      case 409:
        throw new EventConsumerException('Conflict while reading events');
      case 500:
        throw new EventConsumerException('PubSub: Internal Server Error');
      default:
        return [];
    }
  }

  async commitEvents(org, topic, sub, eventIds) {
    const url = `${this.baseUrl}/${org}/topics/${topic}/subscriptions/${sub}/event-commits`;
    const resp = await this.send(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventIds)
    });

    switch (resp.status) {
      case 200:
        return parseInt(resp.body);
      case 204:
        return 0;
      case 400:
        throw new EventConsumerException('Error on your request:' + resp.body);
      case 404:
        throw new EventConsumerException('Subscription, topic or organization not found');
      case 500:
        throw new EventConsumerException('PubSub: Internal Server Error');
      default:
        return 0;
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
