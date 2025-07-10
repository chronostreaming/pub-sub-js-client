import http from 'http';
import { PubSubClient, EventPublisher, EventPublisherConfig } from '../index.js';
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

test('event publishing', async () => {
  let calls = 0;
  addContext('/org/topics/topic/events', (req, res) => {
    if (req.method === 'POST') {
      calls++;
      sendJson(res, 200, '1');
    }
  });

  const client = new PubSubClient(baseUrl);
  const cfg = new EventPublisherConfig('org', 'topic', 'sub');
  let errors = 0;
  const publisher = new EventPublisher(cfg, client, () => errors++);

  const result = await publisher.publish({ data: 'msg' });
  expect(result).toBe(1);
  expect(calls).toBe(1);
  expect(errors).toBe(0);
});

test('event publishing on error', async () => {
  let calls = 0;
  addContext('/org/topics/topic/events', (req, res) => {
    if (req.method === 'POST') {
      calls++;
      sendJson(res, 500, 'err');
    }
  });

  const client = new PubSubClient(baseUrl);
  const cfg = new EventPublisherConfig('org', 'topic', 'sub');
  let errors = 0;
  const publisher = new EventPublisher(cfg, client, () => errors++);

  const result = await publisher.publish({ data: 'msg' });
  expect(result).toBe(0);
  expect(calls).toBe(1);
  expect(errors).toBe(1);
});
