/* Daten-Fliessband (Echtzeit-3D): laedt die Szene erst, wenn der Abschnitt in die Naehe kommt.
   Die Szene samt three.js steht gebaut in assets/3d/fliessband-szene.min.js (Quelle: scrolltest/3d-quelle, bau_3d.sh).
   Nach jedem Neubau die Versionsnummer unten hochsetzen, /assets/3d/ ist einen Tag im Browser-Cache. */
const huelle = document.querySelector('.fliessband');
if (huelle) {
  const io = new IntersectionObserver(function (e) {
    if (!e[0].isIntersecting) return;
    io.disconnect();
    import('./3d/fliessband-szene.min.js?v=20261006').then(function (m) { return m.start(huelle); })
      .catch(function (f) { console.warn('Fliessband:', f); huelle.classList.add('ohne-3d'); });
  }, { rootMargin: '700px 0px' });
  io.observe(huelle);
}
