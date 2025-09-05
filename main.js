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
// ✅ 统一用函数切换 hidden/aria
function setDrawer(open){
  if (!drawer || !burger) return;
  burger.setAttribute('aria-expanded', String(open));
  if (open) drawer.classList.add('open');
  else drawer.classList.remove('open');
}

// 初始：移动端关闭，桌面端确保关闭
setDrawer(false);

if (burger && drawer) {
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') === 'true';
    setDrawer(!open);
  });
  // 点击链接关闭
  drawer.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => setDrawer(false))
  );
}

// ✅ 视口变化守卫：切到桌面强制关闭；回到移动端保持关闭初始态
const MQ = window.matchMedia('(min-width: 901px)');
function handleViewportChange(){
  if (MQ.matches){
    // 桌面：保证抽屉关闭
    setDrawer(false);
  } else {
    // 移动：保持默认关闭（不强制打开，避免“刷新即展开”）
    drawer && (drawer.hidden = true);
    burger && burger.setAttribute('aria-expanded', 'false');
  }
}
handleViewportChange();
MQ.addEventListener?.('change', handleViewportChange);

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
