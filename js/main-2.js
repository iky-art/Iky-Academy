// === Iky Academy — Navbar wiring (dipanggil tiap halaman setelah login) ===

function markActiveNavLink() {
  var path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".navlink").forEach(function (link) {
    if (link.getAttribute("href") === path) link.classList.add("is-active");
  });
}

function wireMobileNav() {
  var navToggle = document.getElementById("navToggle");
  var navMenu = document.getElementById("navMenu");
  if (!navToggle || !navMenu) return;
  navToggle.addEventListener("click", function () {
    var isOpen = navMenu.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
}

function wireDropdown(btnId, dropdownId) {
  var btn = document.getElementById(btnId);
  var dd = document.getElementById(dropdownId);
  if (!btn || !dd) return;
  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    dd.classList.toggle("open");
  });
  document.addEventListener("click", function (e) {
    if (!dd.contains(e.target) && e.target !== btn) dd.classList.remove("open");
  });
}

function setAvatar(profile) {
  var el = document.getElementById("navAvatar");
  if (!el) return;
  if (profile && profile.avatar_url) {
    el.innerHTML = '<img src="' + profile.avatar_url + '" alt="">';
  } else {
    var initial = (profile && profile.display_name ? profile.display_name[0] : "I").toUpperCase();
    el.textContent = initial;
  }
}

async function loadNotifications(userId) {
  var list = document.getElementById("notifList");
  var dot = document.getElementById("notifDot");
  if (!list) return;

  const { data: announcements, error } = await client
    .from("announcements")
    .select("id, title, body, link_url, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    list.innerHTML = '<div class="notif-empty">Gagal memuat notifikasi.</div>';
    return;
  }
  if (!announcements || announcements.length === 0) {
    list.innerHTML = '<div class="notif-empty">Belum ada pengumuman.</div>';
    return;
  }

  const { data: reads } = await client
    .from("notification_reads")
    .select("announcement_id")
    .eq("user_id", userId);
  const readIds = new Set((reads || []).map(function (r) { return r.announcement_id; }));

  var unreadCount = 0;
  list.innerHTML = announcements.map(function (a) {
    var isUnread = !readIds.has(a.id);
    if (isUnread) unreadCount++;
    return (
      '<div class="notif-item ' + (isUnread ? "unread" : "") + '" data-id="' + a.id + '">' +
        '<div class="notif-item__title">' + escapeHtml(a.title) + "</div>" +
        (a.body ? '<div class="muted" style="font-size:.8rem;">' + escapeHtml(a.body) + "</div>" : "") +
        '<div class="notif-item__time">' + timeAgo(a.created_at) + "</div>" +
      "</div>"
    );
  }).join("");

  if (dot) dot.classList.toggle("show", unreadCount > 0);

  // Tandai sudah dibaca begitu dropdown dibuka (delay dikit biar sempat kebaca user)
  var notifBtn = document.getElementById("notifBtn");
  if (notifBtn) {
    notifBtn.addEventListener("click", function onOpen() {
      setTimeout(async function () {
        var unread = announcements.filter(function (a) { return !readIds.has(a.id); });
        if (unread.length === 0) return;
        var rows = unread.map(function (a) { return { user_id: userId, announcement_id: a.id }; });
        await client.from("notification_reads").upsert(rows, { onConflict: "user_id,announcement_id" });
        if (dot) dot.classList.remove("show");
      }, 1500);
      notifBtn.removeEventListener("click", onOpen);
    });
  }
}

function subscribeAnnouncementsRealtime(userId) {
  if (!client) return;
  client
    .channel("announcements-realtime")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "announcements" }, function () {
      loadNotifications(userId);
      showToast("📢 Ada pengumuman baru!", "info");
    })
    .subscribe();
}

async function initNavbar(session, profile) {
  markActiveNavLink();
  wireMobileNav();
  wireDropdown("notifBtn", "notifDropdown");
  setAvatar(profile);
  applyTheme((profile && profile.theme_preference) || "dark");

  var themeBtn = document.getElementById("themeToggle");
  if (themeBtn) themeBtn.addEventListener("click", function () { toggleTheme(session.user.id); });

  var logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", signOut);

  if (session && session.user) {
    loadNotifications(session.user.id);
    subscribeAnnouncementsRealtime(session.user.id);
  }
}
