import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");
    }

    // Read body FIRST before anything else consumes it
    const body = await req.json();
    const { plan, amount, email } = body;
    console.log("Request body:", JSON.stringify({ plan, amount, email }));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Creating PIX for user:", user.id, "plan:", plan, "amount:", amount);

    // Create PIX payment via Mercado Pago
    const mpPayload = {
      transaction_amount: Number(amount),
      description: `PaixãoFlix - Plano ${plan === "pro" ? "Pro" : "Básico"} (Mensal)`,
      payment_method_id: "pix",
      payer: {
        email: email || user.email,
      },
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      external_reference: JSON.stringify({
        user_id: user.id,
        plan: plan,
        max_screens: plan === "pro" ? 2 : 1,
      }),
    };

    console.log("MP payload:", JSON.stringify(mpPayload));

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${user.id}-${plan}-${Date.now()}`,
      },
      body: JSON.stringify(mpPayload),
    });

    const mpText = await mpResponse.text();
    console.log("MP response status:", mpResponse.status);
    console.log("MP response body:", mpText);

    let mpData;
    try {
      mpData = JSON.parse(mpText);
    } catch {
      throw new Error(`Mercado Pago returned non-JSON response [${mpResponse.status}]: ${mpText}`);
    }

    if (!mpResponse.ok) {
      throw new Error(`Mercado Pago API error [${mpResponse.status}]: ${mpText}`);
    }

    // Update subscription with pending status
    await supabase
      .from("user_subscriptions")
      .update({
        plan: plan,
        max_screens: plan === "pro" ? 2 : 1,
        status: "pending",
      })
      .eq("user_id", user.id);

    const pixData = mpData.point_of_interaction?.transaction_data;

    return new Response(
      JSON.stringify({
        payment_id: mpData.id,
        qr_code: pixData?.qr_code,
        qr_code_base64: pixData?.qr_code_base64,
        ticket_url: pixData?.ticket_url,
        expiration: mpData.date_of_expiration,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating PIX payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
