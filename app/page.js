"use client";

import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [inbox, setInbox] = useState([]);
  const [selectedMail, setSelectedMail] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Belum ada email dibuat");
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(5);

  const inboxCount = inbox.length;

  const selectedPreview = useMemo(() => {
    if (!selectedMail) return null;
    return inbox.find((mail) => mail.id === selectedMail.id) || null;
  }, [selectedMail, inbox]);

  const detectedOtp = useMemo(() => {
    if (!selectedPreview) return null;

    const subject = selectedPreview.subject || "";
    const body = selectedPreview.body || "";
    const htmlBody = selectedPreview.html_body || "";
    const text = `${subject}\n${body}\n${htmlBody}`;

    const contextualPatterns = [
      /(?:otp|kode|code|verification code|confirm(?:ation)? code|password|pin)[^\d]{0,20}(\d{4,8})/i,
      /(\d{4,8})[^\n]{0,20}(?:otp|kode|code|verification|confirm|password|pin)/i,
    ];

    for (const pattern of contextualPatterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        return match[1];
      }
    }

    const fallbackPatterns = [
      /\b\d{6}\b/g,
      /\b\d{5}\b/g,
      /\b\d{4}\b/g,
      /\b\d{7}\b/g,
      /\b\d{8}\b/g,
    ];

    for (const pattern of fallbackPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        return matches[0];
      }
    }

    return null;
  }, [selectedPreview]);

  const sanitizeUsername = (value) => {
    return value
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9._-]/g, "");
  };

  const fetchInbox = async (targetEmail, options = {}) => {
    if (!targetEmail) return;

    const { silent = false } = options;

    try {
      if (!silent) {
        setLoadingInbox(true);
      }

      const response = await fetch(
        `/api/inbox?email=${encodeURIComponent(targetEmail)}`
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        setInbox([]);
        setSelectedMail(null);
        setStatusMessage(result.message || "Gagal mengambil inbox");
        return;
      }

      const mails = result.data || [];
      setInbox(mails);

      if (mails.length > 0) {
        // otomatis buka email paling atas / terbaru
        setSelectedMail(mails[0]);
      } else {
        setSelectedMail(null);
      }

      if (!silent) {
        setStatusMessage(`Inbox untuk ${targetEmail} berhasil dimuat`);
      }

      if (autoRefresh) {
        setCountdown(5);
      }
    } catch (error) {
      setInbox([]);
      setSelectedMail(null);
      setStatusMessage("Gagal mengambil inbox dari API");
    } finally {
      if (!silent) {
        setLoadingInbox(false);
      }
    }
  };

  const createEmail = async () => {
    const cleanUsername = sanitizeUsername(username);

    if (!cleanUsername) {
      alert("Username email tidak boleh kosong");
      return;
    }

    try {
      setLoadingCreate(true);

      const response = await fetch("/api/address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: cleanUsername,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.message || "Gagal membuat email");
        setStatusMessage(result.message || "Gagal membuat email");
        return;
      }

      const newEmail = result.data.email;

      setUsername(result.data.username);
      setEmail(newEmail);
      setSelectedMail(null);
      setStatusMessage(result.message);
      setCountdown(5);

      await fetchInbox(newEmail);
    } catch (error) {
      setStatusMessage("Terjadi error saat membuat email");
      alert("Terjadi error saat membuat email");
    } finally {
      setLoadingCreate(false);
    }
  };

  const generateRandomEmail = async () => {
    const randomName = "user" + Math.floor(1000 + Math.random() * 9000);

    setUsername(randomName);
    setSelectedMail(null);
    setStatusMessage("Random email sedang dibuat...");

    try {
      setLoadingCreate(true);

      const response = await fetch("/api/address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: randomName,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.message || "Gagal membuat random email");
        setStatusMessage(result.message || "Gagal membuat random email");
        return;
      }

      const newEmail = result.data.email;

      setUsername(result.data.username);
      setEmail(newEmail);
      setStatusMessage("Random email berhasil dibuat");
      setCountdown(5);

      await fetchInbox(newEmail);
    } catch (error) {
      setStatusMessage("Terjadi error saat membuat random email");
      alert("Terjadi error saat membuat random email");
    } finally {
      setLoadingCreate(false);
    }
  };

  const copyEmail = async () => {
    if (!email) {
      alert("Buat email dulu");
      return;
    }

    try {
      await navigator.clipboard.writeText(email);
      setStatusMessage("Email berhasil disalin");
      alert("Email berhasil disalin");
    } catch (error) {
      setStatusMessage("Gagal menyalin email");
      alert("Gagal menyalin email");
    }
  };

  const copyOtp = async () => {
    if (!detectedOtp) {
      alert("OTP tidak ditemukan");
      return;
    }

    try {
      await navigator.clipboard.writeText(detectedOtp);
      setStatusMessage("OTP berhasil disalin");
      alert("OTP berhasil disalin");
    } catch (error) {
      setStatusMessage("Gagal menyalin OTP");
      alert("Gagal menyalin OTP");
    }
  };

  const refreshInbox = async () => {
    if (!email) {
      alert("Buat email dulu");
      return;
    }

    setCountdown(5);
    await fetchInbox(email);
  };

  const openMail = (mail) => {
    setSelectedMail(mail);
    setStatusMessage("Email dibuka");
  };

  const deleteMail = async (id) => {
    try {
      const response = await fetch("/api/inbox", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.message || "Gagal menghapus email");
        setStatusMessage(result.message || "Gagal menghapus email");
        return;
      }

      setStatusMessage(result.message);
      setCountdown(5);
      await fetchInbox(email);
    } catch (error) {
      setStatusMessage("Terjadi error saat menghapus email");
      alert("Terjadi error saat menghapus email");
    }
  };

  const clearInbox = async () => {
    if (!email) {
      alert("Buat email dulu");
      return;
    }

    try {
      const response = await fetch("/api/inbox", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          deleteAll: true,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.message || "Gagal menghapus semua inbox");
        setStatusMessage(result.message || "Gagal menghapus semua inbox");
        return;
      }

      setSelectedMail(null);
      setStatusMessage(result.message);
      setCountdown(5);
      await fetchInbox(email);
    } catch (error) {
      setStatusMessage("Terjadi error saat clear inbox");
      alert("Terjadi error saat clear inbox");
    }
  };

  const resetAll = () => {
    setUsername("");
    setEmail("");
    setInbox([]);
    setSelectedMail(null);
    setStatusMessage("Semua data berhasil direset");
    setAutoRefresh(true);
    setCountdown(5);
  };

  useEffect(() => {
    if (!email || !autoRefresh) return;

    setCountdown(5);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchInbox(email, { silent: true });
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [email, autoRefresh]);

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto py-10">
        <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
              Temp Mail
            </h1>
            <p className="text-slate-500">
              Temporary email untuk menerima dan membaca email
            </p>
          </div>

          <div className="mt-8 grid lg:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <p className="text-sm text-slate-500">Email Aktif</p>
              <p className="text-lg font-bold text-slate-800 break-all mt-1">
                {email || "Belum ada email dibuat"}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <p className="text-sm text-slate-500">Jumlah Inbox</p>
              <p className="text-lg font-bold text-slate-800 mt-1">
                {inboxCount} email
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <p className="text-sm text-slate-500">Status</p>
              <p className="text-lg font-bold text-slate-800 mt-1">
                {statusMessage}
              </p>
            </div>
          </div>

          <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Custom Email
            </label>

            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                placeholder="masukkan username"
                value={username}
                onChange={(e) => setUsername(sanitizeUsername(e.target.value))}
                className="flex-1 border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <div className="px-4 py-3 bg-slate-200 border border-slate-300 rounded-xl text-slate-700">
                @inbound.qmail.lol
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={createEmail}
                disabled={loadingCreate}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-5 py-3 rounded-xl"
              >
                {loadingCreate ? "Membuat..." : "Buat Email"}
              </button>

              <button
                onClick={generateRandomEmail}
                disabled={loadingCreate}
                className="bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400 text-white px-5 py-3 rounded-xl"
              >
                Random Email
              </button>

              <button
                onClick={copyEmail}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl"
              >
                Copy Email
              </button>

              <button
                onClick={refreshInbox}
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-xl"
              >
                Refresh Inbox
              </button>

              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`text-white px-5 py-3 rounded-xl ${
                  autoRefresh
                    ? "bg-violet-600 hover:bg-violet-700"
                    : "bg-slate-500 hover:bg-slate-600"
                }`}
              >
                {autoRefresh
                  ? `Auto Refresh ON (${countdown})`
                  : "Auto Refresh OFF"}
              </button>

              <button
                onClick={clearInbox}
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-xl"
              >
                Clear Inbox
              </button>

              <button
                onClick={resetAll}
                className="bg-slate-400 hover:bg-slate-500 text-white px-5 py-3 rounded-xl"
              >
                Reset Semua
              </button>
            </div>
          </div>

          {email && (
            <div className="mt-8 grid lg:grid-cols-2 gap-5">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Inbox</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {autoRefresh
                        ? `Auto refresh dalam ${countdown} detik`
                        : "Auto refresh sedang mati"}
                    </p>
                  </div>

                  <span className="text-sm bg-white border border-slate-200 rounded-full px-3 py-1 text-slate-600">
                    {loadingInbox ? "Loading..." : `${inboxCount} email`}
                  </span>
                </div>

                {inbox.length > 0 ? (
                  <div className="space-y-3">
                    {inbox.map((mail, index) => (
                      <div
                        key={mail.id}
                        className={`bg-white border rounded-2xl p-4 ${
                          selectedPreview?.id === mail.id
                            ? "border-blue-300 ring-2 ring-blue-100"
                            : "border-slate-200"
                        }`}
                      >
                        <button
                          onClick={() => openMail(mail)}
                          className="w-full text-left"
                        >
                          <p className="font-bold text-slate-800">
                            {mail.subject}
                          </p>

                          {index === 0 && (
                            <span className="inline-block mt-2 mr-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">
                              Terbaru
                            </span>
                          )}

                          {mail.html_body && (
                            <span className="inline-block mt-2 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                              HTML
                            </span>
                          )}

                          <p className="text-sm text-slate-500 mt-2">
                            Dari: {mail.from}
                          </p>
                          <p className="text-xs text-slate-400 mt-2">
                            {mail.time}
                          </p>
                        </button>

                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => openMail(mail)}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-xl text-sm"
                          >
                            Buka
                          </button>
                          <button
                            onClick={() => deleteMail(mail.id)}
                            className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-4 py-2 rounded-xl text-sm"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-6 text-slate-500 text-center">
                    {loadingInbox ? "Sedang memuat inbox..." : "Inbox kosong"}
                  </div>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">
                  Isi Email
                </h2>

                {selectedPreview ? (
                  <div className="space-y-4">
                    {detectedOtp && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                        <p className="text-sm text-emerald-700 font-medium">
                          OTP Terdeteksi
                        </p>
                        <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <p className="text-3xl font-bold tracking-[0.3em] text-emerald-800">
                            {detectedOtp}
                          </p>
                          <button
                            onClick={copyOtp}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl"
                          >
                            Copy OTP
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                      <p className="text-xl font-bold text-slate-800">
                        {selectedPreview.subject}
                      </p>
                      <p className="text-sm text-slate-500 mt-2">
                        Dari: {selectedPreview.from}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {selectedPreview.time}
                      </p>

                      <div className="mt-5 border-t border-slate-200 pt-4">
                        {selectedPreview.html_body ? (
                          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                            <iframe
                              title="Email HTML Preview"
                              srcDoc={selectedPreview.html_body}
                              className="w-full min-h-[400px] bg-white"
                              sandbox=""
                            />
                          </div>
                        ) : (
                          <p className="text-slate-700 leading-7 whitespace-pre-wrap">
                            {selectedPreview.body}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-6 text-slate-500">
                    Klik salah satu email di inbox untuk melihat isinya
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}