import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const kindHints: Record<string, string> = {
  "cover-art": "Create polished music cover artwork. Strong central composition, professional release-ready art direction.",
  "promo-poster": "Create a polished entertainment promotional poster with cinematic composition and room for optional typography.",
  "character-visual": "Create a polished character concept visual with clear wardrobe, environment, lighting, and personality.",
  "social-graphic": "Create a polished social-media promotional visual with a clean, high-impact composition.",
  "custom": "Create a polished professional image following the user's description closely.",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed." });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json(401, { error: "Sign in to use Lumi image generation." });

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const metaApiKey = Deno.env.get("META_API_KEY") || Deno.env.get("MODEL_API_KEY");
    const museModel = Deno.env.get("LUMI_IMAGE_MODEL") || "muse-image-1.0";

    if (!supabaseUrl || !serviceRole) {
      return json(500, { error: "Supabase server configuration is incomplete." });
    }
    if (!metaApiKey) {
      const visibleSecretNames = Object.keys(Deno.env.toObject())
        .filter((name) => /META|MODEL|LUMI|API_KEY/i.test(name))
        .sort();
      console.log("LUMI_IMAGE_ENV_DIAGNOSTIC", JSON.stringify({
        metaApiKeyVisible: Boolean(Deno.env.get("META_API_KEY")),
        modelApiKeyVisible: Boolean(Deno.env.get("MODEL_API_KEY")),
        visibleSecretNames,
        deploymentId: Deno.env.get("DENO_DEPLOYMENT_ID") || null
      }));
      return json(503, {
        error: "Lumi image generation needs the META_API_KEY (or MODEL_API_KEY) server secret configured.",
        diagnostic: {
          metaApiKeyVisible: Boolean(Deno.env.get("META_API_KEY")),
          modelApiKeyVisible: Boolean(Deno.env.get("MODEL_API_KEY")),
          visibleSecretNames,
          deploymentId: Deno.env.get("DENO_DEPLOYMENT_ID") || null
        }
      });
    }

    const admin = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user) {
      return json(401, { error: "Your Studio session expired. Please sign in again." });
    }

    const body = await req.json().catch(() => ({}));
    const projectId = String(body.projectId || "").trim();
    const prompt = String(body.prompt || "").trim();
    const kind = String(body.kind || "custom").trim();
    const aspect = String(body.aspect || "square").trim();
    const references = Array.isArray(body.referenceImages) ? body.referenceImages : [];
    if (references.length > 3 || references.some((value: unknown) =>
      typeof value !== "string" || value.length > 4200000 ||
      !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value)
    )) return json(400, { error: "Use up to 3 PNG, JPEG, or WebP references, each under 3 MB." });

    if (!projectId || !prompt) return json(400, { error: "Project and image prompt are required." });
    if (prompt.length > 4000) return json(400, { error: "Image prompt is too long." });

    const { data: project, error: projectError } = await admin
      .from("studio_projects")
      .select("id,title,project_kind")
      .eq("id", projectId)
      .eq("owner_account_id", user.id)
      .maybeSingle();

    if (projectError || !project) {
      return json(403, { error: "You do not own this Studio project." });
    }

    const aspectHint =
      aspect === "portrait"
        ? "Use a portrait composition."
        : aspect === "landscape"
        ? "Use a landscape composition."
        : "Use a square composition.";

    const finalPrompt = [
      kindHints[kind] || kindHints.custom,
      `Studio project: ${project.title}.`,
      aspectHint,
      prompt,
      "Avoid adding logos, watermarks, signatures, or random text unless the user explicitly asks for text.",
    ].join("\n\n");

    const imageResponse = await fetch("https://api.meta.ai/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${metaApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: [
          {
            content: [
              {
                text: finalPrompt,
                type: "input_text",
              },
              ...references.map((image_url: string) => ({ type: "input_image", image_url })),
            ],
            role: "user",
            type: "message",
          },
        ],
        max_output_tokens: 2048,
        model: museModel,
        store: true,
        stream: false,
        temperature: 0.6,
        top_p: 0.9,
        tools: [
          {
            enable_image_search: true,
            enable_web_search: true,
            output_format: "png",
            reasoning_strength: "high",
            type: "image_generation",
          },
        ],
      }),
    });

    const imagePayload = await imageResponse.json().catch(() => ({}));
    if (!imageResponse.ok) {
      const message =
        imagePayload?.error?.message ||
        imagePayload?.message ||
        "Muse could not generate that image.";
      return json(imageResponse.status, { error: message });
    }

    const output = Array.isArray(imagePayload?.output) ? imagePayload.output : [];
    const imageCall = output.find((item: any) => item?.type === "image_generation_call");
    const base64Image = imageCall?.result;

    if (!base64Image || typeof base64Image !== "string") {
      return json(502, { error: "Muse finished, but no image bytes were returned in image_generation_call.result." });
    }

    const binary = atob(base64Image);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

    const filename = `studio/${user.id}/${projectId}/lumi-images/${Date.now()}-${crypto.randomUUID()}.png`;

    const { error: uploadError } = await admin.storage
      .from("ebg-studio-private")
      .upload(filename, bytes, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      return json(500, { error: `Image created, but Studio could not save it: ${uploadError.message}` });
    }

    const { data: privateData, error: signError } = await admin.storage.from("ebg-studio-private").createSignedUrl(filename, 3600);
    if (signError || !privateData?.signedUrl) return json(500, { error: "Image saved but its private preview could not be opened." });

    return json(200, {
      imageUrl: privateData.signedUrl,
      prompt,
      provider: "muse-image-1.0",
      path: filename,
      projectId,
    });
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : "Lumi could not generate the image.",
    });
  }
});
