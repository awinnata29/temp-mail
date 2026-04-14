export function getInboxByEmail(email) {
  const inboxMap = {
    "budi@tempmail.local": [
      {
        id: 1,
        from: "TikTok",
        subject: "Kode verifikasi akun Budi",
        body: "Halo Budi, ini kode OTP kamu: 483920",
        time: "1 menit lalu",
      },
      {
        id: 2,
        from: "Shopee",
        subject: "Voucher khusus untuk Budi",
        body: "Budi, kamu dapat voucher diskon 20% hari ini.",
        time: "5 menit lalu",
      },
    ],
    "user1234@tempmail.local": [
      {
        id: 1,
        from: "Facebook",
        subject: "Login baru terdeteksi",
        body: "Kami mendeteksi login baru di akun user1234.",
        time: "2 menit lalu",
      },
      {
        id: 2,
        from: "Instagram",
        subject: "Reset password akun kamu",
        body: "Klik link ini untuk reset password akun Instagram kamu.",
        time: "10 menit lalu",
      },
    ],
  };

  return (
    inboxMap[email] || [
      {
        id: 1,
        from: "Demo App",
        subject: `Selamat datang di ${email}`,
        body: `Halo, inbox untuk ${email} berhasil dibuat.`,
        time: "Baru saja",
      },
      {
        id: 2,
        from: "System",
        subject: "Inbox email aktif",
        body: `Sekarang kamu sedang membuka inbox untuk ${email}.`,
        time: "1 menit lalu",
      },
    ]
  );
}