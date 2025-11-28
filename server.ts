import express from "express";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Email sending endpoint
app.post("/api/send-email", async (req, res) => {
  try {
    const { toEmail, subject, htmlContent, brevoApiKey, fromEmail, fromName } = req.body;

    if (!brevoApiKey || !fromEmail || !toEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("📧 Sending email via Brevo...", { to: toEmail, from: fromEmail });

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify({
        sender: {
          email: fromEmail,
          name: fromName || "Order System",
        },
        to: [
          { email: toEmail }
        ],
        subject: subject,
        htmlContent: htmlContent,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Email sent successfully!", { messageId: result.messageId });
      return res.status(200).json({ success: true, messageId: result.messageId });
    } else {
      console.error("❌ Brevo Error:", result);
      return res.status(response.status).json({ error: result.message || "Failed to send email" });
    }
  } catch (error: any) {
    console.error("❌ Email error:", error);
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Email server running on http://localhost:${PORT}`);
});
