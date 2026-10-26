import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const files = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/app.mjs", ["app.mjs", "text/javascript; charset=utf-8"]],
]);
const server = createServer(async (request, response) => {
  const file = files.get(new URL(request.url, "http://localhost").pathname);
  if (!file) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }
  try {
    const content = await readFile(new URL(file[0], import.meta.url));
    response.writeHead(200, { "Content-Type": file[1] });
    response.end(content);
  } catch {
    response.writeHead(500);
    response.end("Could not read the workshop file");
  }
});
server.listen(Number(process.env.WORKSHOP_PORT ?? 4173), "127.0.0.1", () =>
  console.log(
    `Open http://127.0.0.1:${server.address().port} — Ctrl+C to stop.`,
  ),
);
