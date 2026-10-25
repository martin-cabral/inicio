/* ==========================================================
   JMC Diseños · Galería de tarjetas digitales
   JavaScript puro, sin dependencias.
   ========================================================== */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     CONFIGURACIÓN  (lo único que normalmente hay que editar)
     --------------------------------------------------------- */
  var CONFIG = {
    // URL del sitio principal (botones "Volver al sitio").
    // Esta es la forma técnica (punycode) de https://jmcdiseños.com y funciona en todos los navegadores.
    // Si el dominio real es otro (por ejemplo https://jmcdisenos.com), cambiá SOLO esta línea.
    SITE_URL: 'https://www.xn--jmcdiseos-r6a.com',

    // Número de WhatsApp: solo dígitos, sin +, espacios ni guiones.
    WHATSAPP_NUMBER: '5493522454829',

    // Cantidad de modelos y carpeta/prefijo de las imágenes.
    TOTAL_MODELS: 57,
    IMAGE_DIR: 'images/modelos/',
    IMAGE_PREFIX: 'modelo',
    IMAGE_EXT: '.jpg',

    // Dígitos con los que se muestra el número (3 → "Modelo 012").
    PAD_DIGITS: 3,

    // Cuántas tarjetas se cargan de inmediato (el resto con carga diferida).
    EAGER_COUNT: 6,

    // Mensajes de WhatsApp
    MSG_GENERAL: 'Hola, quiero consultar por una tarjeta digital de presentación de JMC Diseños. Me gustaría conocer las opciones disponibles y el precio del servicio.',
    msgModel: function (label) {
      return 'Hola, quiero consultar por una tarjeta digital de presentación de JMC Diseños. Me interesa el Modelo ' + label + '. ¿Podrían brindarme información sobre el diseño y el precio?';
    }
  };

  /* ---------------------------------------------------------
     Utilidades
     --------------------------------------------------------- */
  function pad(n) {
    var s = String(n);
    while (s.length < CONFIG.PAD_DIGITS) s = '0' + s;
    return s;
  }

  function imagePath(n) {
    // Los archivos siempre usan 3 dígitos: modelo001.jpg … modelo057.jpg
    var s = String(n);
    while (s.length < 3) s = '0' + s;
    return CONFIG.IMAGE_DIR + CONFIG.IMAGE_PREFIX + s + CONFIG.IMAGE_EXT;
  }

  function whatsappUrl(message) {
    return 'https://wa.me/' + CONFIG.WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  var isAdmin = /(?:^|[?&])admin=1(?:&|$)/.test(window.location.search);
  if (isAdmin) document.body.classList.add('admin');

  /* ---------------------------------------------------------
     Enlaces generales (sitio principal y WhatsApp)
     --------------------------------------------------------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-site-link]'), function (a) {
    a.href = CONFIG.SITE_URL;
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-wa-general]'), function (a) {
    a.href = whatsappUrl(CONFIG.MSG_GENERAL);
  });

  /* ---------------------------------------------------------
     Scroll suave a la galería
     --------------------------------------------------------- */
  var galleryEl = document.getElementById('galeria');
  var scrollBtn = document.querySelector('[data-scroll-gallery]');
  if (scrollBtn && galleryEl) {
    scrollBtn.addEventListener('click', function (e) {
      e.preventDefault();
      galleryEl.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
      try { galleryEl.focus({ preventScroll: true }); } catch (err) { /* sin foco */ }
    });
  }

  /* ---------------------------------------------------------
     Galería: 57 tarjetas
     --------------------------------------------------------- */
  var grid = document.getElementById('gallery-grid');
  var models = []; // { n, label, src, status: 'loading' | 'ok' | 'missing', card, thumb, wa }

  var WA_SVG = '<svg class="wa-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2a9.9 9.9 0 0 0-8.5 14.9L2 22l5.25-1.38A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 1 1 7 3.86Zm4.5-6.13c-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.24-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.1-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.42h-.47c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.05 0 1.2.88 2.37 1 2.54.12.16 1.73 2.64 4.19 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.46-.6 1.66-1.18.2-.58.2-1.07.14-1.18-.06-.1-.23-.16-.47-.28Z"/></svg>';

  function setStatus(model, status) {
    model.status = status;
    var ok = status === 'ok';
    var missing = status === 'missing';

    model.card.classList.toggle('is-loaded', ok);
    model.card.classList.toggle('is-missing', missing);

    // Miniatura: solo se puede ampliar si el archivo existe
    model.thumb.disabled = !ok;
    model.thumb.setAttribute('aria-disabled', ok ? 'false' : 'true');
    model.thumb.setAttribute('aria-label',
      ok ? 'Ampliar Modelo ' + model.label
         : 'Modelo ' + model.label + (missing ? ': imagen no disponible todavía' : ': cargando'));

    // Consulta por WhatsApp: solo si el archivo existe
    if (ok) {
      model.wa.href = whatsappUrl(CONFIG.msgModel(model.label));
      model.wa.removeAttribute('aria-disabled');
      model.wa.removeAttribute('tabindex');
    } else {
      model.wa.removeAttribute('href');
      model.wa.setAttribute('aria-disabled', 'true');
      model.wa.setAttribute('tabindex', '-1');
    }
  }

  function buildCard(n) {
    var label = pad(n);
    var src = imagePath(n);

    var li = document.createElement('li');
    li.className = 'card reveal';
    li.setAttribute('data-model', label);

    var thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'card-thumb';
    thumb.disabled = true;

    var ph = document.createElement('div');
    ph.className = 'placeholder';
    ph.setAttribute('aria-hidden', 'true');
    ph.innerHTML =
      '<span class="placeholder-num">' + label + '</span>' +
      '<span class="placeholder-text">Próximamente</span>' +
      '<span class="placeholder-admin">Falta: ' + src + '</span>';

    var img = document.createElement('img');
    img.alt = 'Tarjeta digital de presentación, Modelo ' + label;
    img.width = 768;
    img.height = 1376;
    img.decoding = 'async';
    img.loading = n <= CONFIG.EAGER_COUNT ? 'eager' : 'lazy';
    if (n <= 2) img.setAttribute('fetchpriority', 'high');

    thumb.appendChild(ph);
    thumb.appendChild(img);

    var foot = document.createElement('div');
    foot.className = 'card-foot';

    var badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = 'Modelo ' + label;

    var wa = document.createElement('a');
    wa.className = 'card-wa';
    wa.target = '_blank';
    wa.rel = 'noopener';
    wa.innerHTML = WA_SVG + '<span class="card-wa-text">Consultar</span>';
    wa.setAttribute('aria-label', 'Consultar por WhatsApp el Modelo ' + label);

    foot.appendChild(badge);
    foot.appendChild(wa);

    li.appendChild(thumb);
    li.appendChild(foot);

    var model = { n: n, label: label, src: src, status: 'loading', card: li, thumb: thumb, wa: wa };
    setStatus(model, 'loading');

    // Los manejadores se registran ANTES de asignar src
    img.addEventListener('load', function () {
      if (img.naturalWidth > 0) {
        setStatus(model, 'ok');
      } else {
        setStatus(model, 'missing');
      }
    });
    img.addEventListener('error', function () {
      setStatus(model, 'missing');
      if (window.console && console.warn) console.warn('[Galería JMC] Imagen no encontrada: ' + src);
      // Sin icono roto: se quita la imagen y queda el marcador de posición
      if (img.parentNode) img.parentNode.removeChild(img);
    });

    thumb.addEventListener('click', function () {
      if (model.status === 'ok') openModal(model, thumb);
    });

    img.src = src;
    return model;
  }

  function buildGallery() {
    var frag = document.createDocumentFragment();
    for (var n = 1; n <= CONFIG.TOTAL_MODELS; n++) {
      var m = buildCard(n);
      models.push(m);
      frag.appendChild(m.card);
    }
    grid.appendChild(frag);
    setupReveal();
  }

  /* ---------------------------------------------------------
     Aparición suave al entrar en pantalla
     --------------------------------------------------------- */
  function setupReveal() {
    var cards = grid.querySelectorAll('.card.reveal');
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(cards, function (c) { c.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    Array.prototype.forEach.call(cards, function (c) { io.observe(c); });
  }

  /* ---------------------------------------------------------
     Ventana modal accesible
     --------------------------------------------------------- */
  var modal = document.getElementById('modal');
  var panel = modal.querySelector('.modal-panel');
  var modalImg = document.getElementById('modal-img');
  var modalTitle = document.getElementById('modal-title');
  var modalWa = document.getElementById('modal-wa');
  var lastFocus = null;
  var closeTimer = null;
  var currentModel = null;

  function focusables() {
    var list = panel.querySelectorAll('a[href], button:not([disabled])');
    return Array.prototype.filter.call(list, function (el) { return el.offsetParent !== null; });
  }

  function openModal(model, opener) {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    currentModel = model;
    lastFocus = opener || document.activeElement;

    modalTitle.textContent = 'Modelo ' + model.label;
    modalImg.alt = 'Tarjeta digital de presentación, Modelo ' + model.label + ' (vista ampliada)';
    modalImg.src = model.src;
    modalWa.href = whatsappUrl(CONFIG.msgModel(model.label));
    modalWa.setAttribute('aria-label', 'Consultar por WhatsApp el Modelo ' + model.label);

    modal.hidden = false;
    document.body.classList.add('modal-open');
    // Forzar reflow para que la transición de apertura se anime
    void modal.offsetWidth;
    modal.classList.add('is-open');

    document.addEventListener('keydown', onKeydown);
    panel.focus({ preventScroll: true });
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.classList.remove('is-open');
    document.removeEventListener('keydown', onKeydown);

    var finish = function () {
      modal.hidden = true;
      modalImg.removeAttribute('src');
      document.body.classList.remove('modal-open');
      closeTimer = null;
      currentModel = null;
      if (lastFocus && typeof lastFocus.focus === 'function') {
        try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* sin foco */ }
      }
    };
    if (prefersReducedMotion()) {
      finish();
    } else {
      closeTimer = setTimeout(finish, 260);
    }
  }

  function onKeydown(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      e.preventDefault();
      closeModal();
      return;
    }
    if (e.key === 'Tab') {
      var items = focusables();
      if (!items.length) { e.preventDefault(); panel.focus(); return; }
      var first = items[0];
      var last = items[items.length - 1];
      var active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  modal.addEventListener('click', function (e) {
    if (e.target.hasAttribute && e.target.hasAttribute('data-close')) closeModal();
  });
  // Clic en el espacio vacío fuera del panel (por ejemplo, márgenes del contenedor)
  modal.addEventListener('mousedown', function (e) {
    if (e.target === modal) closeModal();
  });
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-close-2').addEventListener('click', closeModal);

  // Si la imagen ampliada fallara, se cierra y se marca el modelo como no disponible
  modalImg.addEventListener('error', function () {
    if (!modal.hidden && currentModel) {
      var m = currentModel;
      closeModal();
      setStatus(m, 'missing');
    }
  });

  /* ---------------------------------------------------------
     Inicio
     --------------------------------------------------------- */
  buildGallery();
})();
