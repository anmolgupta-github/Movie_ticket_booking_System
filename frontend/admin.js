// admin.js
const API_BASE = "http://localhost:3000/api";

// ========== helpers ==========
function toast(msg, type = "ok") {
  const el = document.getElementById("admin-toast");
  if (!el) return;
  el.textContent = msg;
  el.style.borderColor = type === "err" ? "#ef4444" : "#374151";
  el.classList.remove("hidden", "opacity-0");
  el.classList.add("opacity-100");
  setTimeout(() => {
    el.classList.add("opacity-0");
    setTimeout(() => el.classList.add("hidden"), 400);
  }, 1600);
}

function authHeaders() {
  const t = localStorage.getItem("token");
  return t
    ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

function isAdminToken() {
  try {
    const t = localStorage.getItem("token");
    if (!t) return false;
    const payload = JSON.parse(atob(t.split(".")[1]));
    return payload.role && payload.role.toLowerCase() === "admin";
  } catch {
    return false;
  }
}

// ========== guard ==========
window.addEventListener("DOMContentLoaded", () => {
  if (!isAdminToken()) {
    // 🚫 If not admin, silently redirect to login page
    localStorage.removeItem("token");
    window.location.href = "login.html";
    return;
  }

  bindTabs();
  bindLogout();
  loadStats();
  loadTheatres();
  loadShows();
  loadMovies();
  loadBookings();
  loadUsers();
});

// ========== tabs ==========
function bindTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".panel");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("bg-blue-600"));
      btn.classList.add("bg-blue-600");
      const target = btn.dataset.tab;
      panels.forEach((p) => p.classList.add("hidden"));
      document.getElementById(`panel-${target}`).classList.remove("hidden");
    });
  });
}

// ========== logout ==========
function bindLogout() {
  const b = document.getElementById("logoutAdmin");
  b?.addEventListener("click", () => {
    localStorage.removeItem("token");
    location.href = "login.html";
  });
}

// ========== stats ==========
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/admin/stats`, { headers: authHeaders() });
    const s = await res.json();
    document.getElementById("stat-users").textContent = s.users ?? "—";
    document.getElementById("stat-theatres").textContent = s.theatres ?? "—";
    document.getElementById("stat-shows").textContent = s.shows ?? "—";
    document.getElementById("stat-bookings").textContent = s.bookings ?? "—";
  } catch {
    toast("Failed to load stats", "err");
  }
}

// ========== theatres CRUD ==========
const theatreForm = document.getElementById("theatre-form");
const theatreReset = document.getElementById("theatre-reset");
const theatreSearch = document.getElementById("theatre-search");

theatreForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const theatre_id = document.getElementById("theatre_id").value;
  const name = document.getElementById("theatre_name").value.trim();
  const city = document.getElementById("theatre_city").value.trim();
  const address = document.getElementById("theatre_address").value.trim();

  if (!name || !city) return toast("Name & City are required", "err");

  try {
    if (theatre_id) {
      await fetch(`${API_BASE}/admin/theatres/${theatre_id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ name, city, address }),
      });
      toast("Theatre updated");
    } else {
      await fetch(`${API_BASE}/admin/theatres`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name, city, address }),
      });
      toast("Theatre added");
    }
    theatreForm.reset();
    document.getElementById("theatre_id").value = "";
    loadTheatres();
    loadStats();
  } catch {
    toast("Save failed", "err");
  }
});

theatreReset?.addEventListener("click", () => {
  theatreForm.reset();
  document.getElementById("theatre_id").value = "";
});

theatreSearch?.addEventListener("input", () => {
  const q = theatreSearch.value.toLowerCase();
  document.querySelectorAll("[data-theatre-row]").forEach((row) => {
    const text = row.dataset.search || "";
    row.classList.toggle("hidden", !text.includes(q));
  });
});

