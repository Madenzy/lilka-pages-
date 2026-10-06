/* Lilka — Event detail, tickets and checkout */
(() => {
  const L = Lilka;
  const id = new URLSearchParams(location.search).get("id") || L.events[0].id;
  const ev = L.eventById(id);
  const $ = (s) => document.querySelector(s);

  if (!ev) {
    $("#event-root").innerHTML = `
      <div class="container"><div class="empty-state">
        <img src="images/lilka-mark.png" alt="">
        <h2>We couldn’t find that event</h2>
        <p class="muted">It may have finished or the link may be wrong.</p>
        <a class="btn btn-primary" href="index.html">Browse events</a>
      </div></div>`;
    return;
  }

  /* ---------- Event details ---------- */
  const date = L.fromISO(ev.date);
  document.title = `Lilka – ${ev.title}`;
  const hero = $("#hero-img");
  hero.src = ev.hero || ev.img;
  hero.alt = ev.alt;
  hero.style.objectPosition = ev.pos;
  $("#ev-cat").textContent = ev.cat;
  $("#ev-title").textContent = ev.title;
  $("#ev-host").textContent = ev.host;
  $("#ev-date").textContent = L.fmtLongYear(date);
  $("#ev-time").textContent = `${ev.start} – ${ev.end}${ev.doors ? " · Doors " + ev.doors : ""}`;
  $("#ev-venue").textContent = ev.venue;
  $("#ev-address").textContent = ev.address;
  $("#ev-about").innerHTML = ev.about.map((p) => `<p>${L.esc(p)}</p>`).join("");
  $("#ev-tags").innerHTML = ev.tags.map((t) => `<span class="tag">${L.esc(t)}</span>`).join("");

  /* ---------- Ticket picker ---------- */
  const MAX_PER_TYPE = 10;
  let qty = {};
  let tickets = [];
  const views = { pick: $("#view-pick"), checkout: $("#view-checkout"), done: $("#view-done") };

  const count = () => Object.values(qty).reduce((a, b) => a + b, 0);
  const total = () => L.totalFor(ev, qty);
  const isFreeOrder = () => total() === 0;

  function show(name, scroll = true) {
    Object.entries(views).forEach(([k, el]) => {
      el.hidden = k !== name;
      if (k === name) el.style.display = "flex";
      else el.style.display = "none";
    });
    if (scroll && window.innerWidth <= 900) views[name].closest(".ticket-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderTickets() {
    tickets = L.ticketState(ev);
    $("#ticket-rows").innerHTML = tickets.map((t) => {
      const q = qty[t.id] || 0;
      const max = Math.min(MAX_PER_TYPE, t.left);
      const note = t.soldOut ? "Sold out"
        : `${L.money(t.price)} · ${t.left <= 20 ? t.left + " left" : L.esc(t.desc)}`;
      return `
        <div class="ticket-row${q ? " is-selected" : ""}${t.soldOut ? " is-soldout" : ""}">
          <span class="ticket-row__info">
            <span class="ticket-row__name">${L.esc(t.name)}</span>
            <span class="ticket-row__note">${note}</span>
          </span>
          <span class="stepper">
            <button type="button" data-id="${t.id}" data-d="-1" aria-label="Remove one ${L.esc(t.name)} ticket" ${t.soldOut || q === 0 ? "disabled" : ""}>−</button>
            <output aria-live="polite" aria-label="${L.esc(t.name)} tickets">${q}</output>
            <button type="button" data-id="${t.id}" data-d="1" aria-label="Add one ${L.esc(t.name)} ticket" ${t.soldOut || q >= max ? "disabled" : ""}>+</button>
          </span>
        </div>`;
    }).join("");
    const n = count();
    $("#total").textContent = L.money2(total());
    const cta = $("#to-checkout");
    cta.disabled = n === 0;
    cta.textContent = tickets.every((t) => t.soldOut) ? "Sold out"
      : n === 0 ? (tickets.every((t) => t.price === 0) ? "Choose places" : "Get tickets")
      : `Continue with ${n} ticket${n === 1 ? "" : "s"}`;
  }

  $("#ticket-rows").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-id]");
    if (!b || b.disabled) return;
    const t = tickets.find((x) => x.id === b.dataset.id);
    const next = (qty[t.id] || 0) + Number(b.dataset.d);
    qty[t.id] = Math.max(0, Math.min(MAX_PER_TYPE, t.left, next));
    if (!qty[t.id]) delete qty[t.id];
    renderTickets();
    const again = $(`#ticket-rows button[data-id="${t.id}"][data-d="${b.dataset.d}"]`);
    (again && !again.disabled ? again : $(`#ticket-rows button[data-id="${t.id}"]:not([disabled])`))?.focus();
  });

  /* ---------- Checkout ---------- */
  const form = views.checkout;
  const summaryLine = () => {
    const parts = tickets.filter((t) => qty[t.id]).map((t) => `${qty[t.id]} × ${t.name}`);
    return `${parts.join(", ")} · ${L.fmtShort(date)}`;
  };

  $("#to-checkout").addEventListener("click", () => {
    if (!count()) return;
    $("#checkout-summary").textContent = summaryLine();
    const free = isFreeOrder();
    $("#card-fields").hidden = free;
    $("#card-fields").style.display = free ? "none" : "flex";
    $("#pay-btn").textContent = free ? "Register" : `Pay ${L.money2(total())}`;
    $("#demo-note").textContent = free ? "Free registration. We’ll email your entry pass." : "Demo checkout. No real payment is taken.";
    show("checkout");
    form.elements.name.focus();
  });
  $("#to-pick").addEventListener("click", () => show("pick"));

  // Friendly card formatting
  form.elements.card.addEventListener("input", (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
    e.target.value = digits.replace(/(.{4})/g, "$1 ").trim();
  });
  form.elements.exp.addEventListener("input", (e) => {
    const d = e.target.value.replace(/\D/g, "").slice(0, 4);
    e.target.value = d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
  });
  form.elements.cvc.addEventListener("input", (e) => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4); });

  function validate() {
    const f = form.elements;
    const errors = {};
    if (f.name.value.trim().length < 2) errors.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(f.email.value.trim())) errors.email = "Enter a valid email so we can send your tickets.";
    if (!isFreeOrder()) {
      if (f.card.value.replace(/\D/g, "").length !== 16) errors.card = "Card number should be 16 digits.";
      const m = f.exp.value.match(/^(\d{2}) \/ (\d{2})$/);
      if (!m || +m[1] < 1 || +m[1] > 12) errors.exp = "Use MM / YY.";
      if (f.cvc.value.length < 3) errors.cvc = "3 or 4 digits.";
    }
    form.querySelectorAll(".field-error").forEach((el) => {
      const key = el.dataset.for;
      el.textContent = errors[key] || "";
      f[key].setAttribute("aria-invalid", errors[key] ? "true" : "false");
    });
    const first = Object.keys(errors)[0];
    if (first) f[first].focus();
    return !first;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) return;
    const btn = $("#pay-btn");
    btn.disabled = true;
    btn.textContent = isFreeOrder() ? "Registering…" : "Processing…";

    setTimeout(() => {
      const order = {
        id: "o-" + Date.now(), ref: L.ref(), eventId: ev.id,
        name: form.elements.name.value.trim(), email: form.elements.email.value.trim(),
        items: { ...qty }, total: total(), status: "paid", createdAt: Date.now()
      };
      L.addOrder(order);
      $("#done-summary").textContent = `${summaryLine()}. Sent to ${order.email}.`;
      $("#done-ref").textContent = order.ref;
      btn.disabled = false;
      show("done");
      L.toast(isFreeOrder() ? "You’re registered" : "Payment complete");
    }, 700);
  });

  $("#restart").addEventListener("click", () => {
    qty = {};
    form.reset();
    form.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
    renderTickets();
    show("pick");
  });

  renderTickets();
  show("pick", false);
})();
