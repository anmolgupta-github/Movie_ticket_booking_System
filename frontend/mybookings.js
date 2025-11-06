const API_BASE = "http://localhost:3000/api";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";
const TMDB_API_KEY = "68e2bfbc4d92fe524178126b4066a5d2";

// 🎬 Load My Bookings
async function loadBookings() {
  const token = localStorage.getItem("token");
  if (!token) {
    document.getElementById("bookings-container").innerHTML =
      `<p class="text-red-400 text-center mt-6">⚠️ Please login to view your bookings.</p>`;
    return;
  }

  const user = JSON.parse(atob(token.split(".")[1]));
  const user_id = user.id;

  try {
    const res = await fetch(`${API_BASE}/bookings/${user_id}`);
    const bookings = await res.json();

    if (!bookings || !bookings.length) {
      document.getElementById("bookings-container").innerHTML =
        `<p class="text-gray-400 text-center mt-6">No bookings found.</p>`;
      return;
    }

    // fetch poster for each movie
    for (let b of bookings) {
      try {
        const movieRes = await fetch(`https://api.themoviedb.org/3/movie/${b.tmdb_id}?api_key=${TMDB_API_KEY}`);
        const movieData = await movieRes.json();
        b.poster_path = movieData.poster_path;
        b.title = movieData.title;
      } catch {
        b.poster_path = null;
        b.title = `TMDB ID: ${b.tmdb_id}`;
      }
    }

    renderBookings(bookings);
  } catch (err) {
    console.error("❌ Error loading bookings:", err);
    document.getElementById("bookings-container").innerHTML =
      `<p class="text-red-400 text-center mt-6">❌ Failed to load your bookings.</p>`;
  }
}

// 🎨 Render bookings in UI
function renderBookings(bookings) {
  const container = document.getElementById("bookings-container");

  container.innerHTML = bookings
    .map((b) => {
      let seats = [];
      try {
        seats = Array.isArray(b.seats) ? b.seats : JSON.parse(b.seats || "[]");
      } catch {
        seats = [];
      }
      const seatDisplay = seats.length ? seats.join(", ") : "N/A";
      const posterUrl = b.poster_path
        ? `${IMG_BASE}${b.poster_path}`
        : "https://via.placeholder.com/120x160?text=No+Image";

      return `
      <div id="booking-${b.booking_id}" 
           class="bg-gray-900 border border-gray-700 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between shadow-lg hover:shadow-blue-500/30 transition">
        
        <div class="flex items-center">
          <img src="${posterUrl}" alt="Poster" 
               class="w-[120px] h-[160px] rounded-xl object-cover mb-4 md:mb-0 md:mr-6" />
          
          <div class="text-center md:text-left space-y-2">
            <h3 class="text-2xl font-bold text-blue-400"> ${b.title || "Unknown Movie"}</h3>
            <p class="text-gray-300"><b>Theatre:</b> ${b.theatre_name || "Unknown"} (${b.theatre_city || "-"})</p>
            <p class="text-gray-300"><b>Show Time:</b> ${new Date(b.show_time).toLocaleString()}</p>
            <p class="text-gray-300"><b>Seats:</b> ${seatDisplay}</p>
            <p class="text-gray-400 text-sm"> Booked At: ${new Date(b.booked_at).toLocaleString()}</p>
          </div>
        </div>

        <div class="flex flex-col gap-2 mt-4 md:mt-0">
          <button onclick="downloadPDF(${b.booking_id})"
                  class="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg transition">
             Download PDF
          </button>

          <button onclick="deleteBooking(${b.booking_id})"
                  class="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg transition">
             Delete
          </button>
        </div>
      </div>`;
    })
    .join("");
}

// 🧾 Download booking as PDF
async function downloadPDF(booking_id) {
  const bookingEl = document.getElementById(`booking-${booking_id}`);
  if (!bookingEl) return;

  const booking = Array.from(document.querySelectorAll("#bookings-container > div"))
    .map((el) => el.id === `booking-${booking_id}` && el)
    .filter(Boolean)[0];

  const title = booking.querySelector("h3").innerText;
  const theatre = booking.querySelector("p:nth-child(2)").innerText;
  const showTime = booking.querySelector("p:nth-child(3)").innerText;
  const seats = booking.querySelector("p:nth-child(4)").innerText;
  const bookedAt = booking.querySelector("p:nth-child(5)").innerText;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(" Movie Ticket", 20, 20);

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(title, 20, 40);
  doc.text(theatre, 20, 50);
  doc.text(showTime, 20, 60);
  doc.text(seats, 20, 70);
  doc.text(bookedAt, 20, 80);

  doc.setDrawColor(59, 130, 246);
  doc.rect(15, 10, 180, 85);

  doc.save(`${title.replace("🎬 ", "").trim()}_Ticket.pdf`);
}

// 🗑️ Delete booking
async function deleteBooking(booking_id) {
  try {
    const res = await fetch(`${API_BASE}/book/${booking_id}`, { method: "DELETE" });
    const data = await res.json();

    if (data.success) {
      const bookingEl = document.getElementById(`booking-${booking_id}`);
      if (bookingEl) {
        bookingEl.classList.add("opacity-0", "transition", "duration-300");
        setTimeout(() => bookingEl.remove(), 300);
      }
      showToast("✅ Booking deleted successfully");
    } else {
      showToast(data.message || "❌ Failed to delete booking", "error");
    }
  } catch (err) {
    console.error("❌ Delete error:", err);
    showToast("Server error while deleting booking", "error");
  }
}

// 🔔 Toast Notification
function showToast(msg, type = "info") {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-3 rounded-lg shadow-lg border text-sm z-50";
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.style.borderColor = type === "error" ? "#ef4444" : "#22c55e";
  toast.classList.remove("hidden", "opacity-0");
  toast.classList.add("opacity-100", "transition", "duration-300");

  setTimeout(() => {
    toast.classList.add("opacity-0");
    setTimeout(() => toast.classList.add("hidden"), 500);
  }, 2000);
}

window.addEventListener("DOMContentLoaded", loadBookings);
