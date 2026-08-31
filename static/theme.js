/* Light/dark toggle. No stored choice means the system preference wins, and
   toggling back to whatever the system says drops the override again. */
(function () {
  var root = document.documentElement;
  var btn = document.querySelector('.theme-toggle');
  if (!btn) return;

  var mq = window.matchMedia('(prefers-color-scheme: dark)');

  function system() { return mq.matches ? 'dark' : 'light'; }
  function current() { return root.getAttribute('data-theme') || system(); }

  function relabel() {
    btn.setAttribute('aria-label',
      'Switch to ' + (current() === 'dark' ? 'light' : 'dark') + ' theme');
  }

  function announce() {
    window.dispatchEvent(new CustomEvent('themechange'));
  }

  btn.hidden = false;
  relabel();

  btn.addEventListener('click', function () {
    var next = current() === 'dark' ? 'light' : 'dark';
    if (next === system()) {
      root.removeAttribute('data-theme');           // back to following the system
      try { localStorage.removeItem('theme'); } catch (e) {}
    } else {
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    }
    relabel();
    announce();
  });

  if (mq.addEventListener) {
    mq.addEventListener('change', function () { relabel(); announce(); });
  }
})();
