# Pub/Sub JS Client

A lightweight JavaScript client for interacting with the [pub-sub-service](https://github.com/chronostreaming/pub-sub-java-client) HTTP API.  It mirrors the API provided by the original Java client.

## Installation

```bash
npm install pub-sub-js-client
```

## Usage

```javascript
import {
  PubSubClient,
  EventPublisher,
  EventPublisherConfig,
  EventConsumer,
  EventConsumerConfig
} from 'pub-sub-js-client';

const client = new PubSubClient('http://localhost:8080');

// publishing
const pubCfg = new EventPublisherConfig('my-org', 'orders', 'processor');
// Optional custom error handler receives the error and the list of events
const publisher = new EventPublisher(pubCfg, client, (err, events) => console.error(err));
await publisher.publish({ data: { message: 'hello' } });

// consuming
const handler = async (events, commit) => {
  await commit(events.map(e => e.id));
};
const consCfg = new EventConsumerConfig('my-org', 'orders', 'processor', 10, 1000, handler);
// Optional error handler for the consumer
const consumer = new EventConsumer(client, handler, consCfg, err => console.error(err));
consumer.start();
```

Run tests with:

```bash
npm test
```
