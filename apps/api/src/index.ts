export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/api/hello") {
      return Response.json({
        message: "¡Hola desde tu Cloudflare Worker!",
      });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
} satisfies ExportedHandler;
