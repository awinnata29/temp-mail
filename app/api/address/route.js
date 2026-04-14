import db from "@/lib/db";

function sanitizeUsername(value) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._-]/g, "");
}

export async function POST(request) {
  try {
    const body = await request.json();
    const username = body.username;

    console.log("BODY DARI FRONTEND:", body);

    if (!username || !username.trim()) {
      return Response.json(
        { success: false, message: "Username wajib diisi" },
        { status: 400 }
      );
    }

    const cleanUsername = sanitizeUsername(username);

    if (!cleanUsername) {
      return Response.json(
        { success: false, message: "Username tidak valid" },
        { status: 400 }
      );
    }

    const email = `${cleanUsername}@inbound.qmail.lol`;

    console.log("EMAIL YANG AKAN DICEK:", email);

    const [existingRows] = await db.query(
      "SELECT * FROM addresses WHERE email = ? LIMIT 1",
      [email]
    );

    console.log("HASIL CEK EMAIL:", existingRows);

    if (existingRows.length > 0) {
      return Response.json({
        success: true,
        message: "Email sudah ada, menggunakan address yang sama",
        data: {
          id: existingRows[0].id,
          username: existingRows[0].username,
          email: existingRows[0].email,
        },
      });
    }

    const [result] = await db.query(
      "INSERT INTO addresses (email, username) VALUES (?, ?)",
      [email, cleanUsername]
    );

    console.log("HASIL INSERT:", result);

    return Response.json({
      success: true,
      message: "Email berhasil dibuat dan disimpan ke database",
      data: {
        id: result.insertId,
        username: cleanUsername,
        email,
      },
    });
  } catch (error) {
    console.error("ERROR API ADDRESS:", error);

    return Response.json(
      {
        success: false,
        message: "Terjadi error di server",
        error: error.message,
      },
      { status: 500 }
    );
  }
}