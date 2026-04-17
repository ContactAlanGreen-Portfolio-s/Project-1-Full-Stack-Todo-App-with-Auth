const { TextEncoder, TextDecoder } = require('util');
const { TransformStream, ReadableStream, WritableStream } = require('node:stream/web');
const { MessageChannel, MessagePort } = require('node:worker_threads');

Object.defineProperties(globalThis, {
  TextDecoder: { value: TextDecoder },
  TextEncoder: { value: TextEncoder },
  TransformStream: { value: TransformStream },
  ReadableStream: { value: ReadableStream },
  WritableStream: { value: WritableStream },
  MessageChannel: { value: MessageChannel },
  MessagePort: { value: MessagePort },
});

const { fetch, Headers, Request, Response } = require('undici');

Object.defineProperties(globalThis, {
  fetch: { value: fetch, writable: true },
  Headers: { value: Headers },
  Request: { value: Request },
  Response: { value: Response, writable: true },
});
