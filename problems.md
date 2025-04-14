[9:43:39 AM]  WARN  [vite:css][postcss] @import must precede all other statements (besides @charset or empty @layer)
4  |  
5  |  /* Import Space Grotesk font */
6  |  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono&display=swap');
   |  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
7  |  
8  |  @layer base {

[nitro 9:43:41 AM] ✔ Nuxt Nitro server built in 1777ms
[9:43:41 AM] ℹ Vite client warmed up in 3ms

[9:43:41 AM]  WARN  [vite:css][postcss] @import must precede all other statements (besides @charset or empty @layer)
4  |  
5  |  /* Import Space Grotesk font */
6  |  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono&display=swap');
   |  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
7  |  
8  |  @layer base { (x2)

[server] ℹ Starting LN2UPI server...
Redis client connected

[server]  WARN  Redis server recently restarted, clearing stale connection data

[server] ✔ Redis connection established successfully
[server] ℹ SQLite support is ready for implementation if needed
[websocket] ✔ Redis subscriber setup complete
[websocket] ✔ Socket.io server initialized successfully
[websocket] ℹ Redis subscriptions established for order:update, exchange:update, stats:update
[server] ✔ WebSocket server initialized successfully
[9:43:43 AM] ℹ Vite server warmed up in 1835ms

[9:43:44 AM]  ERROR  Internal server error: [postcss] /Users/abhiramam/Desktop/Projects/bitupi/components/ConnectionStatus.vue?vue&type=style&index=0&scoped=c5adaebf&lang.css:35:3: The bg-error-red class does not exist. If bg-error-red is a custom class, make sure it is defined within a @layer directive.
  Plugin: vite:css
  File: /Users/abhiramam/Desktop/Projects/bitupi/components/ConnectionStatus.vue?vue&type=style&index=0&scoped=c5adaebf&lang.css:115:2
  33 |  
  34 |  .disconnected .status-dot {
  35 |    @apply bg-error-red;
     |    ^
  36 |    box-shadow: 0 0 8px rgba(255, 82, 82, 0.7);
  37 |  }
      at Input.error (/Users/abhiramam/Desktop/Projects/bitupi/node_modules/postcss/lib/input.js:113:16)
      at AtRule.error (/Users/abhiramam/Desktop/Projects/bitupi/node_modules/postcss/lib/node.js:149:32)
      at processApply (/Users/abhiramam/Desktop/Projects/bitupi/node_modules/tailwindcss/lib/lib/expandApplyAtRules.js:380:29)
      at /Users/abhiramam/Desktop/Projects/bitupi/node_modules/tailwindcss/lib/lib/expandApplyAtRules.js:551:9
      at /Users/abhiramam/Desktop/Projects/bitupi/node_modules/tailwindcss/lib/processTailwindFeatures.js:55:50
      at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
      at async plugins (/Users/abhiramam/Desktop/Projects/bitupi/node_modules/tailwindcss/lib/plugin.js:38:17)
      at async LazyResult.runAsync (/Users/abhiramam/Desktop/Projects/bitupi/node_modules/postcss/lib/lazy-result.js:293:11)
      at async compileCSS (file:///Users/abhiramam/Desktop/Projects/bitupi/node_modules/vite/dist/node/chunks/dep-Bid9ssRr.js:49180:21)
      at async TransformPluginContext.transform (file:///Users/abhiramam/Desktop/Projects/bitupi/node_modules/vite/dist/node/chunks/dep-Bid9ssRr.js:48361:11)


[9:43:44 AM]  WARN  [vite:css][postcss] @import must precede all other statements (besides @charset or empty @layer)
4  |  
5  |  /* Import Space Grotesk font */
6  |  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono&display=swap');
   |  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
7  |  
8  |  @layer base {


[9:43:45 AM]  WARN  [vite:css][postcss] @import must precede all other statements (besides @charset or empty @layer)
4  |  
5  |  /* Import Space Grotesk font */
6  |  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono&display=swap');
   |  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
7  |  
8  |  @layer base { (x2)


 WARN  [Vue Router warn]: No match found for location with path "/socket.io/?EIO=4&transport=websocket"


 WARN  [Vue Router warn]: No match found for location with path "/socket.io/"


 WARN  [Vue Router warn]: No match found for location with path "/socket.io/?EIO=4&transport=websocket"


 WARN  [Vue Router warn]: No match found for location with path "/socket.io/"


[9:43:46 AM]  ERROR  [unhandledRejection] read ECONNRESET

    at TCP.onStreamRead (node:internal/stream_base_commons:217:20)


 WARN  [Vue Router warn]: No match found for location with path "/socket.io/?EIO=4&transport=websocket"


 WARN  [Vue Router warn]: No match found for location with path "/socket.io/"


 WARN  [Vue Router warn]: No match found for location with path "/socket.io/?EIO=4&transport=websocket"


 WARN  [Vue Router warn]: No match found for location with path "/socket.io/"


[9:43:47 AM]  ERROR  [unhandledRejection] read ECONNRESET

    at TCP.onStreamRead (node:internal/stream_base_commons:217:20)


[9:43:48 AM]  ERROR  Internal server error: [postcss] /Users/abhiramam/Desktop/Projects/bitupi/components/ConnectionStatus.vue?vue&type=style&index=0&scoped=c5adaebf&lang.css:35:3: The bg-error-red class does not exist. If bg-error-red is a custom class, make sure it is defined within a @layer directive.
  Plugin: vite:css
  File: /Users/abhiramam/Desktop/Projects/bitupi/components/ConnectionStatus.vue?vue&type=style&index=0&scoped=c5adaebf&lang.css:115:2
  33 |  
  34 |  .disconnected .status-dot {
  35 |    @apply bg-error-red;
     |    ^
  36 |    box-shadow: 0 0 8px rgba(255, 82, 82, 0.7);
  37 |  }
      at Input.error (/Users/abhiramam/Desktop/Projects/bitupi/node_modules/postcss/lib/input.js:113:16)
      at AtRule.error (/Users/abhiramam/Desktop/Projects/bitupi/node_modules/postcss/lib/node.js:149:32)
      at processApply (/Users/abhiramam/Desktop/Projects/bitupi/node_modules/tailwindcss/lib/lib/expandApplyAtRules.js:380:29)
      at /Users/abhiramam/Desktop/Projects/bitupi/node_modules/tailwindcss/lib/lib/expandApplyAtRules.js:551:9
      at /Users/abhiramam/Desktop/Projects/bitupi/node_modules/tailwindcss/lib/processTailwindFeatures.js:55:50
      at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
      at async plugins (/Users/abhiramam/Desktop/Projects/bitupi/node_modules/tailwindcss/lib/plugin.js:38:17)
      at async LazyResult.runAsync (/Users/abhiramam/Desktop/Projects/bitupi/node_modules/postcss/lib/lazy-result.js:293:11)
      at async compileCSS (file:///Users/abhiramam/Desktop/Projects/bitupi/node_modules/vite/dist/node/chunks/dep-Bid9ssRr.js:49180:21)
      at async TransformPluginContext.transform (file:///Users/abhiramam/Desktop/Projects/bitupi/node_modules/vite/dist/node/chunks/dep-Bid9ssRr.js:48361:11)


 WARN  [Vue Router warn]: No match found for location with path "/socket.io/?EIO=4&transport=websocket"


 WARN  [Vue Router warn]: No match found for location with path "/socket.io/"


 WARN  [Vue Router warn]: No match found for location with path "/socket.io/?EIO=4&transport=websocket"


 WARN  [Vue Router warn]: No match found for location with path "/socket.io/"


[9:43:48 AM]  ERROR  [unhandledRejection] read ECONNRESET

    at TCP.onStreamRead (node:internal/stream_base_commons:217:20)


 WARN  [Vue Router warn]: No match found for location with path "/socket.io/?EIO=4&transport=websocket"


 WARN  [Vue Router warn]: No match found for location with path "/socket.io/"


 WARN  [Vue Router warn]: No match found for location with path "/socket.io/?EIO=4&transport=websocket"


 WARN  [Vue Router warn]: No match found for location with path "/socket.io/"


[9:43:49 AM]  ERROR  [unhandledRejection] read ECONNRESET

    at TCP.onStreamRead (node:internal/stream_base_commons:217:20)


 WARN  [Vue Router warn]: No match found for location with path "/socket.io/?EIO=4&transport=websocket"


 WARN  [Vue Router warn]: No match found for location with path "/socket.io/"


 WARN  [Vue Router warn]: No match found for location with path "/socket.io/?EIO=4&transport=websocket"


 WARN  [Vue Router warn]: No match found for location with path "/socket.io/"


[9:43:51 AM]  ERROR  [unhandledRejection] read ECONNRESET

    at TCP.onStreamRead (node:internal/stream_base_commons:217:20)
