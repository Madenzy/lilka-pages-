/* Lilka — Business bookings dashboard */
(() => {
  const L = Lilka;
  const $ = (s) => document.querySelector(s);
  const B = L.business;
  const t0 = L.today();
  const STATUS = { confirmed: "Confirmed", pending: "Pending", arrived: "Arrived", cancelled: "Cancelled" };

  const state = { range: "today", selected: null };
  $("#today-label").textContent = L.fmtLong(t0);

  /* ---------- Data ---------- */
  function inRange(b) {
    const d = L.fromISO(b.date);
    if (state.range === "today") return b.date === L.toISO(t0);
    const days = state.range === "week" ? 7 : 31;
    return d >= t0 && d < L.addDays(t0, days);
  }
  const visible = () => L.allBookings().filter(inRange);

  /* ---------- Table ---------- */
  function renderRows() {
    const list = visible();
    const title = { today: "Today’s bookings", week: "Next 7 days", month: "Next 30 days" }[state.range];
    $("#page-title").textContent = title;

    if (state.selected && !list.some((b) => b.id === state.selected)) state.selected = null;
    if (!state.selected) {
      const first = list.find((b) => b.status === "confirmed" || b.status === "pending") || list[0];
      state.selected = first ? first.id : null;
    }

    if (!list.length) {
      $("#rows").innerHTML = `<tr><td colspan="4" class="table-empty">No bookings in this range yet.</td></tr>`;
      return;
    }

    let lastDate = null;
    $("#rows").innerHTML = list.map((b) => {
      const svc = L.serviceById(b.service);
      let head = "";
      if (state.range !== "today" && b.date !== lastDate) {
        lastDate = b.date;
        const d = L.fromISO(b.date);
        head = `<tr class="day-row"><td colspan="4">${b.date === L.toISO(t0) ? "Today · " : ""}${L.esc(L.fmtLong(d))}</td></tr>`;
      }
      return head + `
        <tr class="is-clickable${b.id === state.selected ? " is-selected" : ""}" data-id="${b.id}" tabindex="0" aria-selected="${b.id === state.selected}">
          <td class="t-strong">${L.esc(b.time)}</td>
          <td><span style="font-weight:500">${L.esc(b.name)}</span><span class="t-sub">${L.esc(b.phone)}</span></td>
          <td class="hide-sm">${L.esc(svc.name)}<span class="t-sub">${svc.mins} min</span></td>
          <td><span class="chip chip--${b.status}">${STATUS[b.status]}</span></td>
        </tr>`;
    }).join("");
  }

  function selectRow(id) {
    state.selected = id;
    renderRows();
    renderDetail();
    if (window.innerWidth <= 1100) $("#detail").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  $("#rows").addEventListener("click", (e) => {
    const tr = e.target.closest("tr[data-id]");
    if (tr) selectRow(tr.dataset.id);
  });
  $("#rows").addEventListener("keydown", (e) => {
    const tr = e.target.closest("tr[data-id]");
    if (tr && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); selectRow(tr.dataset.id); }
  });

  /* ---------- Detail panel ---------- */
  function renderDetail() {
    const el = $("#detail");
    const b = L.allBookings().find((x) => x.id === state.selected);
    if (!b) {
      el.innerHTML = `<span class="eyebrow">Selected</span><p class="muted">Pick a booking to see the details.</p>`;
      return;
    }
    const svc = L.serviceById(b.service);
    const visits = L.allBookings().filter((x) => x.name === b.name && x.status !== "cancelled").length;
    const live = b.status !== "cancelled";
    const primary = b.status === "pending" ? ["confirmed", "Confirm booking"]
                  : b.status === "confirmed" ? ["arrived", "Mark as arrived"]
                  : b.status === "arrived" ? ["confirmed", "Undo arrived"]
                  : ["confirmed", "Restore booking"];
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span class="eyebrow">Selected</span>
        <span class="chip chip--${b.status}">${STATUS[b.status]}</span>
      </div>
      <div>
        <div class="detail__name">${L.esc(b.name)}</div>
        <div class="muted" style="font-size:14px;margin-top:2px">${visits > 1 ? "Returning customer" : "New customer"} · ${L.esc(b.ref)}</div>
      </div>
      <dl class="detail__rows">
        <div><dt>Service</dt><dd>${L.esc(svc.name)}</dd></div>
        <div><dt>When</dt><dd>${L.esc(L.fmtShort(L.fromISO(b.date)))}, ${b.time} – ${L.addMins(b.time, svc.mins)}</dd></div>
        <div><dt>Phone</dt><dd><a href="tel:${L.esc(b.phone.replace(/\s/g, ""))}">${L.esc(b.phone)}</a></dd></div>
        ${b.email ? `<div><dt>Email</dt><dd style="word-break:break-all">${L.esc(b.email)}</dd></div>` : ""}
        <div><dt>Price</dt><dd>${L.money(svc.price)}</dd></div>
        <div><dt>Reminder</dt><dd>${b.reminder ? "Text reminder on" : "No reminder"}</dd></div>
      </dl>
      ${b.notes ? `<div class="note">“${L.esc(b.notes)}”</div>` : ""}
      <div class="detail__actions">
        <button class="btn btn-primary" type="button" data-status="${primary[0]}">${primary[1]}</button>
        ${live ? `<div class="row">
          <button class="btn btn-outline btn-sm" type="button" id="do-resched">Reschedule</button>
          <button class="btn btn-danger btn-sm" type="button" data-status="cancelled">Cancel</button>
        </div>` : ""}
      </div>`;
  }

  $("#detail").addEventListener("click", (e) => {
    const s = e.target.closest("[data-status]");
    if (s) {
      L.setBookingStatus(state.selected, s.dataset.status);
      L.toast({ arrived: "Marked as arrived", confirmed: "Booking confirmed", cancelled: "Booking cancelled" }[s.dataset.status]);
      refresh();
      return;
    }
    if (e.target.closest("#do-resched")) openResched();
  });

  /* ---------- Next free slot ---------- */
  function nextFreeSlot() {
    const now = new Date();
    const nowHM = `${L.pad(now.getHours())}:${L.pad(now.getMinutes())}`;
    for (let i = 0; i < 60; i++) {
      const d = L.addDays(t0, i);
      if (!B.openDays.includes(d.getDay())) continue;
      const iso = L.toISO(d);
      const taken = L.takenSlots(iso);
      const slot = B.slots.find((s) => !taken.has(s) && (i > 0 || s > nowHM));
      if (slot) return `${slot} ${i === 0 ? "today" : i === 1 ? "tomorrow" : L.fmtShort(d)}`;
    }
    return "None in 60 days";
  }

  /* ---------- Reschedule ---------- */
  const dlg = $("#resched");
  const rf = $("#resched-form");
  dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest("[data-close]")) dlg.close(); });

  function fillTimes(iso, keep) {
    const sel = rf.elements.time;
    const taken = L.takenSlots(iso);
    const d = L.fromISO(iso);
    if (!B.openDays.includes(d.getDay())) {
      sel.innerHTML = `<option value="">Closed that day</option>`;
      return;
    }
    sel.innerHTML = B.slots.map((s) => {
      const off = taken.has(s) && s !== keep;
      return `<option value="${s}" ${off ? "disabled" : ""} ${s === keep ? "selected" : ""}>${s}${off ? " (taken)" : ""}</option>`;
    }).join("");
  }

  function openResched() {
    const b = L.allBookings().find((x) => x.id === state.selected);
    if (!b) return;
    $("#resched-who").textContent = `${b.name} · currently ${L.fmtLong(L.fromISO(b.date))} at ${b.time}`;
    rf.elements.date.value = b.date;
    rf.elements.date.min = L.toISO(t0);
    fillTimes(b.date, b.time);
    rf.querySelectorAll(".field-error").forEach((x) => (x.textContent = ""));
    dlg.showModal();
  }
  rf.elements.date.addEventListener("change", () => fillTimes(rf.elements.date.value));

  rf.addEventListener("submit", (e) => {
    e.preventDefault();
    const date = rf.elements.date.value;
    const time = rf.elements.time.value;
    const errD = rf.querySelector('[data-for="date"]');
    const errT = rf.querySelector('[data-for="time"]');
    errD.textContent = !date || L.fromISO(date) < t0 ? "Pick today or a later date." : "";
    errT.textContent = !time ? "Pick an open time." : "";
    if (errD.textContent || errT.textContent) return;

    const id = state.selected;
    if (id.startsWith("seed-")) {
      // Demo bookings: store a moved copy and cancel-hide the original.
      const orig = L.allBookings().find((x) => x.id === id);
      L.setBookingStatus(id, "cancelled");
      const moved = { ...orig, id: "b-" + Date.now(), date, time, status: "confirmed", demo: false };
      L.addBooking(moved);
      state.selected = moved.id;
    } else {
      const list = L.store.get("bookings", []);
      const b = list.find((x) => x.id === id);
      if (b) { b.date = date; b.time = time; }
      L.store.set("bookings", list);
    }
    dlg.close();
    L.toast(`Moved to ${L.fmtShort(L.fromISO(date))} at ${time}`);
    refresh();
  });

  /* ---------- Range tabs ---------- */
  $("#range").addEventListener("click", (e) => {
    const b = e.target.closest("[data-range]");
    if (!b) return;
    state.range = b.dataset.range;
    state.selected = null;
    $("#range").querySelectorAll("[data-range]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
    refresh();
  });

  function refresh() {
    renderRows();
    renderDetail();
    $("#next-slot").textContent = nextFreeSlot();
  }

  // Update if a booking is made in another tab
  window.addEventListener("storage", refresh);
  refresh();
})();
