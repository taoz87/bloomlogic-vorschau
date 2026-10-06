/* BloomLogic Webseite: Einblenden, Banderole, lebende Kacheln, Bremse zum Zerlegen, Handy-Menue, Reiter.
   Genutzt von der Startseite und den Unterseiten. <html data-basis="../"> auf Unterseiten fuer Bildpfade. */
(function () {
  'use strict';
  var ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var BASIS = document.documentElement.getAttribute('data-basis') || '';

  /* Karten und Bloecke blenden beim Hereinscrollen ein (wie auf der bisherigen Seite) */
  if ('IntersectionObserver' in window && !ruhig) {
    var zeigen = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) { if (e.isIntersecting) { e.target.setAttribute('data-zeigen', 'an'); zeigen.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('#seite [data-zeigen]').forEach(function (el) { el.setAttribute('data-zeigen', 'aus'); zeigen.observe(el); });
  }
  function warte(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* Banderole: Eintraege zweimal hintereinander, die Zeile laeuft um die Haelfte und beginnt nahtlos neu */
  document.querySelectorAll('#seite [data-band]').forEach(function (z) {
    var html = z.dataset.band.split('|').map(function (t) { return '<span>' + t + '</span>'; }).join('');
    z.innerHTML = html + html;
  });

  /* Schluss-Hero: ein weiches Licht im Logo-Verlauf folgt der Maus, die Maus hinterlaesst Blaetter aus dem Logo
     (i-Punkt, meist im Verlauf, jedes fuenfte in Navy), die aufgehen, trudelnd absinken und verblassen. Am Handy:
     Tippen laesst ein paar Blaetter aufgehen. Nur aktiv, wenn der fertige Hero zu sehen ist. */
  (function () {
    var cv = document.getElementById('spur'), buehne = document.getElementById('buehne');
    var einl = document.getElementById('einladung'), schl = document.getElementById('schluss');
    if (!cv || ruhig) return;
    var cx = cv.getContext('2d'), dpr = 1, W = 0, H = 0, blueten = [], laeuft = false;
    var licht = { x: 0, y: 0, zx: 0, zy: 0, a: 0, za: 0 };
    function groesse() { dpr = Math.min(window.devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; }
    groesse(); window.addEventListener('resize', groesse);
    /* Das Blatt aus dem Logo (i-Punkt) einmal als Bild vorbereiten: im Verlauf und in Navy */
    var form = new Path2D(document.getElementById('blattForm').getAttribute('d'));
    function blattBild(navy) {
      var c = document.createElement('canvas'); c.width = c.height = 96;
      var b = c.getContext('2d'), v = b.createLinearGradient(0, 96, 0, 0);
      v.addColorStop(0, '#13AD9C'); v.addColorStop(1, '#00DF3A');
      b.translate(48, 48); b.scale(1.7, 1.7); b.translate(-775.5, -642);
      b.fillStyle = navy ? '#000033' : v; b.fill(form);
      return c;
    }
    var gruen = blattBild(false), navy = blattBild(true);
    function aktiv() {
      if (schl.style.visibility !== 'visible' || +einl.style.opacity < 0.5) return false;
      var r = buehne.getBoundingClientRect(); return r.bottom > window.innerHeight * 0.4;
    }
    function lage(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    function bluete(x, y, gross) {
      if (blueten.length > 60) blueten.shift();
      blueten.push({ x: x, y: y, t: performance.now(), g: (gross || 1) * (10 + Math.random() * 10), r: Math.random() * 6.3,
                     bild: Math.random() < 0.2 ? navy : gruen,
                     dr: (Math.random() - 0.5) * 3.2, dx: (Math.random() - 0.5) * 26, dy: 16 + Math.random() * 30 });
      start();
    }
    var lx = null, ly = null, weg = 0;
    window.addEventListener('mousemove', function (e) {
      if (!aktiv()) { licht.za = 0; start(); return; }
      var p = lage(e); licht.zx = p[0]; licht.zy = p[1]; licht.za = 1;
      if (licht.a === 0) { licht.x = p[0]; licht.y = p[1]; }
      if (lx !== null) weg += Math.hypot(p[0] - lx, p[1] - ly);
      lx = p[0]; ly = p[1];
      if (weg > 38) { weg = 0; bluete(p[0], p[1]); }
      start();
    }, { passive: true });
    document.addEventListener('mouseleave', function () { licht.za = 0; start(); });
    window.addEventListener('touchstart', function (e) {
      if (!aktiv() || e.touches.length !== 1) return;
      var p = lage(e.touches[0]);
      for (var i = 0; i < 5; i++) bluete(p[0] + (Math.random() - 0.5) * 70, p[1] + (Math.random() - 0.5) * 70, 1.1);
    }, { passive: true });
    function start() { if (!laeuft) { laeuft = true; requestAnimationFrame(schritt); } }
    /* Fliessende Linien im Hintergrund (Vorschau, mit LINIEN = false wieder aus): duenne Wellen im Logo-Verlauf, die
       langsam ziehen und der Maus ausweichen; die Mitte bleibt fuer Logo und Text frei */
    var LINIEN = true, linienA = 0;
    function linien(jetzt) {
      var sek = jetzt / 1000, N = 15, ab = 12;
      var v = cx.createLinearGradient(0, 0, W, 0); v.addColorStop(0, '#13AD9C'); v.addColorStop(0.5, '#10B48C'); v.addColorStop(1, '#00DF3A');
      cx.strokeStyle = v; cx.lineWidth = 1.6; cx.lineJoin = 'round';
      for (var i = 0; i < N; i++) {
        var basis = H * (0.06 + 0.88 * i / (N - 1)), amp = 22 + 14 * Math.sin(i * 1.3);
        cx.globalAlpha = linienA * (0.18 + 0.14 * Math.pow(Math.sin(i * 0.7 + sek * 0.25), 2));
        cx.beginPath();
        for (var x = -ab; x <= W + ab; x += ab) {
          var y = basis + Math.sin(x * 0.0042 + sek * 0.32 + i * 0.45) * amp + Math.sin(x * 0.011 - sek * 0.21 + i * 0.9) * amp * 0.4;
          if (licht.a > 0.01) {                       /* der Maus ausweichen */
            var dx = x - licht.x, dy = y - licht.y;
            y += (dy >= 0 ? 1 : -1) * 42 * licht.a * Math.exp(-(dx * dx + dy * dy) / (2 * 140 * 140));
          }
          if (x === -ab) cx.moveTo(x, y); else cx.lineTo(x, y);
        }
        cx.stroke();
      }
      cx.globalAlpha = 1;
      cx.globalCompositeOperation = 'destination-out';  /* Mitte frei halten */
      var m = cx.createRadialGradient(W / 2, H * 0.5, 0, W / 2, H * 0.5, Math.max(W, H) * 0.45);
      m.addColorStop(0, 'rgba(0,0,0,0.8)'); m.addColorStop(0.55, 'rgba(0,0,0,0.35)'); m.addColorStop(1, 'rgba(0,0,0,0)');
      cx.fillStyle = m; cx.fillRect(0, 0, W, H);
      cx.globalCompositeOperation = 'source-over';
    }
    setInterval(function () { if (LINIEN && aktiv()) start(); }, 400);
    window.addEventListener('scroll', function () { if (LINIEN && aktiv()) start(); }, { passive: true });
    function schritt(jetzt) {
      cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
      var an = LINIEN && aktiv();
      linienA += ((an ? 1 : 0) - linienA) * 0.05;
      if (linienA > 0.01) linien(jetzt); else linienA = an ? linienA : 0;
      /* Licht: gedaempft hinterher, blendet weich ein und aus */
      licht.x += (licht.zx - licht.x) * 0.08; licht.y += (licht.zy - licht.y) * 0.08; licht.a += (licht.za - licht.a) * 0.06;
      if (licht.a > 0.005) {
        var R = Math.max(W, H) * 0.32, g = cx.createRadialGradient(licht.x, licht.y, 0, licht.x, licht.y, R);
        g.addColorStop(0, 'rgba(0,223,58,' + (0.13 * licht.a) + ')'); g.addColorStop(0.45, 'rgba(16,180,140,' + (0.07 * licht.a) + ')');
        g.addColorStop(1, 'rgba(19,173,156,0)');
        cx.fillStyle = g; cx.fillRect(licht.x - R, licht.y - R, R * 2, R * 2);
      } else licht.a = 0;
      /* Blueten: aufgehen (mit Ueberschwingen), sinken, drehen, verblassen */
      var LEBEN = 1500;
      blueten = blueten.filter(function (b) { return jetzt - b.t < LEBEN; });
      blueten.forEach(function (b) {
        var k = (jetzt - b.t) / LEBEN, auf = Math.min(1, k / 0.18), s = auf < 1 ? 1 + 1.7 * Math.pow(auf - 1, 3) + 0.7 * Math.pow(auf - 1, 2) : 1;
        var gr = b.g * Math.max(0, s) * (1 - 0.25 * k);
        cx.save(); cx.globalAlpha = Math.pow(1 - k, 1.6) * 0.95;
        cx.translate(b.x + b.dx * k, b.y + b.dy * k * k); cx.rotate(b.r + b.dr * k);
        cx.drawImage(b.bild, -gr, -gr, gr * 2, gr * 2); cx.restore();
      });
      if (an || linienA > 0.01 || blueten.length || licht.a > 0.005 || Math.abs(licht.za - licht.a) > 0.01) requestAnimationFrame(schritt);
      else { laeuft = false; cx.clearRect(0, 0, W, H); }
    }
  })();

  /* Hauptmenue: Leistungen klappt per Klick auf (mit Maus auch beim Darueberfahren); im Handy-Menue als Akkordeon */
  (function () {
    var drop = document.querySelector('#kopf .nav-drop');
    if (drop) {
      var auf = drop.querySelector('.nav-auf'), zu = 0, seit = 0;
      var offen = function () { return drop.classList.contains('offen'); };
      var setze = function (an) {
        clearTimeout(zu); if (an && !offen()) seit = Date.now();
        drop.classList.toggle('offen', an); auf.setAttribute('aria-expanded', an ? 'true' : 'false');
      };
      /* gerade erst per Maus geoeffnet: der Klick soll es nicht gleich wieder schliessen */
      auf.addEventListener('click', function () { if (offen() && Date.now() - seit < 700) return; setze(!offen()); });
      if (window.matchMedia('(hover: hover)').matches) {
        drop.addEventListener('mouseenter', function () { setze(true); });
        drop.addEventListener('mouseleave', function () { zu = setTimeout(function () { setze(false); }, 200); });
      }
      drop.addEventListener('click', function (e) { if (e.target.closest('a')) setze(false); });
      drop.addEventListener('focusout', function (e) { if (!drop.contains(e.relatedTarget)) setze(false); });
      document.addEventListener('click', function (e) { if (!drop.contains(e.target)) setze(false); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && offen()) { setze(false); auf.focus(); } });
    }
    var mm = document.querySelector('#mobilmenue .mm-auf');
    if (mm) mm.addEventListener('click', function () {
      var an = mm.getAttribute('aria-expanded') !== 'true';
      mm.setAttribute('aria-expanded', an ? 'true' : 'false'); mm.nextElementSibling.classList.toggle('offen', an);
    });
  })();

  /* Handy-Menue */
  (function () {
    var knopf = document.querySelector('#kopf .menue'), menue = document.getElementById('mobilmenue');
    if (!knopf || !menue) return;
    function setze(auf) {
      menue.classList.toggle('offen', auf); knopf.setAttribute('aria-expanded', auf ? 'true' : 'false');
      knopf.setAttribute('aria-label', auf ? 'Menü schließen' : 'Menü öffnen');
    }
    knopf.addEventListener('click', function () { setze(!menue.classList.contains('offen')); });
    menue.addEventListener('click', function (e) { if (e.target.closest('a')) setze(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setze(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 820 && window.innerWidth > window.innerHeight) setze(false); });
  })();

  /* CSS-Animationen ausserhalb des Bildschirms anhalten (Laufband, Pixel, Puls ...): sie kosten sonst in jedem Bild Rechenzeit */
  if ('IntersectionObserver' in window) {
    var ruheIO = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) { e.target.classList.toggle('ruht', !e.isIntersecting); });
    }, { rootMargin: '150px 0px' });
    Array.prototype.forEach.call(document.querySelectorAll('#seite > section, #seite > .band, #seite footer'), function (el) { ruheIO.observe(el); });
  }

  /* Kennen Sie das: rotes Filzstift-Kreuz auf jedem Zettel (zeichnet sich, wenn die Zeile ins Bild kommt) und
     Spaltenkopf "Heute" / "Mit System" (am Handy als Legende) */
  Array.prototype.forEach.call(document.querySelectorAll('#seite .alltag'), function (liste) {
    liste.insertAdjacentHTML('beforebegin', '<div class="alltag-kopf" aria-hidden="true"><span class="heute">Heute</span><span class="mit">Mit System</span></div>');
    Array.prototype.forEach.call(liste.querySelectorAll('.vorher'), function (z) {
      z.insertAdjacentHTML('beforeend', '<svg class="kreuz" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path pathLength="1" d="M5 5c4 4 9 9 14 14"/><path pathLength="1" d="M19 5C14 9 9 15 5 19"/></svg>');
    });
  });

  /* Branchen-Reiter: Klick oder Pfeiltasten, der Verlaufsstrich gleitet unter den aktiven Reiter */
  (function () {
    var leiste = document.querySelector('#seite .reiter-leiste'); if (!leiste) return;
    var knoepfe = Array.prototype.slice.call(leiste.querySelectorAll('[role="tab"]')), strich = leiste.querySelector('.reiter-strich');
    function strichSetzen(k) { strich.style.width = k.offsetWidth + 'px'; strich.style.transform = 'translateX(' + k.offsetLeft + 'px)'; }
    function waehle(k, fokus) {
      knoepfe.forEach(function (b) {
        var an = b === k; b.setAttribute('aria-selected', an ? 'true' : 'false'); b.tabIndex = an ? 0 : -1;
        document.getElementById(b.getAttribute('aria-controls')).hidden = !an;
      });
      strichSetzen(k); if (fokus) k.focus();
      k.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    knoepfe.forEach(function (b, i) {
      b.addEventListener('click', function () { waehle(b); });
      b.addEventListener('keydown', function (e) {
        var n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (n) { e.preventDefault(); waehle(knoepfe[(i + n + knoepfe.length) % knoepfe.length], true); }
      });
    });
    var start = function () { strichSetzen(knoepfe.filter(function (b) { return b.getAttribute('aria-selected') === 'true'; })[0]); };
    window.addEventListener('resize', start);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
    start();
  })();

  /* Eckdaten: Zahlen zaehlen einmal hoch, wenn sie ins Bild kommen */
  document.querySelectorAll('#seite [data-zahl]').forEach(function (el) {
    var ziel = +el.dataset.zahl; if (ruhig || ziel < 2 || !('IntersectionObserver' in window)) return;
    el.textContent = '0';
    var b = new IntersectionObserver(function (e) {
      if (!e[0].isIntersecting) return; b.disconnect();
      var t0 = performance.now();
      (function f(now) { var k = Math.min(1, (now - t0) / 1400); el.textContent = Math.round(ziel * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0);
    }, { threshold: 0.6 });
    b.observe(el);
  });

  /* Kachel-Animationen laufen nur, solange die Kachel zu sehen ist */
  function sichtbar(el, an, aus) {
    if (!('IntersectionObserver' in window)) { an(); return; }
    new IntersectionObserver(function (e) { e.forEach(function (x) { x.isIntersecting ? an() : aus(); }); }, { threshold: 0.35 }).observe(el);
  }
  function tippen(el, text, lauf, ms) {
    el.textContent = ''; el.classList.add('tippt');
    var i = 0;
    return new Promise(function (fertig) {
      (function weiter() {
        if (!lauf.an) { el.classList.remove('tippt'); return fertig(); }
        if (i >= text.length) { el.classList.remove('tippt'); return fertig(); }
        el.textContent = text.slice(0, ++i); setTimeout(weiter, ms + Math.random() * ms * 0.8);
      })();
    });
  }
  function schleife(el, ablauf, endzustand) {
    var lauf = { an: false }, laeuft = false;
    if (ruhig) { endzustand(); return; }
    sichtbar(el, function () {
      if (laeuft) return; lauf = { an: true }; laeuft = true;
      (async function () { while (lauf.an) await ablauf(lauf); laeuft = false; })();
    }, function () { lauf.an = false; });
  }
  function euro(x) { return x.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' €'; }

  /* Zeitersparnis-Rechner: eine Frage (Stunden Papierkram am Tag), pro Stunde spart ein System rund 24 Minuten.
     Antwort in Alltagssprache: gewonnene Zeit pro Tag (Std. und Min.) und im Jahr in Arbeitswochen (230 Tage, 40 h). */
  var rech = document.querySelector('#seite .rechner');
  if (rech) {
    var rKnoepfe = rech.querySelectorAll('.r-wahl button'), rTag = rech.querySelector('[data-r="tag"]'), rJahr = rech.querySelector('[data-r="jahr"]');
    var waehle = function (knopf) {
      var h = +knopf.dataset.h, min = Math.round(h * 24), s = Math.floor(min / 60), m = min % 60, wochen = Math.round(min * 230 / 60 / 40);
      rKnoepfe.forEach(function (b) { b.setAttribute('aria-checked', b === knopf ? 'true' : 'false'); });
      rTag.textContent = (s ? s + ' Std. ' : '') + (m ? m + ' Min.' : '');
      rJahr.textContent = wochen + (wochen === 1 ? ' Arbeitswoche' : ' Arbeitswochen');
    };
    rKnoepfe.forEach(function (b) { b.addEventListener('click', function () { waehle(b); }); });
  }

  /* Kontakt: Chat schreibt sich, Termin springt auf, Blaetter wehen heraus (laeuft, solange sichtbar) */
  var chat = document.querySelector('#seite .mini-chat');
  if (chat) {
    var mcKunde = chat.querySelectorAll('.mc-blase.kunde'), mcIch = chat.querySelector('.mc-blase.ich'), mcTippt = chat.querySelector('.mc-tippt');
    var mcTermin = chat.querySelector('.mc-termin'), mcBox = chat.querySelector('.mc-blaetter');
    var MC_BLATT = 'M793.69,619.88c-2.15-.43-4.29-.64-6.39-.64-20.4,0-37.11,19.58-28.3,41.5.35-12.61,8.99-23.97,20.89-27.83-5.57,3.52-15.72,13.43-16.7,22.68-.2,1.91,2.17,2.32,2.17,2.32.4.06.84.1,1.31.1,1.82,0,4.12-.42,6.39-.94,1.92-.51,4.86-1.88,6.22-2.53.46-.22.92-.47,1.35-.74,10.86-6.97,14.24-21.17,13.05-33.91Z';
    /* Gespraeche: Kunde, Antwort, Rueckfrage, Kalendertag, Tag, Uhrzeit; jede Runde das naechste, Start zufaellig */
    var MC_G = [["Hallo! Unsere Aufträge liegen auf Zetteln, in Excel und in WhatsApp.", "Das bekommen wir geordnet. Wann passt Ihnen ein kurzes Gespräch?", "Dienstag um 10?", "DI", "Di.", "10:00"], ["Unsere Stundenzettel tippt jeden Monat jemand ab. Geht das einfacher?", "Auf jeden Fall. Zeiten lassen sich direkt am Handy erfassen. Sollen wir kurz sprechen?", "Gern, Mittwoch um 9?", "MI", "Mi.", "9:00"], ["Rechnungen schreibe ich meistens am Sonntag. Das nervt.", "Das muss nicht sein. Die Rechnung kann direkt aus dem Auftrag entstehen. Wann passt es Ihnen?", "Donnerstag um 14 Uhr?", "DO", "Do.", "14:00"], ["Wir haben drei Excel-Listen und keiner weiß, welche aktuell ist.", "Das kenne ich. Daraus wird eine Quelle für alle. Wann haben Sie Zeit für ein Gespräch?", "Montag um 11?", "MO", "Mo.", "11:00"], ["Unsere Website ist zehn Jahre alt und bringt keine Anfragen.", "Das lässt sich ändern: eine neue Seite, die bei Google gefunden wird. Sollen wir kurz telefonieren?", "Freitag um 10 passt.", "FR", "Fr.", "10:00"], ["Bei Google findet uns kaum jemand. Können Sie helfen?", "Ja. Mit einer guten Seite und einem gepflegten Google-Profil. Wann passt Ihnen ein Gespräch?", "Dienstag um 15 Uhr?", "DI", "Di.", "15:00"], ["Termine laufen bei uns über WhatsApp und Zuruf.", "Ein gemeinsamer Kalender für das ganze Team schafft da Ruhe. Wann können wir sprechen?", "Mittwoch um 16 Uhr?", "MI", "Mi.", "16:00"], ["Wir brauchen Produktbilder für die Messe, haben aber nur CAD-Daten.", "Das reicht völlig. Daraus entstehen Renderings und Animationen. Wann passt es Ihnen?", "Donnerstag um 10?", "DO", "Do.", "10:00"], ["Unsere Leistungsnachweise in der Pflege liegen noch auf Papier.", "Das geht digital, mit Abrechnung auf Knopfdruck. Sollen wir kurz sprechen?", "Montag um 9 Uhr?", "MO", "Mo.", "9:00"], ["Wir verlieren ständig den Überblick, wer welchen Auftrag hat.", "Mit einer Auftragsübersicht sieht jeder sofort, was ansteht. Wann haben Sie Zeit?", "Freitag um 13 Uhr?", "FR", "Fr.", "13:00"], ["Angebote schreiben wir noch in Word. Das dauert ewig.", "Mit Vorlagen und Ihren Preisen geht das deutlich schneller. Wann passt Ihnen ein Gespräch?", "Mittwoch um 10?", "MI", "Mi.", "10:00"], ["Unsere Software läuft auf einem alten PC im Büro. Ist das sicher?", "Sicherer ist DSGVO-konformes Hosting in Deutschland, mit Sicherungen. Sollen wir sprechen?", "Dienstag um 11?", "DI", "Di.", "11:00"]], mcNr = Math.floor(Math.random() * MC_G.length);
    var mcKal = mcTermin.querySelector('.mc-kal > b'), mcKalZ = mcTermin.querySelector('.mc-kal > span'), mcInfo = mcTermin.querySelector(':scope > div > span');
    function mcSetze(g) {
      mcKunde[0].textContent = g[0]; mcIch.dataset.text = g[1]; mcKunde[1].textContent = g[2];
      mcKal.textContent = g[3]; mcKalZ.textContent = g[5].split(':')[0]; mcInfo.textContent = g[4] + ', ' + g[5] + ' Uhr · 30 Min. · kostenlos';
    }
    mcSetze(MC_G[mcNr]);
    function mcBlaetter() {
      if (!mcBox.animate) return;
      var r = mcTermin.getBoundingClientRect(), b = chat.getBoundingClientRect();
      for (var i = 0; i < 9; i++) {
        var el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        el.setAttribute('viewBox', '755 618 41 48');
        el.innerHTML = '<path d="' + MC_BLATT + '" fill="' + (i % 4 === 0 ? '#000033' : (i % 2 ? '#10B48C' : '#00DF3A')) + '"/>';
        var x0 = r.left - b.left + r.width * (0.2 + Math.random() * 0.6), y0 = r.top - b.top + r.height * 0.4;
        el.style.left = x0 + 'px'; el.style.top = y0 + 'px';
        mcBox.appendChild(el);
        var dx = (Math.random() - 0.5) * 220, dy = -(90 + Math.random() * 140), rot = (Math.random() - 0.5) * 540;
        el.animate([{ transform: 'translate(0,0) rotate(0deg) scale(.4)', opacity: 0 },
                    { transform: 'translate(' + dx * 0.4 + 'px,' + dy * 0.5 + 'px) rotate(' + rot * 0.4 + 'deg) scale(1)', opacity: 1, offset: 0.25 },
                    { transform: 'translate(' + dx + 'px,' + (dy + 60) + 'px) rotate(' + rot + 'deg) scale(.8)', opacity: 0 }],
                   { duration: 1600 + Math.random() * 600, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' })
          .onfinish = (function (e) { return function () { e.remove(); }; })(el);
      }
    }
    function mcLeer() {
      mcKunde.forEach(function (k) { k.classList.remove('da'); }); mcIch.classList.remove('da'); mcIch.textContent = '';
      mcTippt.classList.remove('da'); mcTermin.classList.remove('da');
    }
    schleife(chat, async function (lauf) {
      mcLeer(); mcSetze(MC_G[mcNr]); mcNr = (mcNr + 1) % MC_G.length; await warte(600);
      if (!lauf.an) return; mcKunde[0].classList.add('da'); await warte(1100);
      if (!lauf.an) return; mcTippt.classList.add('da'); await warte(1300);
      if (!lauf.an) return; mcTippt.classList.remove('da'); mcIch.classList.add('da');
      await tippen(mcIch, mcIch.dataset.text, lauf, 28); await warte(900);
      if (!lauf.an) return; mcKunde[1].classList.add('da'); await warte(900);
      if (!lauf.an) return; mcTermin.classList.add('da'); await warte(450); mcBlaetter();
      await warte(5200);
    }, function () {
      mcKunde.forEach(function (k) { k.classList.add('da'); }); mcIch.textContent = mcIch.dataset.text; mcIch.classList.add('da'); mcTermin.classList.add('da');
    });
  }

  /* Kontaktformular: schickt an /api/kontakt (eigener kleiner Dienst auf dem Server), sonst Hinweis auf die E-Mail */
  var kForm = document.querySelector('#seite .kontakt-form');
  if (kForm) {
    var kZeit = Date.now(), kStatus = kForm.querySelector('.kf-status'), kKnopf = kForm.querySelector('button[type=submit]');
    function kMelde(text, gut) { kStatus.textContent = text; kStatus.className = 'kf-status ' + (gut ? 'gut' : 'schlecht'); }
    kForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = kForm.elements, fehlt = [];
      ['name', 'email', 'nachricht'].forEach(function (n) {
        var ok = f[n].value.trim() && (n !== 'email' || /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(f[n].value.trim()));
        f[n].classList.toggle('falsch', !ok); if (!ok) fehlt.push(n);
      });
      if (fehlt.length) { kMelde('Bitte Name, eine gültige E-Mail-Adresse und Ihre Nachricht ausfüllen.'); f[fehlt[0]].focus(); return; }
      if (!f.einwilligung.checked) { kMelde('Bitte bestätigen Sie die Einwilligung zum Datenschutz.'); f.einwilligung.focus(); return; }
      kKnopf.disabled = true; kMelde('Wird gesendet …', true);
      var daten = { name: f.name.value, email: f.email.value, telefon: f.telefon.value, betrieb: f.betrieb.value, nachricht: f.nachricht.value,
                    website: f.website.value, einwilligung: '1', zeit: String(kZeit) };
      fetch('/api/kontakt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(daten) })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }).then(function (j) { return { code: r.status, j: j }; }); })
        .then(function (x) {
          kKnopf.disabled = false;
          if (x.j.ok) { kForm.reset(); kMelde('Danke! Ihre Nachricht ist angekommen. Ich melde mich bei Ihnen.', true); return; }
          if (x.code === 429) kMelde('Zu viele Anfragen in kurzer Zeit. Bitte später erneut versuchen oder an kontakt@bloomlogic.de schreiben.');
          else kMelde('Das hat leider nicht geklappt. Bitte schreiben Sie direkt an kontakt@bloomlogic.de.');
        })
        .catch(function () { kKnopf.disabled = false; kMelde('Das hat leider nicht geklappt. Bitte schreiben Sie direkt an kontakt@bloomlogic.de.'); });
    });
  }

  /* Software: Auftrag tippt sich, Positionen kommen, Summe zaehlt, E-Rechnung geht raus */
  var app = document.querySelector('#seite .mini-app');
  if (app) {
    var felder = app.querySelectorAll('.ma-felder span'), pos = app.querySelectorAll('.ma-pos div');
    var status = app.querySelector('.ma-kopf em'), summe = app.querySelector('.ma-fuss b'), knopf = app.querySelector('.ma-knopf');
    var werte = [248, 86, 152];
    function leer() {
      felder.forEach(function (f) { f.textContent = ''; }); pos.forEach(function (d) { d.classList.remove('da'); });
      status.textContent = 'Offen'; status.classList.remove('fertig'); summe.textContent = euro(0);
      knopf.classList.remove('gesendet'); knopf.lastChild.textContent = 'E-Rechnung versenden';
    }
    function zaehle(von, bis, lauf) {
      var t0 = performance.now();
      return new Promise(function (r) {
        (function f(now) {
          var k = Math.min(1, (now - t0) / 500), e = 1 - Math.pow(1 - k, 3);
          summe.textContent = euro(von + (bis - von) * e);
          if (k < 1 && lauf.an) requestAnimationFrame(f); else r();
        })(t0);
      });
    }
    schleife(app, async function (lauf) {
      leer(); await warte(500);
      for (var i = 0; i < felder.length && lauf.an; i++) { await tippen(felder[i], felder[i].dataset.text, lauf, 45); await warte(220); }
      var s = 0;
      for (var j = 0; j < pos.length && lauf.an; j++) { pos[j].classList.add('da'); await warte(250); await zaehle(s, s + werte[j], lauf); s += werte[j]; await warte(200); }
      if (!lauf.an) return;
      status.textContent = 'Erledigt'; status.classList.add('fertig'); await warte(700);
      knopf.classList.add('gesendet'); knopf.lastChild.textContent = 'E-Rechnung versendet';
      await warte(3200);
    }, function () {
      felder.forEach(function (f) { f.textContent = f.dataset.text; }); pos.forEach(function (d) { d.classList.add('da'); });
      status.textContent = 'Erledigt'; status.classList.add('fertig'); summe.textContent = euro(486);
      knopf.classList.add('gesendet'); knopf.lastChild.textContent = 'E-Rechnung versendet';
    });
  }

  /* Web: Suche tippt sich, der Betrieb taucht auf, das Auftragsradar meldet sich */
  var suche = document.querySelector('#seite .mini-suche');
  if (suche) {
    var sf = suche.querySelector('[data-text]'), tr = suche.querySelector('.ms-treffer'), me = suche.querySelector('.ms-meldung');
    schleife(suche, async function (lauf) {
      sf.textContent = ''; tr.classList.remove('da'); me.classList.remove('da'); await warte(600);
      await tippen(sf, sf.dataset.text, lauf, 55); await warte(450);
      if (!lauf.an) return; tr.classList.add('da'); await warte(1400);
      if (!lauf.an) return; me.classList.add('da'); await warte(4200);
    }, function () { sf.textContent = sf.dataset.text; tr.classList.add('da'); me.classList.add('da'); });
  }

  /* Betreuung: die naechtlichen Meldungen kommen nacheinander */
  var log = document.querySelector('#seite .mini-log');
  if (log) {
    var zeilen = log.querySelectorAll('.zeile');
    schleife(log, async function (lauf) {
      zeilen.forEach(function (z) { z.classList.remove('da'); }); await warte(700);
      for (var i = 0; i < zeilen.length && lauf.an; i++) { zeilen[i].classList.add('da'); await warte(900); }
      await warte(4000);
    }, function () { zeilen.forEach(function (z) { z.classList.add('da'); }); });
  }

  /* 3D: Bilder 480 (zusammen) bis 525 (zerlegt) aus dem Film. Maus links = zusammen, rechts = zerlegt.
     Ohne Maus (Handy) zerlegt und schliesst sie sich von selbst, solange die Kachel zu sehen ist.
     Gezeichnet wird auf eine Canvas aus vorgeladenen, dekodierten Bildern (kein Flackern beim Wechsel). Die Bremse
     wird auf 90 % der Hoehe eingepasst, damit auch die Explosionsansicht ganz hineinpasst; der Rand wird mit dem
     Verlauf der Bilder aufgefuellt, so entsteht keine Kante. */
  var k3 = document.querySelector('#seite .k-3d');
  if (k3) {
    var bild = k3.querySelector('img'), cv = document.createElement('canvas'), cx = cv.getContext('2d');
    cv.className = 'k3d-bild'; cv.setAttribute('aria-hidden', 'true');
    bild.parentNode.insertBefore(cv, bild.nextSibling);
    var NR = [], VON = 480, BIS = 525, SCHRITT = 3, geladen = [], endung = '.jpg', jetzt = -1, ziel = 0, ist = 0, laeuft = false;
    var PASS = 0.9, VERLAUF = [[0, '#03DB6C'], [0.25, '#04D083'], [0.5, '#02C695'], [0.75, '#02C0A0'], [1, '#01BCA6']];
    for (var n = VON; n <= BIS; n += SCHRITT) NR.push(n);
    if (NR[NR.length - 1] !== BIS) NR.push(BIS);
    function pfad(n) { return BASIS + 'frames/f_' + ('0000' + n).slice(-4) + endung; }
    function index(k) {
      var i = Math.max(0, Math.min(NR.length - 1, Math.round(k * (NR.length - 1))));
      for (var d = 0; d < NR.length; d++) {          /* naechstes schon geladenes Bild */
        var a = i - d, b = i + d;
        if (a >= 0 && geladen[a]) return a;
        if (b < NR.length && geladen[b]) return b;
      }
      return -1;
    }
    function male(zwang) {
      var i = index(ist); if (i < 0 || (i === jetzt && !zwang) || !cv.width) return;
      jetzt = i;
      var im = geladen[i], W = cv.width, H = cv.height, s = H / im.naturalHeight * PASS;
      var dw = im.naturalWidth * s, dh = im.naturalHeight * s, dx = (W - dw) / 2, dy = (H - dh) / 2;
      var g = cx.createLinearGradient(0, dy, 0, dy + dh);
      VERLAUF.forEach(function (v) { g.addColorStop(v[0], v[1]); });
      cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      cx.drawImage(im, dx, dy, dw, dh);
      k3.classList.add('k3d-live');
    }
    function groesse() {
      var r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      if (!r.width) return;
      cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); male(true);
    }
    if ('ResizeObserver' in window) new ResizeObserver(groesse).observe(cv); else window.addEventListener('resize', groesse);
    function laufen() {
      if (laeuft) return; laeuft = true;
      (function f() {
        ist += (ziel - ist) * 0.2;
        if (Math.abs(ziel - ist) < 0.002) ist = ziel;
        male();
        if (ist !== ziel) requestAnimationFrame(f); else laeuft = false;
      })();
    }
    function ladeAlle() {
      NR.forEach(function (n, i) {
        var im = new Image();
        im.onload = function () {
          var fertig = function () { geladen[i] = im; if (jetzt < 0) { groesse(); } else if (i === index(ist)) male(true); };
          if (im.decode) im.decode().then(fertig, fertig); else fertig();
        };
        im.src = pfad(n);
      });
    }
    var gestartet = false, probe = new Image();
    function start() {
      if (gestartet) return; gestartet = true;
      probe.onload = function () { if (probe.naturalWidth) endung = '.avif'; ladeAlle(); };
      probe.onerror = function () { ladeAlle(); };
      probe.src = BASIS + 'frames/f_0480.avif';
    }
    var maus = window.matchMedia('(hover: hover) and (pointer: fine)').matches, auto = { an: false };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { e.forEach(function (x) { if (x.isIntersecting) start(); }); }, { rootMargin: '400px' }).observe(k3);
    } else start();
    if (maus) {
      k3.addEventListener('mousemove', function (e) { var r = k3.getBoundingClientRect(); ziel = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); laufen(); });
      k3.addEventListener('mouseleave', function () { ziel = 0; laufen(); });
    } else {
      k3.querySelector('.k3d-hinweis span').textContent = 'Zerlegt sich von selbst';
      if (!ruhig) sichtbar(k3, function () {
        if (auto.an) return; auto = { an: true }; var t0 = performance.now(), a = auto;
        (function f(now) {
          if (!a.an) return;
          var t = ((now - t0) / 1000) % 5, k = t < 2 ? t / 2 : t < 2.6 ? 1 : t < 4.6 ? 1 - (t - 2.6) / 2 : 0;
          ist = ziel = k * k * (3 - 2 * k); male(); requestAnimationFrame(f);
        })(t0);
      }, function () { auto.an = false; });
    }
    var fl = k3.querySelector('.film-link');
    if (fl) fl.addEventListener('click', function () { var n = document.querySelector('#einladung .nochmal'); if (n) n.click(); else location.href = BASIS || './'; });
  }
  document.querySelectorAll('#seite [data-film]').forEach(function (a) {
    a.addEventListener('click', function (e) { var n = document.querySelector('#einladung .nochmal'); if (n) { e.preventDefault(); n.click(); } });
  });
})();
