import http from 'http';
import { PubSubClient, EventConsumerException } from '../index.js';
import { sendJson } from './testUtils.js';

let server;
let baseUrl;

beforeEach(done => {
  server = http.createServer();
  server.listen(0, () => {
    const { port } = server.address();
    baseUrl = `http://localhost:${port}`;
    done();
  });
});

afterEach(done => {
  server.close(() => done());
});

function addContext(path, handler) {
  server.on('request', (req, res) => {
    if (req.url === path) {
      handler(req, res);
    }
  });
}

test('publishEvents success', async () => {
  addContext('/org/topics/topic/events', (req, res) => {
    if (req.method === 'POST') {
      sendJson(res, 200, '2');
    }
  });
  const client = new PubSubClient(baseUrl);
  const result = await client.publishEvents('org', 'topic', [{ data: 'msg' }]);
  expect(result).toBe(2);
});

test('publishEvents error', async () => {
  addContext('/org/topics/topic/events', (req, res) => {
    if (req.method === 'POST') {
      sendJson(res, 500, 'err');
    }
  });
  const client = new PubSubClient(baseUrl);
  await expect(client.publishEvents('org', 'topic', [{ data: 'msg' }]))
    .rejects.toThrow('Request failed');
});

test('readEvents success', async () => {
  const msg = `[{"id":"123","data":{"msg":"hello"},"createdAt":"2025-07-01T00:00:00Z"}]`;
  addContext('/org/topics/topic/subscriptions/sub/events?batchSize=1', (req, res) => {
    if (req.method === 'GET') {
      sendJson(res, 200, msg);
    }
  });
  const client = new PubSubClient(baseUrl);
  const events = await client.readEvents('org', 'topic', 'sub', 1);
  expect(events.length).toBe(1);
});

test('readEvents error', async () => {
  addContext('/org/topics/topic/subscriptions/sub/events?batchSize=1', (req, res) => {
    if (req.method === 'GET') {
      sendJson(res, 500, 'err');
    }
  });
  const client = new PubSubClient(baseUrl);
  await expect(client.readEvents('org', 'topic', 'sub', 1))
    .rejects.toThrow('Request failed');
});

test('commitEvents success', async () => {
  addContext('/org/topics/topic/subscriptions/sub/event-commits', (req, res) => {
    if (req.method === 'POST') {
      sendJson(res, 200, '1');
    }
  });
  const client = new PubSubClient(baseUrl);
  const result = await client.commitEvents('org', 'topic', 'sub', ['1']);
  expect(result).toBe(1);
});

test('commitEvents error', async () => {
  addContext('/org/topics/topic/subscriptions/sub/event-commits', (req, res) => {
    if (req.method === 'POST') {
      sendJson(res, 500, 'err');
    }
  });
  const client = new PubSubClient(baseUrl);
  await expect(client.commitEvents('org', 'topic', 'sub', ['1']))
    .rejects.toThrow('Request failed');
});

test('consumeEvents read error', async () => {
  addContext('/org/topics/topic/subscriptions/sub/events?batchSize=1', (req, res) => {
    if (req.method === 'GET') {
      sendJson(res, 500, 'err');
    }
  });
  const client = new PubSubClient(baseUrl);
  await expect(client.consumeEvents('org', 'topic', 'sub', 1, () => {}))
    .rejects.toThrow('Request failed');
});

test('consumeEvents commit error', async () => {
  const msg = `[{"id":"9f320609-0405-44a3-9042-953a353aa40c","data":{"msg":"hello"},"createdAt":"2025-07-01T00:00:00Z"}]`;
  addContext('/org/topics/topic/subscriptions/sub/events?batchSize=1', (req, res) => {
    if (req.method === 'GET') {
      sendJson(res, 200, msg);
    }
  });
  addContext('/org/topics/topic/subscriptions/sub/event-commits', (req, res) => {
    if (req.method === 'POST') {
      sendJson(res, 500, 'err');
    }
  });
  const client = new PubSubClient(baseUrl);
  await expect(
    client.consumeEvents('org', 'topic', 'sub', 1, async (events, commit) => {
      await commit([events[0].id]);
    })
  ).rejects.toThrow(EventConsumerException);
});
