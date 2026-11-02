import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const H = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const out = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: H });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: H });
  try {
    const body = await req.json().catch(() => ({}));
    const header = req.headers.get("Authorization") || "";
    const token = String(body.access_token || (header.startsWith("Bearer ") ? header.slice(7) : ""));
    if (!token) return out({ error: "Não autenticado" }, 401);

    const url = Deno.env.get("SUPABASE_URL");
    const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
    const legacyService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    let serverKey = legacyService || "";
    if (secretKeysRaw) {
      try { serverKey = JSON.parse(secretKeysRaw)?.default || serverKey; } catch (_) {}
    }
    if (!url || !serverKey) return out({ error: "Configuração interna do servidor incompleta" }, 500);

    const sc = createClient(url, serverKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const u = await sc.auth.getUser(token);
    if (u.error || !u.data.user) return out({ error: "Sessão inválida" }, 401);

    const id = String(body.edition_id || "");
    const download = body.download === true;
    if (!id) return out({ error: "Edição não informada" }, 400);

    const publicKey = req.headers.get("apikey") || "";
    if (!publicKey) return out({ error: "Chave pública não informada" }, 400);
    const uc = createClient(url, publicKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const admin = await uc.rpc("is_app_admin");
    const isAdmin = admin.data === true;

    let bucketId = "";
    let objectPath = "";
    if (isAdmin) {
      const asset = await sc.from("edition_epub_assets")
        .select("bucket_id,object_path,is_ready")
        .eq("edition_id", id).eq("is_ready", true).maybeSingle();
      if (asset.error) return out({ error: `Não foi possível localizar o EPUB desta obra: ${asset.error.message}` }, 500);
      if (asset.data) { bucketId = asset.data.bucket_id; objectPath = asset.data.object_path; }
    } else {
      const lib = await uc.rpc("my_book_library");
      if (lib.error) return out({ error: "Não foi possível validar sua biblioteca" }, 500);
      const item = (lib.data || []).find((x: any) => x.edition_id === id && x.has_access && x.is_ready);
      if (item) { bucketId = item.bucket_id || ""; objectPath = item.object_path || ""; }
    }

    if (!bucketId || !objectPath) return out({ error: isAdmin ? "EPUB ainda não configurado para esta obra" : "Livro não liberado" }, 403);

    if (download && !isAdmin) {
      const { data: orders, error: oe } = await sc.from("orders")
        .select("id,status,paid_at,download_available_at,product_code")
        .eq("user_id", u.data.user.id).eq("edition_id", id).eq("status", "paid")
        .order("paid_at", { ascending: false }).limit(1);
      if (oe) return out({ error: "Não foi possível validar a compra" }, 500);
      const order = orders?.[0];
      if (order) {
        if (!order.paid_at) return out({ error: "Pagamento ainda não confirmado" }, 403);
        const availableAt = order.download_available_at ? new Date(order.download_available_at) : new Date(new Date(order.paid_at).getTime() + 7 * 24 * 60 * 60 * 1000);
        if (Date.now() < availableAt.getTime()) return out({ error: "Download ainda no prazo de liberação", download_available_at: availableAt.toISOString() }, 403);
      } else {
        const { data: ue, error: uee } = await sc.from("user_editions").select("source")
          .eq("user_id", u.data.user.id).eq("edition_id", id).maybeSingle();
        if (uee) return out({ error: "Não foi possível validar a origem do acesso" }, 500);
        if (ue?.source === "purchase") return out({ error: "Compra paga não localizada para liberar o download" }, 403);
      }
    }

    const s = await sc.storage.from(bucketId).createSignedUrl(objectPath, 300);
    if (s.error || !s.data?.signedUrl) return out({ error: s.error?.message || "Falha ao gerar acesso ao livro" }, 500);
    return out({ signed_url: s.data.signedUrl });
  } catch (e) {
    console.error("book-epub-access:", e);
    return out({ error: e instanceof Error ? e.message : "Erro interno" }, 500);
  }
});
