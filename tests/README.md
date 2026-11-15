# Recovery regression checks

These checks execute the actual live page and replay page scripts in a DOM with controlled API responses. They cover stalled/failed requests, retained replay lists, missing shared recordings, midnight fallback, iframe positioning, source changes, and the separate live-audio status.

Install the DOM test dependency outside the static website and run with Node.js:

```sh
npm install --prefix /tmp/web3origin-tests --no-audit --no-fund linkedom@0.18.12
NODE_PATH=/tmp/web3origin-tests/node_modules node --test tests/live-recovery.test.cjs
NODE_PATH=/tmp/web3origin-tests/node_modules node --test tests/news-recovery.test.cjs
```

These tests do not replace checking real playback and layout in a browser, or checking recording/upload logs on the backend.

News checks execute the actual inline script and cover old content with a recent package timestamp, HTTP/network errors, malformed feeds, retained content, timeout/retry, late responses, missing fields, publication ordering, Beijing dates, and notification freshness. They cannot verify the separate VPS collector or its upstream credentials.
