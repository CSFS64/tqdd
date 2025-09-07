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
drawer?.removeAttribute('hidden');

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
    setDrawer(false);
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

document.addEventListener('WeixinJSBridgeReady', () => {
  const video = document.getElementById('bg-video');
  if (video) video.play().catch(() => {});
});

document.addEventListener('click', () => {
  const video = document.getElementById('bg-video');
  if (video && video.paused) video.play().catch(() => {});
}, { once: true });

// 同居匹配：弹窗 + 提交
const matchBtn     = document.getElementById('matchBtn');
const matchDialog  = document.getElementById('matchDialog');
const matchForm    = document.getElementById('matchForm');
const matchMsg     = document.getElementById('matchMsg');
const closeMatch   = document.getElementById('closeMatch');

// 统一：是否原生 <dialog>
const isDialogEl = !!(window.HTMLDialogElement && matchDialog instanceof HTMLDialogElement);
function openMatch() {
  if (isDialogEl && typeof matchDialog.showModal === 'function') {
    matchDialog.showModal();
  } else {
    matchDialog.classList.add('is-open'); // div 模式
  }
}

function closeMatchModal() {
  if (isDialogEl && typeof matchDialog.close === 'function') {
    matchDialog.close();
  } else {
    matchDialog.classList.remove('is-open'); // div 模式
  }
}

matchBtn?.addEventListener('click', openMatch);
closeMatch?.addEventListener('click', closeMatchModal);

// 点击遮罩关闭
if (isDialogEl) {
  matchDialog?.addEventListener('click', (e) => { if (e.target === matchDialog) closeMatchModal(); });
} else {
  // div 模式：点击内容外区域关闭
  matchDialog?.addEventListener('click', (e) => {
    const form = document.getElementById('matchForm');
    if (!form.contains(e.target)) closeMatchModal();
  });
}

// 你的 Worker 接口
const ENDPOINT = 'https://tqdd-match.20060303jjc.workers.dev/submit';

matchForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  matchMsg.hidden = true;

  const data = Object.fromEntries(new FormData(matchForm).entries());
  for (const k in data) if (typeof data[k] === 'string') data[k] = data[k].trim();

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();

    if (json.ok) {
      matchMsg.innerHTML = json.match
        ? `已提交！<br>匹配到 <strong>${json.match.nickname}</strong>（${json.match.score}/10）。<br>联系方式：<strong>${json.match.contact}</strong>`
        : '已提交！暂未找到高匹配度对象，有新申请加入时再来看看～';
    } else {
      matchMsg.textContent = '提交失败，请稍后重试或加群联系：1058848870';
    }
  } catch {
    matchMsg.textContent = '网络异常，稍后再试或加群联系：1058848870';
  }
  matchMsg.hidden = false;
});

// 更新倒计时，计算剩余时间并根据活动类型更新
function updateCountdowns() {
  const events = document.querySelectorAll('.event');
  events.forEach(event => {
    const countdownElement = event.querySelector('.countdown');
    const startTime = new Date(event.getAttribute('data-start-time')); // 直接获取北京时间的活动开始时间
    const repeat = event.getAttribute('data-repeat') === 'true';

    // 获取当前时间（北京时间）
    const now = new Date();  // 当前时间是系统时间，假设用户设备时间就是北京时间

    // 计算剩余时间（毫秒）
    let timeRemaining = startTime.getTime() - now.getTime();

    if (timeRemaining < 0) {
      if (repeat) {
        // 如果活动是每天重复，则重新计算倒计时
        const oneDay = 24 * 60 * 60 * 1000;  // 一天的毫秒数
        timeRemaining = oneDay - (now % oneDay); // 从当前时间开始的下一天
      } else {
        timeRemaining = 0; // 如果活动不是重复的，倒计时归零
      }
    }

    // 计算倒计时的天、时、分、秒
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    // 格式化并显示倒计时
    countdownElement.textContent = `T-${days}D ${hours}:${minutes}:${seconds}`;
  });
}

// 每秒更新一次倒计时
setInterval(updateCountdowns, 1000);

// 页面加载时立即执行一次
updateCountdowns();

// 给每个活动的 "展开介绍" 按钮添加事件监听
document.querySelectorAll('.event__toggle-description').forEach(button => {
  button.addEventListener('click', function() {
    const eventDetails = this.closest('.event').querySelector('.event__description');
    
    // 切换描述部分的显示与隐藏
    if (eventDetails.style.display === 'none' || eventDetails.style.display === '') {
      eventDetails.style.display = 'block'; // 显示活动描述
      this.textContent = '收起介绍'; // 更改按钮文本为“收起介绍”
    } else {
      eventDetails.style.display = 'none'; // 隐藏活动描述
      this.textContent = '展开介绍'; // 更改按钮文本为“展开介绍”
    }
  });
});

