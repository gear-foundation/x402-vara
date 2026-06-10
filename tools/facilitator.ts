Bun.serve({
  // `routes` requires Bun v1.2.3+
  routes: {
    // Per-HTTP method handlers
    "/verify": {
      POST: async req => {
        const body = await req.json();
        return Response.json({ created: true, ...body });
      },
    },
    "/settle": {
      POST: async req => {
        const body = await req.json();
        return Response.json({ created: true, ...body });
      },
    },
  },

  // (optional) fallback for unmatched routes:
  // Required if Bun's version < 1.2.3
  fetch(req) {
    return new Response("Not Found", { status: 404 });
  },
});
