/* ==========================================================================
   Lilka — shared data and helpers
   Front end only: there is no server. Bookings and ticket orders are saved
   in the browser (localStorage) so the dashboards update as you use the site.
   Edit the data below to change services, prices, events and tickets.
   ========================================================================== */

const Lilka = (() => {
  /* ------------------------------------------------------------------------
     Business details (appointments)
     ------------------------------------------------------------------------ */
  const business = {
    name: "Lilka Studio",
    address: "12 High Street, Unit 4",
    openDays: [1, 2, 3, 4, 5, 6],          // 0 = Sunday … 6 = Saturday
    slots: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
            "13:00", "13:30", "14:00", "14:30", "15:30", "16:30"],
    bookAheadMonths: 3
  };

  const services = [
    { id: "consult",  name: "Consultation",         mins: 30, price: 25, desc: "A first chat to understand what you need." },
    { id: "standard", name: "Standard appointment", mins: 60, price: 45, desc: "Our most-booked option for regular visits." },
    { id: "extended", name: "Extended appointment", mins: 90, price: 65, desc: "Extra time for bigger jobs or first full sessions." },
    { id: "followup", name: "Follow-up",            mins: 20, price: 15, desc: "A quick check-in after a previous visit." }
  ];

  /* ------------------------------------------------------------------------
     Events
     `sold` is how many were sold before you opened the site (demo data).
     ------------------------------------------------------------------------ */
  const events = [
    {
      id: "afrobeats-rooftop",
      title: "Afrobeats Rooftop Night",
      cat: "Music",
      img: "images/afrobeats.jpg", hero: "images/afrobeats-hero.jpg", pos: "center 40%",
      alt: "Crowd dancing in a lit square at night",
      date: "2026-10-03", start: "20:00", end: "01:00", doors: "19:30",
      venue: "The Rooftop", area: "City centre", address: "45 Skyline Way, top floor",
      host: "Sound & Sun Collective",
      about: [
        "A night of Afrobeats, amapiano and good company under the open sky. Resident DJs play from sunset, with food stalls on the terrace until late.",
        "18+ with ID. Covered area available if the weather turns."
      ],
      tags: ["18+", "Step-free access", "E-tickets on your phone", "Refunds up to 7 days before"],
      tickets: [
        { id: "early", name: "Early bird",        price: 12, cap: 40,  sold: 40, desc: "First 40 tickets" },
        { id: "ga",    name: "General admission", price: 15, cap: 142, sold: 84, desc: "Entry all night" },
        { id: "vip",   name: "VIP terrace",       price: 30, cap: 18,  sold: 14, desc: "Reserved seating + drink" }
      ]
    },
    {
      id: "street-food-sunday",
      title: "Street Food Sunday",
      cat: "Food & drink",
      img: "images/street-food.jpg", pos: "center 55%",
      alt: "Wraps being topped at a street food stall",
      date: "2026-10-04", start: "12:00", end: "18:00",
      venue: "Market Square", area: "Town centre", address: "Market Square",
      host: "Eat Local",
      about: [
        "Twenty traders, one square. Jollof, birria tacos, bao, sadza and stew, vegan bowls and proper coffee.",
        "Free to get in. Register so we know how many to expect, then pay traders on the day."
      ],
      tags: ["Family friendly", "Dogs welcome", "Card and cash"],
      tickets: [{ id: "free", name: "Free entry", price: 0, cap: 500, sold: 212, desc: "Register to save your spot" }]
    },
    {
      id: "web-design-workshop",
      title: "Intro to Web Design Workshop",
      cat: "Workshops",
      img: "images/web-design.jpg", pos: "center",
      alt: "Laptop showing code on a desk",
      date: "2026-10-07", start: "18:30", end: "21:00", doors: "18:15",
      venue: "Makers Hub", area: "Innovation quarter", address: "Makers Hub, Studio 2",
      host: "Makers Hub",
      about: [
        "Build your first web page from scratch with HTML and CSS. No experience needed, just bring a laptop.",
        "You’ll leave with a live one-page site and a cheat sheet to keep going."
      ],
      tags: ["Beginners welcome", "Bring a laptop", "Snacks included"],
      tickets: [
        { id: "std",     name: "Standard",       price: 10, cap: 24, sold: 12, desc: "Workshop place" },
        { id: "student", name: "Student",        price: 6,  cap: 6,  sold: 6,  desc: "Valid student ID" }
      ]
    },
    {
      id: "open-mic-poetry",
      title: "Open Mic & Poetry Night",
      cat: "Music",
      img: "images/open-mic.jpg", pos: "center",
      alt: "Microphone on a stand under warm stage light",
      date: "2026-10-08", start: "19:30", end: "22:30", doors: "19:00",
      venue: "Back Room Café", area: "Old town", address: "8 Mill Lane",
      host: "Back Room Café",
      about: [
        "Songs, spoken word and the occasional comedy set. Sign up on the night for a 5-minute slot or just come to listen.",
        "Hot drinks and cakes served all evening."
      ],
      tags: ["All ages", "Performer slots on the night"],
      tickets: [{ id: "entry", name: "Entry", price: 5, cap: 60, sold: 30, desc: "Includes a hot drink" }]
    },
    {
      id: "community-5k",
      title: "Community 5K Fun Run",
      cat: "Sport",
      img: "images/fun-run.jpg", pos: "center 60%",
      alt: "Runner in motion past a fountain",
      date: "2026-10-10", start: "09:00", end: "11:30",
      venue: "Lakeside Park", area: "Lakeside", address: "Lakeside Park, main gate",
      host: "Run Together Club",
      about: [
        "A flat, friendly loop around the lake. Run it, jog it or walk it. Every finisher gets a medal.",
        "Entry fees go to the local food bank."
      ],
      tags: ["All abilities", "Medal for finishers", "Chip timing"],
      tickets: [
        { id: "adult", name: "Adult",        price: 5, cap: 200, sold: 72, desc: "16 and over" },
        { id: "child", name: "Under 16",     price: 2, cap: 60,  sold: 18, desc: "With an adult" }
      ]
    },
    {
      id: "neighbourhood-clean-up",
      title: "Neighbourhood Clean-up",
      cat: "Community",
      img: "images/clean-up.jpg", pos: "center 30%",
      alt: "Volunteer smiling while others collect litter in woodland",
      date: "2026-10-17", start: "10:00", end: "13:00",
      venue: "Riverside Park", area: "Riverside", address: "Riverside Park, café car park",
      host: "Friends of Riverside",
      about: [
        "Help us clear the riverbank before winter. Gloves, pickers and bags provided.",
        "Tea and biscuits at the café afterwards for everyone who helps."
      ],
      tags: ["Family friendly", "Equipment provided", "Wear boots"],
      tickets: [{ id: "vol", name: "Volunteer", price: 0, cap: 80, sold: 31, desc: "Register so we bring enough kit" }]
    }
  ];

  const categories = ["All", "Music", "Food & drink", "Workshops", "Sport", "Community"];

  /* ------------------------------------------------------------------------
     Storage (safe: works even if the browser blocks localStorage)
     ------------------------------------------------------------------------ */
  const PREFIX = "lilka.";
  const memory = {};
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        if (raw !== null) return JSON.parse(raw);
      } catch (e) { /* ignore */ }
      return key in memory ? memory[key] : fallback;
    },
    set(key, value) {
      memory[key] = value;
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) { /* ignore */ }
    },
    clear() {
      Object.keys(memory).forEach((k) => delete memory[k]);
      try {
        Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => localStorage.removeItem(k));
      } catch (e) { /* ignore */ }
    }
  };

  /* ------------------------------------------------------------------------
     Dates and formatting
     ------------------------------------------------------------------------ */
  const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July",
                  "August", "September", "October", "November", "December"];

  const pad = (n) => String(n).padStart(2, "0");
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

  const fmtLong = (d) => `${DOW[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const fmtLongYear = (d) => `${fmtLong(d)} ${d.getFullYear()}`;
  const fmtShort = (d) => `${DOW[d.getDay()].slice(0, 3)} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;

  const money = (n) => (n === 0 ? "Free" : "£" + (Number.isInteger(n) ? n : n.toFixed(2)));
  const money2 = (n) => "£" + n.toFixed(2);
  const moneyWhole = (n) => "£" + Math.round(n).toLocaleString("en-GB");

  const addMins = (hhmm, mins) => {
    const [h, m] = hhmm.split(":").map(Number);
    const t = h * 60 + m + mins;
    return `${pad(Math.floor(t / 60) % 24)}:${pad(t % 60)}`;
  };

  const ago = (ts) => {
    const mins = Math.round((Date.now() - ts) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
    const days = Math.round(hrs / 24);
    return days === 1 ? "Yesterday" : `${days} days ago`;
  };

  const ref = () => "LK-" + Math.random().toString(36).slice(2, 8).toUpperCase();

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ------------------------------------------------------------------------
     Appointments
     ------------------------------------------------------------------------ */
  const serviceById = (id) => services.find((s) => s.id === id);

  // Demo bookings, always placed around today so the dashboard has something in it.
  function seedBookings() {
    const t = today();
    const day = (n) => toISO(addDays(t, n));
    const rows = [
      [0, "09:00", "Farai Ndlovu",      "07700 900118", "consult",  "arrived"],
      [0, "09:30", "Amelia Hart",       "07700 900245", "followup", "arrived"],
      [0, "10:30", "Rutendo Chikwanha", "07700 900412", "standard", "confirmed", "Running 5 minutes late possibly, traffic on the A5."],
      [0, "11:30", "James Okafor",      "07700 900587", "extended", "confirmed"],
      [0, "13:30", "Priya Shah",        "07700 900633", "standard", "pending"],
      [0, "14:30", "Tom Barker",        "07700 900790", "consult",  "cancelled"],
      [0, "15:00", "Chipo Mutasa",      "07700 900851", "followup", "confirmed"],
      [0, "16:30", "Leah Collins",      "07700 900964", "standard", "pending"],
      [1, "10:00", "Kwame Asante",      "07700 900301", "consult",  "confirmed"],
      [1, "13:00", "Sophie Turner",     "07700 900377", "extended", "confirmed"],
      [2, "09:30", "Tinashe Moyo",      "07700 900520", "standard", "pending"],
      [3, "11:00", "Hannah Lee",        "07700 900611", "followup", "confirmed"],
      [5, "14:00", "Marcus Bell",       "07700 900702", "standard", "confirmed"],
      [9, "10:30", "Aisha Bello",       "07700 900815", "extended", "confirmed"]
    ];
    return rows.map(([d, time, name, phone, service, status, notes], i) => ({
      id: "seed-" + i, ref: "LK-DEMO" + i, date: day(d), time, name, phone, email: "",
      service, status, notes: notes || "", reminder: true, demo: true
    }));
  }

  function allBookings() {
    const overrides = store.get("bookingStatus", {});
    return seedBookings()
      .concat(store.get("bookings", []))
      .map((b) => ({ ...b, status: overrides[b.id] || b.status }))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }

  function addBooking(b) {
    const list = store.get("bookings", []);
    list.push(b);
    store.set("bookings", list);
  }

  function setBookingStatus(id, status) {
    const o = store.get("bookingStatus", {});
    o[id] = status;
    store.set("bookingStatus", o);
  }

  function takenSlots(dateISO) {
    // A few slots are "taken" by other customers (stable per day), plus real bookings.
    const d = fromISO(dateISO);
    const n = d.getDate() + d.getMonth() * 31;
    const len = business.slots.length;
    const fake = [(n * 3) % len, (n * 7 + 2) % len, (n + 5) % len].map((i) => business.slots[i]);
    const real = allBookings().filter((b) => b.date === dateISO && b.status !== "cancelled").map((b) => b.time);
    return new Set(fake.concat(real));
  }

  /* ------------------------------------------------------------------------
     Events and orders
     ------------------------------------------------------------------------ */
  const eventById = (id) => events.find((e) => e.id === id);

  function seedOrders() {
    const now = Date.now();
    const m = 60000;
    return [
      ["Kuda Moyo",    4,      { ga: 2 },  "paid"],
      ["Ella Brooks",  22,     { vip: 1 }, "paid"],
      ["Tariq Ahmed",  60,     { ga: 3 },  "paid"],
      ["Nyasha Dube",  130,    { vip: 2 }, "paid"],
      ["Sam Carter",   1500,   { ga: 1 },  "refunded"],
      ["Grace Mensah", 1620,   { ga: 4 },  "paid"],
      ["Olu Adeyemi",  1750,   { ga: 2 },  "paid"]
    ].map(([name, minsAgo, items, status], i) => ({
      id: "seed-o" + i, ref: "LK-ORD" + i, eventId: "afrobeats-rooftop", name, email: "",
      items, total: totalFor(eventById("afrobeats-rooftop"), items), status, createdAt: now - minsAgo * m, demo: true
    }));
  }

  function totalFor(ev, items) {
    return ev.tickets.reduce((sum, t) => sum + (items[t.id] || 0) * t.price, 0);
  }

  function allOrders(eventId) {
    const checkins = store.get("checkins", {});
    return store.get("orders", []).concat(seedOrders())
      .filter((o) => !eventId || o.eventId === eventId)
      .map((o) => ({ ...o, checkedIn: !!checkins[o.id] }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  function addOrder(o) {
    const list = store.get("orders", []);
    list.push(o);
    store.set("orders", list);
  }

  function setCheckin(orderId, value) {
    const c = store.get("checkins", {});
    if (value) c[orderId] = true; else delete c[orderId];
    store.set("checkins", c);
  }

  // Tickets bought on this browser (seed orders are already in `sold`).
  function boughtHere(ev, typeId) {
    return store.get("orders", [])
      .filter((o) => o.eventId === ev.id && o.status === "paid")
      .reduce((s, o) => s + (o.items[typeId] || 0), 0);
  }

  function ticketState(ev) {
    return ev.tickets.map((t) => {
      const sold = t.sold + boughtHere(ev, t.id);
      const left = Math.max(0, t.cap - sold);
      return { ...t, sold, left, soldOut: left === 0 };
    });
  }

  function eventSummary(ev) {
    const tickets = ticketState(ev);
    const open = tickets.filter((t) => !t.soldOut);
    const prices = (open.length ? open : tickets).map((t) => t.price);
    const min = Math.min(...prices);
    const isFree = tickets.every((t) => t.price === 0);
    const left = tickets.reduce((s, t) => s + t.left, 0);
    const cap = tickets.reduce((s, t) => s + t.cap, 0);
    const sold = tickets.reduce((s, t) => s + t.sold, 0);
    const d = fromISO(ev.date);
    const priceLabel = isFree ? "Free" : (new Set(prices).size > 1 ? "From " + money(min) : money(min));
    const leftLabel = left === 0 ? "Sold out" : (isFree ? `${left} places` : `${left} left`);
    return { tickets, isFree, left, cap, sold, priceLabel, leftLabel, low: left > 0 && left <= 20,
             date: d, whenLabel: `${fmtShort(d)} · ${ev.start}` };
  }

  /* ------------------------------------------------------------------------
     UI helpers
     ------------------------------------------------------------------------ */
  function toast(msg) {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("is-visible");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("is-visible"), 2800);
  }

  function initNav() {
    const btn = document.querySelector(".nav-toggle");
    const nav = document.querySelector(".site-nav");
    if (!btn || !nav) return;
    btn.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
    });
  }

  function initYear() {
    document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
  }

  function initResetDemo() {
    // Two-tap confirm built into the page (no browser confirm dialog needed)
    document.querySelectorAll("[data-reset-demo]").forEach((el) => {
      const label = el.textContent;
      el.addEventListener("click", (e) => {
        e.preventDefault();
        if (el.dataset.armed) {
          store.clear();
          location.reload();
          return;
        }
        el.dataset.armed = "1";
        el.textContent = "Tap again to clear";
        setTimeout(() => { delete el.dataset.armed; el.textContent = label; }, 3000);
      });
    });
  }

  // Download an .ics file so the customer can add the booking to their calendar.
  function downloadICS({ title, dateISO, start, mins, location, description }) {
    const [y, m, d] = dateISO.split("-");
    const s = start.replace(":", "") + "00";
    const e = addMins(start, mins).replace(":", "") + "00";
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Lilka//Bookings//EN", "BEGIN:VEVENT",
      `UID:${ref()}@lilka.app`, `DTSTAMP:${stamp}`,
      `DTSTART:${y}${m}${d}T${s}`, `DTEND:${y}${m}${d}T${e}`,
      `SUMMARY:${title}`, `LOCATION:${location}`, `DESCRIPTION:${description}`,
      "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "lilka-booking.ics" });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  document.addEventListener("DOMContentLoaded", () => { initNav(); initYear(); initResetDemo(); });

  return {
    business, services, events, categories, store,
    DOW, MONTHS, pad, toISO, fromISO, today, addDays, fmtLong, fmtLongYear, fmtShort,
    money, money2, moneyWhole, addMins, ago, ref, esc,
    serviceById, allBookings, addBooking, setBookingStatus, takenSlots,
    eventById, totalFor, allOrders, addOrder, setCheckin, ticketState, eventSummary,
    toast, downloadICS
  };
})();
