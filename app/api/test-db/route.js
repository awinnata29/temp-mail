import db from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.query("SELECT 1 AS test");
    return Response.json({
      success: true,
      message: "Koneksi database berhasil",
      data: rows,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Koneksi database gagal",
        error: error.message,
      },
      { status: 500 }
    );
  }
}