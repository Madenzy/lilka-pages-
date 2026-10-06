/* Lilka — Appointment booking flow */
(() => {
  const L = Lilka;
  const $ = (s) => document.querySelector(s);
  const B = L.business;

  const state = { step: 1, service: null, date: null, time: null, view: null, last: null };
  const start = L.today();
  state.view = new Date(start.getFullYear(), start.getMonth(), 1);
  const maxView = new Date(start.getFullYear(), start.getMonth() + B.bookAheadMonths - 1, 1);

  $("#biz-address").textContent = `${B.name}, ${B.address}`;

  /* ---------- Progress steps ---------- */
  const LABELS = ["Service", "Date & time", "Your details", "Confirmed"];
  function renderSteps() {
    $("#steps").innerHTML = LABELS.map((l, i) => {
      const n = i + 1;
      const cls = n === state.step ? "is-current" : n < state.step ? "is-done" : "";
      return `<li class="${cls}"${n === state.step ? ' aria-current="step"' : ""}><span class="num">${n < state.step ? "✓" : n}</span>${l}</li>`;
    }).join("");
  }

  /* ---------- Step 1: services ---------- */
  function renderServices() {
    $("#services").innerHTML = L.services.map((s) => `
      <button type="button" class="service" role="radio" data-id="${s.id}" aria-checked="${state.service === s.id}">
        <span class="service__top"><span class="service__name">${L.esc(s.name)}</span><span class="service__price">${L.money(s.price)}</span></span>
        <span class="service__dur">${s.mins} min</span>
        <span class="service__desc">${L.esc(s.desc)}</span>
      </button>`).join("");
  }
  $("#services").addEventListener("click", (e) => {
    const b = e.target.closest(".service");
    if (!b) return;
    state.service = b.dataset.id;
    renderServices();
    $(`.service[data-id="${state.service}"]`).focus();
    update();
  });

  /* ---------- Step 2: calendar + times ---------- */
  const isOpen = (d) => B.openDays.includes(d.getDay());

  function renderCalendar() {
    const y = state.view.getFullYear(), m = state.view.getMonth();
    $("#month-label").textContent = `${L.MONTHS[m]} ${y}`;
    $("#prev-month").disabled = state.view <= new Date(start.getFullYear(), start.getMonth(), 1);
    $("#next-month").disabled = state.view >= maxView;

    const first = new Date(y, m, 1);
    const lead = (first.getDay() + 6) % 7;             // Monday-first grid
    const daysIn = new Date(y, m + 1, 0).getDate();
    let html = "";
    for (let i = 0; i < lead; i++) html += `<span class="day is-blank" aria-hidden="true"></span>`;
    for (let d = 1; d <= daysIn; d++) {
      const date = new Date(y, m, d);
      const iso = L.toISO(date);
      const past = date < start;
      const closed = !isOpen(date);
      const full = !past && !closed && L.takenSlots(iso).size >= B.slots.length;
      const off = past || closed || full;
      const cls = ["day", closed ? "is-closed" : "", iso === L.toISO(start) ? "is-today" : ""].join(" ").trim();
      const label = `${L.fmtLong(date)}${closed ? ", closed" : past ? ", unavailable" : full ? ", fully booked" : ""}`;
      html += `<button type="button" class="${cls}" data-date="${iso}" aria-label="${label}" aria-pressed="${state.date === iso}" ${off ? "disabled" : ""}>${d}</button>`;
    }
    $("#days").innerHTML = html;
  }

  function renderTimes() {
    const wrap = $("#times");
    if (!state.date) {
      $("#times-label").textContent = "Choose a day to see times";
      wrap.innerHTML = B.slots.map((t) => `<button type="button" class="time" disabled>${t}</button>`).join("");
      return;
    }
    const taken = L.takenSlots(state.date);
    const isToday = state.date === L.toISO(start);
    const now = new Date();
    const nowHM = `${L.pad(now.getHours())}:${L.pad(now.getMinutes())}`;
    $("#times-label").textContent = "Available on " + L.fmtLong(L.fromISO(state.date));
    wrap.innerHTML = B.slots.map((t) => {
      const off = taken.has(t) || (isToday && t <= nowHM);
      return `<button type="button" class="time" data-time="${t}" aria-pressed="${state.time === t}" ${off ? 'disabled aria-label="' + t + ', taken"' : ""}>${t}</button>`;
    }).join("");
  }

  $("#days").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-date]");
    if (!b || b.disabled) return;
    state.date = b.dataset.date;
    state.time = null;
    renderCalendar(); renderTimes(); update();
    $(`button[data-date="${state.date}"]`).focus();
  });
  $("#times").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-time]");
    if (!b || b.disabled) return;
    state.time = b.dataset.time;
    renderTimes(); update();
    $(`button[data-time="${state.time}"]`).focus();
  });
  $("#prev-month").addEventListener("click", () => { state.view = new Date(state.view.getFullYear(), state.view.getMonth() - 1, 1); renderCalendar(); });
  $("#next-month").addEventListener("click", () => { state.view = new Date(state.view.getFullYear(), state.view.getMonth() + 1, 1); renderCalendar(); });

  /* ---------- Step 3: details ---------- */
  const form = $("#details");
  function validate() {
    const f = form.elements;
    const errors = {};
    if (f.name.value.trim().length < 2) errors.name = "Enter your full name.";
    if (f.phone.value.replace(/\D/g, "").length < 10) errors.phone = "Enter a phone number we can text.";
    if (!/^\S+@\S+\.\S+$/.test(f.email.value.trim())) errors.email = "Enter a valid email address.";
    form.querySelectorAll(".field-error").forEach((el) => {
      const k = el.dataset.for;
      el.textContent = errors[k] || "";
      f[k].setAttribute("aria-invalid", errors[k] ? "true" : "false");
    });
    const first = Object.keys(errors)[0];
    if (first) f[first].focus();
    return !first;
  }
  form.addEventListener("submit", (e) => { e.preventDefault(); next(); });

  /* ---------- Summary + navigation ---------- */
  function setSum(id, val) {
    const el = $(id);
    el.textContent = val || "Not chosen yet";
    el.classList.toggle("is-empty", !val);
  }

  function blocked() {
    return (state.step === 1 && !state.service) || (state.step === 2 && !(state.date && state.time));
  }

  function update() {
    const svc = L.serviceById(state.service);
    setSum("#sum-service", svc && `${svc.name} · ${svc.mins} min`);
    setSum("#sum-date", state.date && L.fmtLong(L.fromISO(state.date)));
    setSum("#sum-time", state.time && `${state.time} – ${L.addMins(state.time, svc ? svc.mins : 0)}`);
    $("#sum-price").textContent = svc ? L.money(svc.price) : "—";

    const nextBtn = $("#next");
    nextBtn.disabled = blocked();
    nextBtn.textContent = state.step === 3 ? "Confirm booking" : "Continue";
    $("#back").hidden = state.step === 1;
    $("#step-nav").hidden = state.step === 4;
    $("#step-nav").style.display = state.step === 4 ? "none" : "";
  }

  function go(step) {
    state.step = step;
    document.querySelectorAll(".step-panel").forEach((p) => { p.hidden = Number(p.dataset.step) !== step; });
    renderSteps();
    if (step === 2) { renderCalendar(); renderTimes(); }
    update();
    const h = document.querySelector(`.step-panel[data-step="${step}"] h1`);
    h && h.focus({ preventScroll: true });
    if (window.scrollY > 120) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function next() {
    if (blocked()) return;
    if (state.step === 3) {
      if (!validate()) return;
      confirmBooking();
      return;
    }
    go(state.step + 1);
  }

  function confirmBooking() {
    const f = form.elements;
    // Last check that nobody grabbed the slot in another tab
    if (L.takenSlots(state.date).has(state.time)) {
      L.toast("Sorry, that time has just been taken. Please pick another.");
      state.time = null;
      go(2);
      return;
    }
    const booking = {
      id: "b-" + Date.now(), ref: L.ref(), date: state.date, time: state.time, service: state.service,
      name: f.name.value.trim(), phone: f.phone.value.trim(), email: f.email.value.trim(),
      notes: f.notes.value.trim(), reminder: f.reminder.checked, status: "confirmed", createdAt: Date.now()
    };
    L.addBooking(booking);
    state.last = booking;
    const svc = L.serviceById(booking.service);
    $("#confirm-line").textContent =
      `${svc.name} on ${L.fmtLong(L.fromISO(booking.date))} at ${booking.time}. A confirmation is on its way to ${booking.email}.`;
    $("#confirm-ref").textContent = booking.ref;
    go(4);
  }

  $("#next").addEventListener("click", next);
  $("#back").addEventListener("click", () => state.step > 1 && go(state.step - 1));

  $("#add-cal").addEventListener("click", () => {
    const b = state.last; if (!b) return;
    const svc = L.serviceById(b.service);
    L.downloadICS({
      title: `${svc.name} at ${B.name}`, dateISO: b.date, start: b.time, mins: svc.mins,
      location: `${B.name}, ${B.address}`, description: `Booking ref ${b.ref}`
    });
  });

  $("#book-another").addEventListener("click", () => {
    Object.assign(state, { service: null, date: null, time: null, last: null });
    form.reset();
    form.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
    renderServices();
    go(1);
  });

  /* ---------- Manage my booking ---------- */
  const dlg = $("#manage");
  const mForm = $("#manage-form");
  const result = $("#manage-result");

  $("#manage-open").addEventListener("click", () => {
    result.innerHTML = "";
    mForm.reset();
    if (state.last) mForm.elements.ref.value = state.last.ref;
    dlg.showModal();
  });
  dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest("[data-close]")) dlg.close(); });

  function showFound(b) {
    const svc = L.serviceById(b.service);
    const canCancel = b.status !== "cancelled";
    result.innerHTML = `
      <div class="note" style="display:flex;flex-direction:column;gap:6px">
        <strong>${L.esc(svc.name)} · ${L.esc(L.fmtLong(L.fromISO(b.date)))} at ${L.esc(b.time)}</strong>
        <span>For ${L.esc(b.name)} · <span class="chip chip--${b.status}">${b.status[0].toUpperCase() + b.status.slice(1)}</span></span>
      </div>
      ${canCancel ? `<button class="btn btn-danger btn-block" type="button" id="cancel-booking" style="margin-top:12px">Cancel this booking</button>` : ""}`;
    const c = $("#cancel-booking");
    c && c.addEventListener("click", () => {
      L.setBookingStatus(b.id, "cancelled");
      L.toast("Booking cancelled");
      showFound({ ...b, status: "cancelled" });
      if (state.step === 2) { renderCalendar(); renderTimes(); }
    });
  }

  mForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = mForm.elements.ref.value.trim().toUpperCase();
    const err = mForm.querySelector('[data-for="ref"]');
    const b = L.allBookings().find((x) => x.ref.toUpperCase() === val);
    if (!b) {
      err.textContent = val ? "We couldn’t find a booking with that reference." : "Enter the reference from your confirmation.";
      result.innerHTML = "";
      return;
    }
    err.textContent = "";
    showFound(b);
  });

  /* ---------- Start ---------- */
  const pre = new URLSearchParams(location.search).get("service");
  if (L.serviceById(pre)) state.service = pre;
  renderServices();
  go(1);
  document.activeElement && document.activeElement.blur();
})();
