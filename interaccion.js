const packs = [{id:3,size:'4 L'}, {id:4,size:'20 L'}, {id:2,size:'200 L'}];
const photo = document.querySelector('#pack');
let current = 0;
function changePack(step) {
  current = (current + step + packs.length) % packs.length;
  const pack = packs[current];
  photo.src = 'assets/praesy-' + pack.id + '.webp';
  photo.alt = 'BioShield Berry en envase de ' + pack.size;
  document.querySelector('#litros').textContent = pack.size;
  photo.classList.remove('swap');
  void photo.offsetWidth;
  photo.classList.add('swap');
}
document.querySelector('#previous').addEventListener('click', () => changePack(-1));
document.querySelector('#next').addEventListener('click', () => changePack(1));
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const hero = document.querySelector('.cover');
let frame = 0;
let scrollAnchor = window.scrollY;
function updateScroll() {
  frame = 0;
  const y = Math.max(0, Math.min(window.scrollY, document.documentElement.scrollHeight - window.innerHeight));
  const hidden = header.classList.contains('header-hidden');
  scrollAnchor = hidden ? Math.max(scrollAnchor, y) : Math.min(scrollAnchor, y);
  if (y <= header.offsetHeight || (hidden && scrollAnchor - y >= 6)) {
    header.classList.remove('header-hidden');
    scrollAnchor = y;
  } else if (!hidden && y - scrollAnchor >= 12 && !header.querySelector(':focus-visible')) {
    if (active) showPanel(null);
    header.classList.add('header-hidden');
    scrollAnchor = y;
  }
  if (!motion.matches && window.scrollY < hero.offsetHeight + 100) {
    hero.style.setProperty('--shift', Math.min(30, window.scrollY * .06) + 'px');
  }
}
window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(updateScroll); }, {passive:true});
const header = document.querySelector('.header');
header.addEventListener('focusin', () => {
  header.classList.remove('header-hidden');
  scrollAnchor = window.scrollY;
});
const groups = [...header.querySelectorAll('.nav-group')];
const menuButton = header.querySelector('.menu-trigger');
const indexMenu = header.querySelector('#menu');
const controls = [...header.querySelectorAll('.nav-toggle'), menuButton];
let active = null;
let closeTimer;

function showPanel(next) {
  clearTimeout(closeTimer);
  active = next;
  for (const control of controls) {
    const open = control === next;
    control.setAttribute('aria-expanded', String(open));
    document.getElementById(control.getAttribute('aria-controls')).inert = !open;
  }
  menuButton.setAttribute('aria-label', next === menuButton ? 'Cerrar menú' : 'Abrir menú');
}

for (const group of groups) {
  const button = group.querySelector('button');
  group.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') showPanel(button);
  });
  group.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse' && !group.contains(document.activeElement))
      closeTimer = setTimeout(() => showPanel(null), 200);
  });
  button.addEventListener('click', event => {
    showPanel(active === button && !event.detail ? null :
      event.pointerType === 'mouse' ? button : active === button ? null : button);
  });
  button.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      showPanel(button);
      group.querySelector('a').focus();
    }
  });
}
menuButton.addEventListener('click', () => showPanel(active === menuButton ? null : menuButton));
header.addEventListener('focusout', event => {
  if (active && !active.closest('.nav-group')?.contains(event.relatedTarget)
      && event.relatedTarget !== menuButton && !indexMenu.contains(event.relatedTarget)) showPanel(null);
});
document.addEventListener('click', event => {
  if (!header.contains(event.target) || event.target.closest('a')) showPanel(null);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && active) {
    active.focus();
    showPanel(null);
  }
});
matchMedia('(max-width:680px)').addEventListener('change', () => showPanel(null));

function prepareHeading(heading) {
  const label = heading.textContent.trim();
  heading.setAttribute('aria-label', label);
  const words = label.split(/\s+/).map(text => {
    const mask = document.createElement('span');
    mask.className = 'word-mask';
    mask.setAttribute('aria-hidden', 'true');
    const word = document.createElement('span');
    word.textContent = text;
    mask.append(word);
    return mask;
  });
  heading.replaceChildren(...words.flatMap((word, index) => index ? [' ', word] : [word]));
}

function revealHeading(heading) {
  const masks = [...heading.children];
  const byWord = heading.closest('.pc-context');
  const tops = masks.map(mask => mask.offsetTop);
  const lines = [...new Set(tops)];
  masks.forEach((mask, index) => {
    const delay = byWord ? index * 55 : lines.indexOf(tops[index]) * 95;
    mask.style.setProperty('--delay', delay + 'ms');
  });
}

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    const stagger = new Map();
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      observer.unobserve(el);
      if (el.matches('h2')) {
        if (!motion.matches) revealHeading(el);
        el.classList.remove('reveal-pending');
        continue;
      }
      el.classList.remove('reveal-pending');
      if (motion.matches) continue;
      const rank = stagger.get(el.parentElement) || 0;
      stagger.set(el.parentElement,rank+1);
      const media = el.matches('figure');
      el.animate(media ? [{clipPath:'inset(0 0 18% 0)',opacity:.35},{clipPath:'inset(0)',opacity:1}] :
        [{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'none'}],
        {duration:media ? 900 : 650, delay:Math.min(rank,4)*65,fill:'backwards',easing:'cubic-bezier(.2,.75,.2,1)'});
    }
  }, {threshold:.03});
  document.querySelectorAll('.pc h2,.pc-context-grid>p,.pc-rows article,.pc-stats>div,.pc figure,.pc-metrics>div,.pc-team-grid article,.pc-chain li,.pc-commercial article,.pc-impact-number,.pc-table-wrap,.qa-list details,.foot-banner blockquote').forEach(el => {
    if (el.matches('h2')) prepareHeading(el);
    el.classList.add('reveal-pending');
    observer.observe(el);
  });
}
