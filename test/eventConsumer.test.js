import { EventConsumer, EventConsumerConfig } from '../index.js';
import { jest } from '@jest/globals';

test('consumer start and stop polling', () => {
  jest.useFakeTimers();
  const mockClient = { consumeEvents: jest.fn().mockResolvedValue(undefined) };
  const handler = jest.fn();
  const cfg = new EventConsumerConfig('org','topic','sub',1,100,handler);
  const consumer = new EventConsumer(mockClient, handler, cfg);
  consumer.start();
  jest.advanceTimersByTime(350);
  consumer.stop();
  expect(mockClient.consumeEvents).toHaveBeenCalledTimes(3);
  jest.useRealTimers();
});
