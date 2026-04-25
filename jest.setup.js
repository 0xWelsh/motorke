// jest.setup.js
// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import "whatwg-fetch";
import { TextEncoder, TextDecoder } from "util";
import { ReadableStream, TransformStream, WritableStream } from "stream/web";

if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder;
}

if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder;
}

if (!global.ReadableStream) {
  global.ReadableStream = ReadableStream;
}

if (!global.TransformStream) {
  global.TransformStream = TransformStream;
}

if (!global.WritableStream) {
  global.WritableStream = WritableStream;
}

if (!global.fetch && typeof window !== "undefined" && window.fetch) {
  global.fetch = window.fetch.bind(window);
}

if (!global.Headers && typeof window !== "undefined" && window.Headers) {
  global.Headers = window.Headers;
}

if (!global.Request && typeof window !== "undefined" && window.Request) {
  global.Request = window.Request;
}

if (!global.Response && typeof window !== "undefined" && window.Response) {
  global.Response = window.Response;
}
