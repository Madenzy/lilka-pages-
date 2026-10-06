/* Lilka — legal pages: contents rail (open on desktop, collapsed on phones) + current-section highlight */
(() => {
  const toc = document.querySelector(".toc");
  if (!toc) return;

  const small = window.matchMedia("(max-width: 900px)");
  const sync = () => { toc.open = !small.matches; };
  sync();
  small.addEventListener("change", sync);

  // Close the contents after picking a section on a phone
  toc.addEventListener("click", (e) => {
    if (e.target.closest("a") && small.matches) toc.open = false;
  });

  const links = [...toc.querySelectorAll("ol a")];
  const sections = links.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean);
  if (!("IntersectionObserver" in window) || !sections.length) return;

  const setActive = (id) => links.forEach((a) => a.classList.toggle("is-active", a.hash === "#" + id));
  const visible = new Map();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => visible.set(en.target.id, en.isIntersecting));
    const first = sections.find((s) => visible.get(s.id));
    if (first) setActive(first.id);
  }, { rootMargin: "-90px 0px -55% 0px" });
  sections.forEach((s) => io.observe(s));
  setActive(sections[0].id);
})();
