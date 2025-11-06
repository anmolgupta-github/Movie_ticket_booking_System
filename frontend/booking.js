// =============================
// 🎬 Shared Booking Modal Logic (for index.html + movies.html)
// =============================

if (!window.bookingLoaded) {
  window.bookingLoaded = true; // Prevent double loading

  const API_BASE = "http://localhost:3000/api";
  const IMG_BASE = "https://image.tmdb.org/t/p/w500";
  const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";

  let selectedSeats = new Set();
  window.selectedMovie = null;

  // ✅ Open booking modal
  window.openBookingModal = function (movie) {
    if (!movie) return showInlineMessage("Error loading movie", "error");
    window.selectedMovie = movie;

    document.getElementById("booking-title").textContent = `Book: ${movie.title}`;
    document.getElementById("booking-modal").classList.remove("hidden");

    document.getElementById("theatre-select").innerHTML = `<option value="">Select Theatre</option>`;
    document.getElementById("show-select").innerHTML = `<option value="">Select Show Time</option>`;
    document.getElementById("seat-grid").innerHTML = "";
    selectedSeats.clear();

    loadTheatres();
  };

  document.getElementById("close-booking").onclick = () =>
    document.getElementById("booking-modal").classList.add("hidden");

  // ✅ Load theatres
  async function loadTheatres() {
    try {
      const res = await fetch(`${API_BASE}/theatres`);
      const theatres = await res.json();
      const select = document.getElementById("theatre-select");

      select.innerHTML =
        `<option value="">Select Theatre</option>` +
        theatres.map((t) => `<option value="${t.theatre_id}">${t.name}</option>`).join("");

      select.onchange = (e) => {
        const theatre_id = e.target.value;
        if (theatre_id) loadShows(theatre_id);
      };
    } catch (err) {
      console.error("Error loading theatres:", err);
      showInlineMessage("⚠️ Failed to load theatres", "error");
    }
  }

  // ✅ Load shows
  async function loadShows(theatre_id) {
    const tmdb_id = window.selectedMovie?.id;
    try {
      const res = await fetch(`${API_BASE}/theatres/shows/${theatre_id}?tmdb_id=${tmdb_id}`);
      let shows = await res.json();

      if (!shows.length) {
        shows = [
          { show_id: 1, show_time: new Date(Date.now() + 2 * 3600000), ticket_price: 250 },
          { show_id: 2, show_time: new Date(Date.now() + 5 * 3600000), ticket_price: 300 },
        ];
      }

      const select = document.getElementById("show-select");
      select.innerHTML =
        `<option value="">Select Show Time</option>` +
        shows
          .map(
            (s) =>
              `<option value="${s.show_id}">
                ${new Date(s.show_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })} — ₹${s.ticket_price}
              </option>`
          )
          .join("");

      generateSeats(25);
    } catch (err) {
      console.error("Error loading shows:", err);
      showInlineMessage("⚠️ Failed to load showtimes", "error");
    }
  }

  // ✅ Generate seats
  function generateSeats(count) {
    const grid = document.getElementById("seat-grid");
    selectedSeats = new Set();
    grid.innerHTML = "";

    for (let i = 1; i <= count; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.className =
        "h-9 text-sm rounded-md px-2 bg-gray-700 text-white hover:bg-blue-600 transition border border-gray-600";
      btn.onclick = () => {
        if (selectedSeats.has(i)) {
          selectedSeats.delete(i);
          btn.classList.remove("bg-blue-600");
          btn.classList.add("bg-gray-700");
        } else {
          selectedSeats.add(i);
          btn.classList.remove("bg-gray-700");
          btn.classList.add("bg-blue-600");
        }
      };
      grid.appendChild(btn);
    }
  }

  // ✅ Confirm booking
  async function confirmBooking() {
    const token = localStorage.getItem("token");
    if (!token) return showInlineMessage("Please login first!", "error");

    const user = JSON.parse(atob(token.split(".")[1]));
    const user_id = user.id;
    const theatre_id = document.getElementById("theatre-select").value;
    const show_id = document.getElementById("show-select").value;
    const seats = [...selectedSeats];

    if (!theatre_id || !show_id || !seats.length)
      return showInlineMessage("⚠️ Please select theatre, showtime, and seats.", "error");

    const body = {
      user_id,
      tmdb_id: window.selectedMovie.id,
      theatre_id,
      show_id,
      selected_seats: seats,
    };

    try {
      const res = await fetch(`${API_BASE}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        showInlineMessage("🎟️ Booking Confirmed! Redirecting...", "success");
        setTimeout(() => (window.location.href = "mybookings.html"), 1500);
      } else {
        showInlineMessage(data.message || "❌ Booking failed!", "error");
      }
    } catch (err) {
      console.error("Booking Error:", err);
      showInlineMessage("Server error. Try again!", "error");
    }
  }

  // ✅ Inline message
  function showInlineMessage(msg, type = "info") {
    let box = document.getElementById("booking-msg");
    if (!box) {
      box = document.createElement("div");
      box.id = "booking-msg";
      const confirmBtn = document.getElementById("confirm-booking");
      confirmBtn.insertAdjacentElement("afterend", box);
    }
    box.textContent = msg;
    box.className =
      "text-center mt-3 font-medium " +
      (type === "success" ? "text-green-400" : type === "error" ? "text-red-400" : "text-gray-400");
  }

  // ✅ Attach confirm click
  const confirmBtn = document.getElementById("confirm-booking");
  if (confirmBtn) confirmBtn.addEventListener("click", confirmBooking);
}
