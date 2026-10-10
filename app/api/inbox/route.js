import { query, run } from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return Response.json(
        {
          success: false,
          message: "Parameter email wajib diisi",
        },
        { status: 400 }
      );
    }

    // SQLite: format tanggal pakai strftime (ganti DATE_FORMAT MySQL).
    // received_at disimpan sebagai UTC ('now'); +7 jam -> WIB.
    const rows = await query(
      `
      SELECT
        id,
        sender AS "from",
        subject,
        body,
        html_body,
        strftime('%d/%m/%Y %H:%M:%S', datetime(received_at, '+7 hours')) AS time
      FROM emails
      WHERE address_email = ?
      ORDER BY received_at DESC, id DESC
      `,
      [email]
    );

    return Response.json({
      success: true,
      message: "Inbox berhasil diambil",
      email,
      data: rows,
    });
  } catch (error) {
    console.error("ERROR GET /api/inbox:", error);

    return Response.json(
      {
        success: false,
        message: "Gagal mengambil inbox dari database",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { id, email, deleteAll } = body;

    if (deleteAll === true) {
      if (!email) {
        return Response.json(
          {
            success: false,
            message: "Email address wajib diisi untuk hapus semua inbox",
          },
          { status: 400 }
        );
      }

      const result = await run(
        "DELETE FROM emails WHERE address_email = ?",
        [email]
      );

      return Response.json({
        success: true,
        message: `Berhasil menghapus ${result.changes} email`,
      });
    }

    if (!id) {
      return Response.json(
        {
          success: false,
          message: "ID email wajib diisi",
        },
        { status: 400 }
      );
    }

    const result = await run("DELETE FROM emails WHERE id = ?", [id]);

    if (result.changes === 0) {
      return Response.json(
        {
          success: false,
          message: "Email tidak ditemukan",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "1 email berhasil dihapus",
    });
  } catch (error) {
    console.error("ERROR DELETE /api/inbox:", error);

    return Response.json(
      {
        success: false,
        message: "Gagal menghapus email dari database",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
