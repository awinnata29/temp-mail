import db from "@/lib/db";

export async function POST(request) {
  try {
    const formData = await request.formData();

    const to = String(formData.get("to") || "").toLowerCase().trim();
    const from = String(formData.get("from") || "").trim();
    const subject = String(formData.get("subject") || "(Tanpa subject)").trim();
    const text = String(formData.get("text") || "").trim();
    const html = String(formData.get("html") || "").trim();

    if (!to || !from) {
      return Response.json(
        {
          success: false,
          message: "Field to dan from wajib ada",
        },
        { status: 400 }
      );
    }

    const [addressRows] = await db.query(
      "SELECT id FROM addresses WHERE email = ? LIMIT 1",
      [to]
    );

    if (addressRows.length === 0) {
      return Response.json(
        {
          success: false,
          message: "Address tujuan tidak terdaftar",
        },
        { status: 404 }
      );
    }

    const finalBody = text || html || "(Isi email kosong)";

    await db.query(
      `
      INSERT INTO emails (address_email, sender, subject, body, html_body)
      VALUES (?, ?, ?, ?, ?)
      `,
      [to, from, subject, finalBody, html || null]
    );

    return Response.json({
      success: true,
      message: "Email masuk berhasil disimpan",
    });
  } catch (error) {
    console.error("ERROR POST /api/inbound-email:", error);

    return Response.json(
      {
        success: false,
        message: "Gagal menerima email masuk",
        error: error.message,
      },
      { status: 500 }
    );
  }
}