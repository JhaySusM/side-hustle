const GRAPH_VERSION = "v19.0";

export async function sendWhatsappOtp(phone, code) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME || "otp_verification";

  if (!accessToken || !phoneNumberId) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("WHATSAPP_ACCESS_TOKEN/WHATSAPP_PHONE_NUMBER_ID is not configured");
    }
    // Local dev convenience: no WhatsApp Business credentials configured yet,
    // so just log the code instead of failing the flow outright.
    console.warn(`[dev] WhatsApp API not configured — verification code for ${phone}: ${code}`);
    return;
  }

  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone.replace(/^\+/, ""),
      type: "template",
      template: {
        name: templateName,
        language: { code: "en_US" },
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: code }],
          },
        ],
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Failed to send WhatsApp OTP: ${detail}`);
  }
}
