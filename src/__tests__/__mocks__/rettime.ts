// __mocks__/rettime.ts
// rettime is an internal dependency of MSW that ships .mjs-only files.
// Jest's CJS runtime cannot parse .mjs imports, so we stub it out.
// MSW's network-level interception doesn't actually require rettime at runtime
// in a jsdom environment — it's only used by MSW's browser DevTools overlay.
export class LensList {
  push() {}
  pop() {}
  forEach() {}
}
