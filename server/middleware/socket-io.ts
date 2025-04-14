import { defineEventHandler } from 'h3';

// This middleware prevents Vue Router from treating socket.io paths as routes
export default defineEventHandler((event) => {
  const url = event.node.req.url;
  if (url && (url.startsWith('/socket.io/') || url === '/socket.io')) {
    // Let socket.io handle these paths
    return;
  }
});