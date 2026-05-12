import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { to, amount, utr, date, company } = await req.json()
    
    const token = Deno.env.get("WHATSAPP_TOKEN")
    const phone_number_id = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")

    if (!token || !phone_number_id) {
      throw new Error("Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID secrets")
    }

    const response = await fetch(
      `https://graph.facebook.com/v17.0/${phone_number_id}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to,
          type: "template",
          template: {
            name: "payment_transfer",
            language: {
              code: "en_US"
            },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: amount },  // {{1}}
                  { type: "text", text: utr },     // {{2}}
                  { type: "text", text: date },    // {{3}}
                  { type: "text", text: company }  // {{4}}
                ]
              }
            ]
          }
        }),
      }
    )

    const data = await response.json()
    
    return new Response(JSON.stringify(data), {
      headers: { 
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*',
      },
      status: response.status
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*',
      },
      status: 400
    })
  }
})
