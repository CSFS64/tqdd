// 顶部年份
document.getElementById('y').textContent = new Date().getFullYear();

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

function setDrawer(open){
  if (!drawer || !burger) return;
  burger.setAttribute('aria-expanded', String(open));
  if (open) drawer.classList.add('open');
  else drawer.classList.remove('open');
}

setDrawer(false);

if (burger && drawer) {
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') === 'true';
    setDrawer(!open);
  });
  drawer.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => setDrawer(false))
  );
}

const MQ = window.matchMedia('(min-width: 901px)');
function handleViewportChange(){
  if (MQ.matches){
    // 桌面：清除菜单栏
    setDrawer(false);
  } else {
    // 移动：菜单栏保持默认关闭
    setDrawer(false);
  }
}
handleViewportChange();
MQ.addEventListener?.('change', handleViewportChange);

// 背景视频策略
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
      // 自动播放失败时点击任意处开始
      const once = () => { video.play().finally(() => document.removeEventListener('click', once)); };
      document.addEventListener('click', once, { once: true });
    });
  }
}
handleMotionPref();
prefersReducedMotion.addEventListener?.('change', handleMotionPref);

// 高亮当前区块的导航
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

// 更新倒计时
function updateCountdowns() {
  const events = document.querySelectorAll('.event');
  events.forEach(event => {
    const countdownElement = event.querySelector('.countdown');
    const startTime = new Date(event.getAttribute('data-start-time'));
    const repeat = event.getAttribute('data-repeat') === 'true';

    // 获取当前时间（北京时间）
    const now = new Date();  // 当前时间是系统时间，假设用户设备时间就是北京时间

    // 计算剩余时间（毫秒）
    let timeRemaining = startTime.getTime() - now.getTime();

    if (timeRemaining < 0) {
      if (repeat) {
        // 为每天重复的活动重新计算倒计时
        const oneDay = 24 * 60 * 60 * 1000;
        timeRemaining = oneDay - (now % oneDay);
      } else {
        timeRemaining = 0; // 归零不重复活动的倒计时
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

// 页面加载时立即执行
updateCountdowns();

document.querySelectorAll('.event__toggle-description').forEach(button => {
  button.addEventListener('click', function() {
    const eventDescription = this.closest('.event').querySelector('.event__description');
    const isExpanded = eventDescription.style.maxHeight !== '0px';
    
    if (isExpanded) {
      eventDescription.style.maxHeight = '0';
      this.textContent = '展开介绍';
    } else {
      eventDescription.style.maxHeight = eventDescription.scrollHeight + 'px';
      this.textContent = '收起介绍';
    }
  });
});

// 展示已有申请
const LIST_ENDPOINT = '/api/list';
const VISIBLE_COUNT = 5; // 先展示几条

// 性别映射中文
const genderMap = {
  'male': '男',
  'female': '女',
  'non-binary': '非二元',
  'transgender': '跨性别',
  'genderqueer': '性别酷儿',
  'other': '其他'
};

// 在线时段映射
const slotsMap = {
  'weekday': '工作日',
  'weekend': '周末',
  'morning': '早晨',
  'afternoon': '下午',
  'evening': '晚上',
  'night': '夜晚'
};

function escapeHTML(str) {
  return String(str ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#39;");
}

function slotsToChinese(slots){
  if (!Array.isArray(slots)) return '';
  return slots.map(s => slotsMap[s] || s).join('、');
}

async function loadMatches() {
  const tbody  = document.getElementById('matchTbody');
  const extra  = document.getElementById('matchTbodyExtra');
  const toggle = document.getElementById('toggleMore');
  const table  = document.getElementById('matchTable');

  if (!tbody || !extra) return;

  tbody.innerHTML = `<tr><td colspan="5" style="color:#999;">加载中…</td></tr>`;
  extra.innerHTML = '';
  if (toggle) {
    toggle.hidden = true;
    toggle.dataset.expanded = 'false';
    toggle.textContent = '展开更多';
  }

  try {
    const res  = await fetch(LIST_ENDPOINT, { headers: { 'Accept':'application/json' } });
    const json = await res.json();

    if (!json.ok || !Array.isArray(json.items)) {
      tbody.innerHTML = `<tr><td colspan="5" style="color:#999;">加载失败</td></tr>`;
      return;
    }

    const items = json.items;
    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="color:#999;">暂无申请</td></tr>`;
      return;
    }

    const renderRow = (item) => {
      const tr = document.createElement('tr');
      const genderText = genderMap[item.gender] || '未填写';
      const slotsText  = slotsToChinese(item.slots);

      tr.innerHTML = `
        <td class="nickname">${escapeHTML(item.nickname || '')}</td>
        <td class="contact">${escapeHTML(item.contact || '')}</td>
        <td class="gender">${escapeHTML(genderText)}</td>
        <td class="slots">${escapeHTML(slotsText)}</td>
        <td class="note">${escapeHTML(item.note || '')}</td>
      `;
      return tr;
    };

    tbody.innerHTML = '';
    items.slice(0, VISIBLE_COUNT).forEach(item => tbody.appendChild(renderRow(item)));

    // 隐藏条目
    const rest = items.slice(VISIBLE_COUNT);
    if (rest.length > 0 && toggle) {
      extra.innerHTML = '';
      rest.forEach(item => extra.appendChild(renderRow(item)));
      extra.hidden = true;
      toggle.hidden = false;

      toggle.onclick = () => {
        const expanded = toggle.dataset.expanded === 'true';
        extra.hidden = expanded;
        toggle.dataset.expanded = expanded ? 'false' : 'true';
        toggle.textContent = expanded ? '展开更多' : '收起';
        if (!expanded) toggle.scrollIntoView({ behavior:'smooth', block:'nearest' });
      };
    } else if (toggle) {
      toggle.hidden = true;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:#999;">网络错误</td></tr>`;
  }
}

// 页面加载时执行
loadMatches();