async function loadTheatres() {
  try {
    const res = await fetch(`${API_BASE}/theatres`, { headers: authHeaders() });
    const items = await res.json();
    const list = document.getElementById("theatre-list");
    list.innerHTML = items
      .map(
        (t) => `
      <div data-theatre-row data-search="${(t.name + ' ' + (t.city || '')).toLowerCase()}" class="py-3 flex items-center justify-between">
        <div>
          <p class="font-semibold">${t.name}</p>
          <p class="text-sm text-gray-400">${t.city || "—"} · ${t.address || "—"}</p>
        </div>
        <div class="flex gap-2">
          <button class="px-3 py-1 rounded bg-yellow-600 hover:bg-yellow-700" onclick='editTheatre(${JSON.stringify(t).replace(/"/g, "&quot;")})'>Edit</button>
          <button class="px-3 py-1 rounded bg-red-600 hover:bg-red-700" onclick="deleteTheatre(${t.theatre_id})">Delete</button>
        </div>
      </div>`
      )
      .join("");
  } catch {
    toast("Failed to load theatres", "err");
  }
}

window.editTheatre = (t) => {
  document.getElementById("theatre_id").value = t.theatre_id;
  document.getElementById("theatre_name").value = t.name || "";
  document.getElementById("theatre_city").value = t.city || "";
  document.getElementById("theatre_address").value = t.address || "";
};

window.deleteTheatre = async (id) => {
//   if (!confirm("Delete this theatre?")) return;
  try {
    await fetch(`${API_BASE}/admin/theatres/${id}`, { method: "DELETE", headers: authHeaders() });
    toast("Theatre deleted");
    loadTheatres();
    loadStats();
  } catch {
    toast("Delete failed", "err");
  }
};

// ========== shows ==========
const showForm = document.getElementById("show-form");
showForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const theatre_id = +document.getElementById("show_theatre_id").value;
  const tmdb_id = +document.getElementById("show_tmdb_id").value;
  const show_time = document.getElementById("show_time").value;
  const ticket_price = +document.getElementById("show_price").value;

  if (!theatre_id || !tmdb_id || !show_time || !ticket_price)
    return toast("All fields required", "err");

  try {
    await fetch(`${API_BASE}/admin/shows`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ theatre_id, tmdb_id, show_time, ticket_price }),
    });
    toast("Show created");
    loadShows();
    loadStats();
    showForm.reset();
  } catch {
    toast("Failed to create show", "err");
  }
});

async function loadShows() {
  try {
    const res = await fetch(`${API_BASE}/admin/shows`, { headers: authHeaders() });
    const items = await res.json();
    const list = document.getElementById("show-list");
    list.innerHTML = items
      .map(
        (s) => `
      <div class="py-3 flex items-center justify-between">
        <div>
          <p class="font-semibold">Theatre #${s.theatre_id} · TMDB ${s.tmdb_id}</p>
          <p class="text-sm text-gray-400">${new Date(s.show_time).toLocaleString()} · ₹${s.ticket_price}</p>
        </div>
        <button class="px-3 py-1 rounded bg-red-600 hover:bg-red-700" onclick="deleteShow(${s.show_id})">Delete</button>
      </div>`
      )
      .join("");
  } catch {
    toast("Failed to load shows", "err");
  }
}

window.deleteShow = async (id) => {
//   if (!confirm("Delete this show?")) return;
  try {
    await fetch(`${API_BASE}/admin/shows/${id}`, { method: "DELETE", headers: authHeaders() });
    toast("Show deleted");
    loadShows();
    loadStats();
  } catch {
    toast("Delete failed", "err");
  }
};

// ========== movies ==========
const movieForm = document.getElementById("movie-form");
movieForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const tmdb_id = +document.getElementById("movie_tmdb_id").value;
  const title = document.getElementById("movie_title").value.trim();
  const poster_path = document.getElementById("movie_poster").value.trim();

  if (!tmdb_id || !title) return toast("TMDB ID & Title required", "err");

  try {
    await fetch(`${API_BASE}/admin/movies`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ tmdb_id, title, poster_path }),
    });
    toast("Movie saved");
    loadMovies();
    movieForm.reset();
  } catch {
    toast("Movie save failed", "err");
  }
});

