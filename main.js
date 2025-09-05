// 年份
document.getElementById('y').textContent = new Date().getFullYear();

// 滚动时让导航加深背景
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

function setBodyScrollLock(lock) {
  document.documentElement.style.overflow = lock ? 'hidden' : '';
  document.body.style.overflow = lock ? 'hidden' : '';
}

if (burger && drawer) {
  const toggleDrawer = () => {
    const open = burger.getAttribute('aria-expanded') === 'true';
    const next = !open;
    burger.setAttribute('aria-expanded', String(next));
    drawer.hidden = !next;
    setBodyScrollLock(next); // 打开抽屉时禁用页面滚动
  };

  burger.addEventListener('click', toggleDrawer);

  // 点击抽屉内链接自动关闭
  drawer.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      burger.setAttribute('aria-expanded', 'false');
      drawer.hidden = true;
      setBodyScrollLock(false);
    })
  );

  // 按 ESC 关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !drawer.hidden) {
      burger.setAttribute('aria-expanded', 'false');
      drawer.hidden = true;
      setBodyScrollLock(false);
    }
  });
}

// 背景视频：尊重减少动态偏好
const video = document.getElementById('bg-video');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function handleMotionPref() {
  if (!video) return;
  if (prefersReducedMotion.matches) {
    video.removeAttribute('autoplay');
    video.pause();
  } else {
    video.muted = true;
    video.play().catch(() => {
      // 自动播放失败时，第一次点击页面后播放
      const once = () => { video.play().finally(() => document.removeEventListener('click', once)); };
      document.addEventListener('click', once, { once: true });
    });
  }
}
handleMotionPref();
prefersReducedMotion.addEventListener?.('change', handleMotionPref);

// 高亮当前区块的导航（桌面）
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
