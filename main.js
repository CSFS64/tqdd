// 顶部年份
document.getElementById('y').textContent = new Date().getFullYear();

// 滚动时让导航加深背景（SpaceX 风）
const nav = document.getElementById('nav');
const onScroll = () => {
  if (window.scrollY > 10) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
};
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// 移动端抽屉菜单
const burger = document.getElementById('burger');
const drawer = document.getElementById('drawer');
if (burger && drawer) {
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open));
    drawer.hidden = open;
  });
  // 点击链接关闭
  drawer.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      burger.setAttribute('aria-expanded', 'false');
      drawer.hidden = true;
    })
  );
}

// 背景视频策略：若用户偏好减少动态，则暂停；否则尝试播放
const video = document.getElementById('bg-video');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function handleMotionPref() {
  if (!video) return;
  if (prefersReducedMotion.matches) {
    video.removeAttribute('autoplay');
    video.pause();
  } else {
    // iOS/移动端必须 muted + playsinline 才能自动播放
    video.muted = true;
    video.play().catch(() => {
      // 自动播放失败时，允许用户点击首屏任意处开始
      const once = () => { video.play().finally(() => document.removeEventListener('click', once)); };
      document.addEventListener('click', once, { once: true });
    });
  }
}
handleMotionPref();
prefersReducedMotion.addEventListener?.('change', handleMotionPref);

// 可选：滚动观察，高亮当前区块的导航（桌面）
const links = [...document.querySelectorAll('.nav__links a')];
const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
if ('IntersectionObserver' in window && links.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const idx = sections.indexOf(entry.target);
      if (idx >= 0) {
        const link = links[idx];
        if (entry.isIntersecting) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: [0, 1] });
  sections.forEach(sec => io.observe(sec));
}
