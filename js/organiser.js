/* Lilka — Organiser dashboard */
(() => {
  const L = Lilka;
  const $ = (s) => document.querySelector(s);
  const COLORS = ["#6B46FF", "#FF2D7A", "#FFB347"];

  const params = new URLSearchParams(location.search);
  let ev = L.eventById(params.get("id")) || L.events[0];

  const picker = $("#event-picker");
  picker.innerHTML = L.events.map((e) =>
    `<option value="${e.id}" ${e.id === ev.id ? "selected" : ""}>${L.esc(e.title)}</option>`).join("");
  picker.addEventListener("change", () => {
    ev = L.eventById(picker.value);
    history.replaceState(null, "", "?id=" + encodeURIComponent(ev.id));
    render();
  });

  const itemsText = (o) => ev.tickets.filter((t) => o.items[t.id])
    .map((t) => `${o.items[t.id]} × ${t.name.replace("General admission", "General")}`).join(", ");

  function render() {
    const s = L.eventSummary(ev);
    const date = L.fromISO(ev.date);
    const orders = L.allOrders(ev.id);
    const paid = orders.filter((o) => o.status === "paid");

    $("#event-meta").textContent = `${L.fmtShort(date)} · ${ev.start} · ${ev.venue}`;
    $("#event-title").textContent = ev.title;
    $("#view-page").href = "event.html?id=" + encodeURIComponent(ev.id);
    document.title = `Lilka – ${ev.title} · Organiser`;

    // Stats
    $("#stat-sold").innerHTML = `${s.sold} <small>/ ${s.cap}</small>`;
    $("#stat-bar").style.width = Math.round((s.sold / s.cap) * 100) + "%";
    const gross = s.tickets.reduce((sum, t) => sum + t.sold * t.price, 0);
    $("#stat-gross").textContent = s.isFree ? "Free" : L.moneyWhole(gross);
    $("#stat-gross-note").textContent = s.isFree ? `${s.sold} people registered` : "Paid out after the event";
    const days = Math.round((date - L.today()) / 86400000);
    $("#stat-days").textContent = days > 0 ? days : days === 0 ? "Today" : "Done";
    const remind = L.addDays(date, -1);
    $("#stat-days-note").textContent = days > 1 ? `Reminder email goes out ${L.DOW[remind.getDay()]}`
      : days >= 0 ? "Reminder email sent" : "This event has finished";

    // Ticket types
    $("#type-rows").innerHTML = s.tickets.map((t, i) => `
      <div class="type-row">
        <div class="type-row__top"><span>${L.esc(t.name)}</span><span>${t.sold} / ${t.cap}</span></div>
        <div class="bar bar--lg"><span style="width:${Math.round((t.sold / t.cap) * 100)}%;background:${COLORS[i % 3]}"></span></div>
      </div>`).join("");

    $("#share-link").textContent = `lilka.app/e/${ev.id}`;

    // Orders
    $("#orders-count").textContent = orders.length ? `${orders.length} order${orders.length === 1 ? "" : "s"}` : "";
    $("#orders").innerHTML = orders.length ? orders.map((o) => {
      const status = o.status === "refunded" ? "refunded" : o.checkedIn ? "checked-in" : "paid";
      const label = { refunded: "Refunded", "checked-in": "Checked in", paid: o.total === 0 ? "Registered" : "Paid" }[status];
      return `
        <tr>
          <td><span style="font-weight:500;font-size:15px">${L.esc(o.name)}</span><span class="t-sub">${L.esc(L.ago(o.createdAt))}</span></td>
          <td class="hide-sm" style="color:var(--text-2)">${L.esc(itemsText(o))}</td>
          <td class="t-strong">${o.total === 0 ? "Free" : L.money(o.total)}</td>
          <td><span class="chip chip--${status}">${label}</span></td>
        </tr>`;
    }).join("") : `<tr><td colspan="4" class="table-empty">No orders yet. Share your link to start selling.<br><a href="event.html?id=${encodeURIComponent(ev.id)}">Try buying a ticket yourself</a></td></tr>`;

    $("#checkin-open").disabled = !paid.length;
    if (dlg.open) renderCheckin();
  }

  $("#copy-link").addEventListener("click", async () => {
    const text = "https://" + $("#share-link").textContent;
    try { await navigator.clipboard.writeText(text); L.toast("Link copied"); }
    catch (e) { L.toast(text); }
  });

  /* ---------- Check-in ---------- */
  const dlg = $("#checkin");
  const search = $("#checkin-search");
  dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest("[data-close]")) dlg.close(); });

  function renderCheckin() {
    const paid = L.allOrders(ev.id).filter((o) => o.status === "paid");
    const q = search.value.trim().toLowerCase();
    const list = paid.filter((o) => !q || o.name.toLowerCase().includes(q) || o.ref.toLowerCase().includes(q));
    const done = paid.filter((o) => o.checkedIn).length;
    $("#checkin-progress").textContent = `${done} of ${paid.length} orders checked in`;
    $("#checkin-list").innerHTML = list.length ? list.map((o) => `
      <li>
        <span class="who">${L.esc(o.name)}<span>${L.esc(itemsText(o))} · ${L.esc(o.ref)}</span></span>
        <button class="btn btn-sm ${o.checkedIn ? "btn-outline" : "btn-primary"}" type="button" data-order="${o.id}" data-on="${!o.checkedIn}">
          ${o.checkedIn ? "Undo" : "Check in"}
        </button>
      </li>`).join("") : `<li class="muted">No one matches that search.</li>`;
  }

  $("#checkin-open").addEventListener("click", () => { search.value = ""; renderCheckin(); dlg.showModal(); search.focus(); });
  search.addEventListener("input", renderCheckin);
  $("#checkin-list").addEventListener("click", (e) => {
    const b = e.target.closest("[data-order]");
    if (!b) return;
    const on = b.dataset.on === "true";
    L.setCheckin(b.dataset.order, on);
    if (on) L.toast("Checked in");
    render();
    $(`#checkin-list [data-order="${b.dataset.order}"]`)?.focus();
  });

  window.addEventListener("storage", render);
  render();
})();
