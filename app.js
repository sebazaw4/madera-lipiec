    start: "15:30",
    end: "18:30",
    color: "#ea580c",
    placeId: "pr8",
    note: "Rezerwacja: 2026-07-06 15:30.",
  },
  {
    id: "flight-out",
    title: "Lot Madeira -> Katowice",
    date: "2026-07-08",
    start: "17:40",
    end: "23:30",
    color: "#dc2626",
    placeId: "airport",
    note: "Wylot z Madery o 17:40, przylot do Katowic o 23:30.",
  },
  {
    id: "pico-ruivo",
    title: "PR1.2 Vereda do Pico Ruivo",
    date: "2026-07-07",
    start: "15:00",
    end: "17:00",
    color: "#7c3aed",
    placeId: "pico-ruivo",
    note: "Rezerwacja: 2026-07-07 15:00.",
  },
  {
    id: "pico-areeiro",
    title: "PR1 Pico do Areeiro",
    date: "2026-07-07",
    start: "19:00",
    end: "21:00",
    color: "#f59e0b",
    placeId: "pico-areeiro",
    note: "Oryginalnie 17:00; na stronie ustawione około 19:00.",
  },
  {
    id: "funchal-evening",
    title: "Zwiedzanie Funchal",
    date: "2026-07-02",
    start: "18:30",
    end: "21:30",
    color: "#0891b2",
    placeId: "funchal",
    note: "Wieczorny spacer po Funchal.",
  },
  {
    id: "fanal",
    title: "Las Fanal",
    date: "2026-07-03",
    start: "08:30",
    end: "11:00",
    color: "#15803d",
    placeId: "fanal",
    note: "Poranny wyjazd do lasu Fanal.",
  },
  {
    id: "seixal-beach",
    title: "Seixal - czarna plaza",
    date: "2026-07-03",
    start: "12:00",
    end: "14:00",
    color: "#0f766e",
    placeId: "seixal-beach",
    note: "Po Fanal, orientacyjnie w poludnie.",
  },
  {
    id: "seixal-pools",
    title: "Seixal Piscinas Naturais",
    date: "2026-07-03",
    start: "14:15",
    end: "16:00",
    color: "#0284c7",
    placeId: "seixal-pools",
    note: "Naturalne baseny w Seixal.",
  },
  {
    id: "jardim-paul-evening",
    title: "Jardim do Mar i Paul do Mar",
    date: "2026-07-03",
    start: "18:30",
    end: "21:00",
    color: "#db2777",
    placeId: "jardim-mar",
    note: "Wieczorem Jardim do Mar, potem Paul do Mar.",
  },
];

const blockedTimes = [
  { date: "2026-07-01", start: "06:00", end: "12:50", label: "Przed wylotem z Polski" },
  { date: "2026-07-08", start: "23:30", end: "24:00", label: "Po powrocie do Polski" },
];

const calendarEl = document.querySelector("#calendar");
const placeListEl = document.querySelector("#placeList");
const detailsContent = document.querySelector("#detailsContent");
const detailsEmpty = document.querySelector("#detailsEmpty");
const nowButton = document.querySelector("#nowButton");
const mapFallback = document.querySelector("#mapFallback");

let selectedEventId = null;
let map = null;
let markers = new Map();

function minutes(time) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function blockOrEventPosition(item) {
  const dayStart = 6 * 60;
  const dayEnd = 24 * 60;
  const start = Math.max(minutes(item.start), dayStart);
  const end = Math.min(minutes(item.end), dayEnd);
  return {
    top: ((start - dayStart) / 60) * 72,
    height: Math.max(((end - start) / 60) * 72, 18),
  };
}

function getPlace(placeId) {
  return places.find((place) => place.id === placeId);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDay(date) {
  const day = tripDays.find((item) => item.date === date);
  return day ? `${day.weekday}, ${day.label}.2026` : date;
}

function renderCalendar() {
  calendarEl.innerHTML = "";
  const corner = document.createElement("div");
  corner.className = "corner";
  calendarEl.append(corner);

  tripDays.forEach((day) => {
    const header = document.createElement("div");
    header.className = "day-header";
    header.innerHTML = `<strong>${day.label}</strong><span>${day.weekday}</span>`;
    calendarEl.append(header);
  });

  const timeLabels = document.createElement("div");
  timeLabels.className = "time-labels";
  for (let hour = 6; hour < 24; hour += 1) {
    const label = document.createElement("div");
    label.className = "time-label";
    label.textContent = `${String(hour).padStart(2, "0")}:00`;
    timeLabels.append(label);
  }
  calendarEl.append(timeLabels);

  tripDays.forEach((day) => {
    const column = document.createElement("div");
    column.className = "day-column";
    column.dataset.date = day.date;

    blockedTimes
      .filter((item) => item.date === day.date)
      .forEach((item) => column.append(createBlockedElement(item)));

    events
      .filter((event) => event.date === day.date)
      .sort((a, b) => minutes(a.start) - minutes(b.start))
      .forEach((event) => column.append(createEventElement(event)));

    calendarEl.append(column);
  });
}

function createBlockedElement(item) {
  const block = document.createElement("div");
  const { top, height } = blockOrEventPosition(item);
  block.className = "blocked-time";
  block.style.top = `${top}px`;
  block.style.height = `${height}px`;
  block.title = `${item.label}: ${item.start} - ${item.end}`;
  block.innerHTML = `<span>${escapeHtml(item.label)}</span>`;
  return block;
}

function createEventElement(event) {
  const item = document.createElement("button");
  const { top, height } = blockOrEventPosition(event);
  item.type = "button";
  item.className = `event${event.id === selectedEventId ? " selected" : ""}`;
  item.style.setProperty("--event-color", event.color);
  item.style.top = `${top}px`;
  item.style.height = `${height}px`;
  item.innerHTML = `<span class="event-title">${escapeHtml(event.title)}</span><span class="event-time">${event.start} - ${event.end}</span>`;
  item.addEventListener("click", () => selectEvent(event.id));
  return item;
}

function renderPlaceList(activePlaceId) {
  placeListEl.innerHTML = places
    .map((place) => {
      const active = place.id === activePlaceId ? " active" : "";
      return `<button type="button" class="place-button${active}" data-place-id="${place.id}">
        <span>${place.emoji}</span>
        <span><strong>${escapeHtml(place.name)}</strong><small>Dojazd z Calhety: ${place.drive}</small></span>
      </button>`;
    })
    .join("");

  placeListEl.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => focusPlace(button.dataset.placeId));
  });
}

function initMap() {
  if (!window.L) {
    mapFallback.hidden = false;
    renderPlaceList(null);
    return;
  }

  map = L.map("map", { scrollWheelZoom: false }).setView([32.743, -17], 10);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap",
  }).addTo(map);

  places.forEach((place) => {
    const marker = L.marker([place.lat, place.lng], {
      title: place.name,
      icon: createPlaceIcon(place, false),
    })
      .addTo(map)
      .bindPopup(`${place.emoji} ${escapeHtml(place.name)}<br>Dojazd z Calhety: ${place.drive}`);
    markers.set(place.id, marker);
  });

  renderPlaceList(null);
}

function createPlaceIcon(place, active) {
  return L.divIcon({
    className: `emoji-marker${active ? " active" : ""}`,
    html: `<span>${place.emoji}</span>`,
    iconSize: active ? [42, 42] : [34, 34],
