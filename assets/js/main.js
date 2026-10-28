(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var spotlight = document.querySelector('.spotlight');
  if (spotlight && !reduceMotion && window.matchMedia('(hover: hover)').matches) {
    var targetX = 0;
    var targetY = 0;
    var currentX = 0;
    var currentY = 0;
    var raf = null;
    var hasPointer = false;

    var paint = function () {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;
      spotlight.style.setProperty('--spot-x', currentX + 'px');
      spotlight.style.setProperty('--spot-y', currentY + 'px');

      if (Math.abs(targetX - currentX) > 0.5 || Math.abs(targetY - currentY) > 0.5) {
        raf = requestAnimationFrame(paint);
      } else {
        raf = null;
      }
    };

    document.addEventListener(
      'pointermove',
      function (event) {
        if (!hasPointer) {
          hasPointer = true;
          currentX = event.clientX;
          currentY = event.clientY;
        }
        targetX = event.clientX;
        targetY = event.clientY;
        if (raf === null) {
          raf = requestAnimationFrame(paint);
        }
      },
      { passive: true }
    );
  }

  var sections = Array.prototype.slice.call(document.querySelectorAll('.section'));
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));

  var setActive = function (id) {
    links.forEach(function (link) {
      var isActive = link.getAttribute('data-section') === id;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  if ('IntersectionObserver' in window && sections.length) {
    var visible = new Map();

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        var bestId = null;
        var bestRatio = 0;
        visible.forEach(function (ratio, id) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        });

        if (bestId) {
          setActive(bestId);
        }
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.15, 0.3, 0.5, 0.75, 1] }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  var dialog = document.getElementById('timetravel-dialog');
  var openBtn = document.getElementById('timetravel-open');
  var closeBtn = document.getElementById('timetravel-close');
  var dismissBtn = document.getElementById('timetravel-dismiss');
  var retroBtn = document.getElementById('retro-toggle');

  var closeDialog = function () {
    if (!dialog || !dialog.open) return;
    dialog.close();
    if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
  };

  if (dialog && openBtn) {
    openBtn.addEventListener('click', function () {
      openBtn.setAttribute('aria-expanded', 'true');
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
    });

    dialog.addEventListener('close', function () {
      openBtn.setAttribute('aria-expanded', 'false');
    });

    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) closeDialog();
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeDialog);
  if (dismissBtn) dismissBtn.addEventListener('click', closeDialog);

  if (retroBtn) {
    retroBtn.addEventListener('click', function () {
      var pressed = retroBtn.getAttribute('aria-pressed') === 'true';
      retroBtn.setAttribute('aria-pressed', String(!pressed));
      retroBtn.textContent = pressed ? 'Engage CRT mode' : 'Disengage CRT mode';
      document.body.classList.toggle('retro', !pressed);
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeDialog();
  });
})();
