import { query, run } from "@/lib/db";

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

    const email = `${cleanUsername}@qmail.lol`;

    const existingRows = await query(
      "SELECT * FROM addresses WHERE email = ? LIMIT 1",
      [email]
    );

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

    const result = await run(
      "INSERT INTO addresses (email, username) VALUES (?, ?)",
      [email, cleanUsername]
    );

    return Response.json({
      success: true,
      message: "Email berhasil dibuat dan disimpan ke database",
      data: {
        id: result.last_row_id,
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
