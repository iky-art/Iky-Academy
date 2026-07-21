// === Iky Academy — Supabase Client & Shared Helpers ===

const SUPABASE_URL = "https://rlbmwtaqixektxzsvftj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_IhJ83OE1cRu065ld5xm_Cw_l3-tRpRt";

let client;
if (!window.supabase || typeof window.supabase.createClient !== "function") {
  console.error("[Iky Academy] Gagal memuat pustaka Supabase — cek urutan <script> atau koneksi internet.");
} else {
  client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
window.client = client;

// ----- Auth helpers -----
async function requireSession(redirectTo = "login.html") {
  if (!client) {
    document.body.innerHTML = '<div style="padding:40px;text-align:center;font-family:sans-serif;">⚠️ Gagal memuat koneksi database. Cek internet kamu, lalu refresh halaman.</div>';
    return null;
  }
  const { data: { session } } = await client.auth.getSession();
  if (!session) {
    window.location.href = redirectTo;
    return null;
  }
  return session;
}

async function signInWithEmail(email, password) {
  return client.auth.signInWithPassword({ email, password });
}

async function signUpWithEmail(email, password, displayName) {
  return client.auth.signUp({
    email, password,
    options: { data: { full_name: displayName } }
  });
}

async function signInWithProvider(provider) {
  const { error } = await client.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin + window.location.pathname.replace(/(login|register)\.html$/, "index.html") }
  });
  if (error) showToast(formatError(error), "error");
}

async function signOut() {
  await client.auth.signOut();
  window.location.href = "login.html";
}

// Pastikan baris profil ada untuk user yang baru login (dipanggil abis Google OAuth redirect balik)
async function ensureProfile(user) {
  if (!user) return null;
  const meta = user.user_metadata || {};
  const { data, error } = await client
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email,
        display_name: meta.full_name || meta.name || user.email.split("@")[0],
        avatar_url: meta.avatar_url || meta.picture || null,
      },
      { onConflict: "id", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) {
    console.error("ensureProfile error:", error.message);
    return null;
  }
  return data;
}

// ----- Tema terang/gelap (tersimpan di profiles.theme_preference) -----
function applyTheme(mode) {
  document.documentElement.setAttribute("data-theme", mode);
  const btn = document.getElementById("themeToggle");
  if (btn) btn.textContent = mode === "dark" ? "☀️" : "🌙";
}

async function toggleTheme(userId) {
  const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  if (userId) {
    await client.from("profiles").update({ theme_preference: next }).eq("id", userId);
  }
}

// ----- UI helpers -----
function showToast(message, type = "info") {
  let toast = document.getElementById("aa-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "aa-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `aa-toast aa-toast--${type} aa-toast--show`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("aa-toast--show"), 3200);
}

function formatError(err) {
  if (!err) return "Terjadi kesalahan tak terduga.";
  const msg = err.message || String(err);
  if (msg.includes("Invalid login credentials")) return "Email atau kata sandi salah.";
  if (msg.includes("User already registered")) return "Email ini sudah terdaftar. Coba masuk.";
  if (msg.includes("Password should be at least")) return "Kata sandi minimal 6 karakter.";
  if (msg.includes("Email not confirmed")) return "Cek email kamu untuk konfirmasi akun dulu, ya.";
  if (msg.includes("popup") || msg.includes("cancel")) return "Login dibatalkan.";
  return msg;
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "baru saja";
  if (diff < 3600) return Math.floor(diff / 60) + " menit lalu";
  if (diff < 86400) return Math.floor(diff / 3600) + " jam lalu";
  return Math.floor(diff / 86400) + " hari lalu";
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str ?? "";
  return d.innerHTML;
}
