/* Daten-Fliessband (Echtzeit-3D): laedt die Szene erst, wenn der Abschnitt in die Naehe kommt.
   Die Szene samt three.js steht gebaut in assets/3d/fliessband-szene.min.js (Quelle: scrolltest/3d-quelle, bau_3d.sh).
   Nach jedem Neubau die Versionsnummer unten hochsetzen, /assets/3d/ ist einen Tag im Browser-Cache.
   Ersatz (2026-10-15): Ohne brauchbares WebGL (z. B. Grafikbeschleunigung aus, Grafikkarte durch Blender belegt) oder wenn
   die Szene nach 12 s nicht steht, laeuft ein kurzes Video der Szene (fliessband-breit/-schmal.mp4). Bei reduzierter
   Bewegung oder Datensparen bleibt das Standbild (CSS ::before). Kommt die 3D-Szene spaeter doch, liegt sie ueber dem Video. */
const huelle = document.querySelector('.fliessband');
if (huelle) {
  const ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches || !!(navigator.connection && navigator.connection.saveData);

  function webglBrauchbar() {
    try {
      const c = document.createElement('canvas'), opt = { failIfMajorPerformanceCaveat: true };
      const gl = c.getContext('webgl2', opt) || c.getContext('webgl', opt);
      if (!gl) return false;
      const weg = gl.getExtension('WEBGL_lose_context'); if (weg) weg.loseContext();   /* Probe-Kontext gleich wieder freigeben */
      return true;
    } catch (e) { return false; }
  }

  function alsVideo(grund) {
    if (huelle.classList.contains('bereit') || huelle.querySelector('.fb-video')) return;
    console.info('Fliessband: Video statt 3D (' + grund + ')');
    huelle.classList.add('ohne-3d');
    if (ruhig) return;                                   /* Standbild genuegt */
    const schmal = matchMedia('(max-width:45rem)').matches;
    const v = document.createElement('video');
    v.className = 'fb-video'; v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
    v.src = new URL('./fliessband-' + (schmal ? 'schmal' : 'breit') + '.mp4', import.meta.url).href;
    huelle.appendChild(v);
    v.play().catch(function () {});
  }

  const io = new IntersectionObserver(function (e) {
    if (!e[0].isIntersecting) return;
    io.disconnect();
    if (!webglBrauchbar()) { alsVideo('kein WebGL'); return; }
    setTimeout(function () { alsVideo('3D nach 12 s nicht bereit'); }, 12000);   /* greift nur, wenn .bereit fehlt */
    import('./3d/fliessband-szene.min.js?v=20261006').then(function (m) { return m.start(huelle); })
      .catch(function (f) { console.warn('Fliessband:', f); alsVideo('Fehler beim Start'); });
  }, { rootMargin: '700px 0px' });
  io.observe(huelle);
  /* Kommt die 3D-Szene nach dem Video doch noch, das Video entfernen (spart Rechenzeit) */
  new MutationObserver(function () {
    const v = huelle.querySelector('.fb-video');
    if (v && huelle.classList.contains('bereit')) { v.pause(); v.remove(); huelle.classList.remove('ohne-3d'); }
  }).observe(huelle, { attributes: true, attributeFilter: ['class'] });
}
