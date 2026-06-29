// VexylClient API - Deno Deploy + Deno KV
const kv = await Deno.openKv();
const API_URL = "https://vexyl-api-x4aw106ty0hk.vexylclient.deno.net";

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  // POST /register?uuid=...&username=...
  if (req.method === "POST" && path === "/register") {
    const uuid = url.searchParams.get("uuid");
    const username = url.searchParams.get("username");
    if (!uuid || !username)
      return new Response(JSON.stringify({ error: "brak uuid lub username" }), { status: 400, headers });
    if (!/^[0-9a-f\-]{32,36}$/i.test(uuid))
      return new Response(JSON.stringify({ error: "nieprawidlowy uuid" }), { status: 400, headers });

    await kv.set(["players", uuid], { uuid, username, registeredAt: Date.now() });
    return new Response(JSON.stringify({ ok: true }), { headers });
  }

  // GET /players -> { "uuid": "nick", ... }
  if (req.method === "GET" && path === "/players") {
    const players: Record<string, string> = {};
    const entries = kv.list<{ uuid: string; username: string }>({ prefix: ["players"] });
    for await (const entry of entries) {
      players[entry.value.uuid] = entry.value.username;
    }
    return new Response(JSON.stringify(players), { headers });
  }

  // GET /
  if (path === "/")
    return new Response(JSON.stringify({ name: "VexylClient API", version: "1.0" }), { headers });

  return new Response(JSON.stringify({ error: "not found" }), { status: 404, headers });
});