async function loadMovies() {
  try {
    const res = await fetch(`${API_BASE}/admin/movies`, { headers: authHeaders() });
    const items = await res.json();
    const list = document.getElementById("movie-list");
    list.innerHTML = items
      .map(
        (m) => `
      <div class="py-3 flex items-center justify-between">
        <div>
          <p class="font-semibold">${m.title}</p>
          <p class="text-sm text-gray-400">TMDB ${m.tmdb_id} · ${m.poster_path || "no poster"}</p>
        </div>
        <button class="px-3 py-1 rounded bg-red-600 hover:bg-red-700" onclick="deleteMovie(${m.tmdb_id})">Delete</button>
      </div>`
      )
      .join("");
  } catch {
    toast("Failed to load movies", "err");
  }
}

window.deleteMovie = async (tmdb_id) => {
  if (!confirm("Delete movie mapping?")) return;
  try {
    await fetch(`${API_BASE}/admin/movies/${tmdb_id}`, { method: "DELETE", headers: authHeaders() });
    toast("Movie deleted");
    loadMovies();
  } catch {
    toast("Delete failed", "err");
  }
};

// ========== bookings ==========
async function loadBookings() {
  try {
    const res = await fetch(`${API_BASE}/admin/bookings`, { headers: authHeaders() });
    const items = await res.json();
    const list = document.getElementById("booking-list");
    list.innerHTML = items
      .map(
        (b) => `
      <div class="py-3 flex items-center justify-between">
        <div>
          <p class="font-semibold">#${b.booking_id} · User ${b.user_id} · TMDB ${b.tmdb_id}</p>
          <p class="text-sm text-gray-400">${b.theatre_name || "Theatre " + b.theatre_id} · ${new Date(b.show_time).toLocaleString()} · Seats: ${tryParseSeats(b.seats)}</p>
        </div>
        <button class="px-3 py-1 rounded bg-red-600 hover:bg-red-700" onclick="adminDeleteBooking(${b.booking_id})">Delete</button>
      </div>`
      )
      .join("");
  } catch {
    toast("Failed to load bookings", "err");
  }
}

function tryParseSeats(s) {
  try {
    const arr = Array.isArray(s) ? s : JSON.parse(s || "[]");
    return arr.join(", ");
  } catch {
    return "—";
  }
}

window.adminDeleteBooking = async (id) => {
//   if (toast("Delete this booking?")) return;
  try {
    await fetch(`${API_BASE}/admin/bookings/${id}`, { method: "DELETE", headers: authHeaders() });
    toast("Booking deleted");
    loadBookings();
    loadStats();
  } catch {
    toast("Delete failed", "err");
  }
};

// ========== users ==========
async function loadUsers() {
  try {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: authHeaders() });
    const items = await res.json();
    const list = document.getElementById("user-list");
    list.innerHTML = items
      .map(
        (u) => `
      <div class="py-3 flex items-center justify-between">
        <div>
          <p class="font-semibold">${u.name || "User"} (${u.email})</p>
          <p class="text-sm text-gray-400">Role: ${u.role || "user"}</p>
        </div>
        <div class="flex gap-2">
          <button class="px-3 py-1 rounded bg-yellow-600 hover:bg-yellow-700" onclick="promoteUser(${u.user_id})">Make Admin</button>
          <button class="px-3 py-1 rounded bg-red-600 hover:bg-red-700" onclick="deleteUser(${u.user_id})">Delete</button>
        </div>
      </div>`
      )
      .join("");
  } catch {
    toast("Failed to load users", "err");
  }
}

window.promoteUser = async (id) => {
  try {
    await fetch(`${API_BASE}/admin/users/${id}/role`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ role: "admin" }),
    });
    toast("User promoted");
    loadUsers();
  } catch {
    toast("Update failed", "err");
  }
};

window.deleteUser = async (id) => {
//   if (!confirm("Delete this user?")) return;
  try {
    await fetch(`${API_BASE}/admin/users/${id}`, { method: "DELETE", headers: authHeaders() });
    toast("User deleted");
    loadUsers();
    loadStats();
  } catch {
    toast("Delete failed", "err");
  }
};
