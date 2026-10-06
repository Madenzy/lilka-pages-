/* Lilka — Browse events */
(() => {
  const L = Lilka;
  const grid = document.getElementById("event-grid");
  const catWrap = document.getElementById("categories");
  const search = document.getElementById("search");
  const when = document.getElementById("when");
  const freeBtn = document.getElementById("free-only");
  const count = document.getElementById("results-count");

  const params = new URLSearchParams(location.search);
  const state = {
    cat: L.categories.includes(params.get("cat")) ? params.get("cat") : "All",
    q: params.get("q") || "",
    when: "any",
    free: false
  };
  search.value = state.q;

  // Category pills
  catWrap.innerHTML = L.categories.map((c) =>
    `<button class="pill" type="button" data-cat="${L.esc(c)}" aria-pressed="${c === state.cat}">${L.esc(c)}</button>`
  ).join("");
  catWrap.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    state.cat = btn.dataset.cat;
    catWrap.querySelectorAll("[data-cat]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    render();
  });

  search.addEventListener("input", () => { state.q = search.value.trim(); render(); });
  when.addEventListener("change", () => { state.when = when.value; render(); });
  freeBtn.addEventListener("click", () => {
    state.free = !state.free;
    freeBtn.setAttribute("aria-pressed", String(state.free));
    render();
  });

  function inRange(date) {
    const t = L.today();
    if (state.when === "any") return true;
    if (state.when === "week") return date >= t && date <= L.addDays(t, 7);
    if (state.when === "month") return date >= t && date <= L.addDays(t, 30);
    // This weekend: the coming Saturday and Sunday (or today if it's the weekend)
    const dow = t.getDay();
    const sat = dow === 0 ? L.addDays(t, -1) : L.addDays(t, 6 - dow);
    const sun = L.addDays(sat, 1);
    return date >= sat && date <= sun;
  }

  function matches(ev, s) {
    if (state.cat !== "All" && ev.cat !== state.cat) return false;
    if (state.free && !s.isFree) return false;
    if (!inRange(s.date)) return false;
    if (state.q) {
      const hay = [ev.title, ev.venue, ev.area, ev.host, ev.cat].join(" ").toLowerCase();
      return state.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
    }
    return true;
  }

  function card(ev, s) {
    return `
      <a class="event-card" href="event.html?id=${encodeURIComponent(ev.id)}">
        <div class="event-card__media">
          <img src="${L.esc(ev.img)}" alt="${L.esc(ev.alt)}" loading="lazy" style="object-position:${L.esc(ev.pos)}">
          <span class="event-card__cat">${L.esc(ev.cat)}</span>
        </div>
        <div class="event-card__body">
          <span class="event-card__when">${L.esc(s.whenLabel)}</span>
          <span class="event-card__title">${L.esc(ev.title)}</span>
          <span class="event-card__venue">${L.esc(ev.venue)}, ${L.esc(ev.area.toLowerCase())}</span>
          <span class="event-card__foot">
            <span class="event-card__price">${L.esc(s.priceLabel)}</span>
            <span class="event-card__left${s.low || s.left === 0 ? " low" : ""}">${L.esc(s.leftLabel)}</span>
          </span>
        </div>
      </a>`;
  }

  function render() {
    const list = L.events
      .map((ev) => ({ ev, s: L.eventSummary(ev) }))
      .filter(({ ev, s }) => matches(ev, s))
      .sort((a, b) => a.s.date - b.s.date);

    if (!list.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <img src="images/lilka-mark.png" alt="">
          <h2>Nothing matches that yet</h2>
          <p class="muted">Try another category or date, or clear your search.</p>
          <button class="btn btn-outline" type="button" id="clear-filters">Clear filters</button>
        </div>`;
      document.getElementById("clear-filters").addEventListener("click", clearAll);
    } else {
      grid.innerHTML = list.map(({ ev, s }) => card(ev, s)).join("");
    }
    count.textContent = `${list.length} event${list.length === 1 ? "" : "s"} shown`;
  }

  function clearAll() {
    state.cat = "All"; state.q = ""; state.when = "any"; state.free = false;
    search.value = ""; when.value = "any"; freeBtn.setAttribute("aria-pressed", "false");
    catWrap.querySelectorAll("[data-cat]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === "All")));
    render();
  }

  render();
})();
