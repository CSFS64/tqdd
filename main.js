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

document.addEventListener('DOMContentLoaded', () => {
  // 折叠面板展开/收起（手风琴：一次只展开一个）
  const toggles = document.querySelectorAll('.collapsible__toggle');

  toggles.forEach(btn => {
    const content = btn.nextElementSibling;
    const arrow   = btn.querySelector('.arrow');

    // 初始为收起
    btn.classList.remove('active');
    btn.setAttribute('aria-expanded', 'false');
    if (content) content.style.maxHeight = '0px';

    btn.addEventListener('click', () => {
      const isOpen = btn.classList.contains('active');

      // 手风琴：先关闭其他已展开的
      document.querySelectorAll('.collapsible__toggle.active').forEach(other => {
        if (other === btn) return;
        other.classList.remove('active');
        other.setAttribute('aria-expanded', 'false');
        const otherArrow = other.querySelector('.arrow');
        const otherContent = other.nextElementSibling;
        if (otherArrow) otherArrow.textContent = '▶';
        if (otherContent) otherContent.style.maxHeight = '0px';
      });

      if (isOpen) {
        // 关闭自己
        btn.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');
        if (arrow) arrow.textContent = '▶';
        if (content) content.style.maxHeight = '0px';
      } else {
        // 展开自己
        btn.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
        if (arrow) arrow.textContent = '▼';
        if (content) {
          // 先清零再取 scrollHeight，确保动画准确
          content.style.maxHeight = '0px';
          // 下一帧设置为内容高度，触发过渡动画
          requestAnimationFrame(() => {
            content.style.maxHeight = content.scrollHeight + 'px';
          });
        }
      }
    });
  });

  // 点击“进行交易”跳转
  const tradeBtn = document.getElementById('tradeBtn');
  if (tradeBtn) {
    tradeBtn.addEventListener('click', () => {
      window.open('trade.html', '_blank');
    });
  }
});

// ===== 议程：从接口拉数据并渲染 =====
(function initAgendaFromApi(){
  const AGENDA_LIST_ENDPOINT = '/api/agenda/list';

  const tabsWrap   = document.getElementById('agendaTabs');
  const panelsWrap = document.getElementById('agendaPanels');
  const statusEl   = document.getElementById('agendaStatus');

  if (!tabsWrap || !panelsWrap) return;

  // 工具：安全文本
  const esc = (s) => String(s ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;')
    .replaceAll("'","&#39;");

  // 渲染：标签 + 面板
  function render(items){
    tabsWrap.innerHTML   = '';
    panelsWrap.innerHTML = '';
    statusEl.textContent = '';

    if (!Array.isArray(items) || items.length === 0){
      statusEl.textContent = '暂无议程';
      return;
    }

    items.forEach((it, idx) => {
      const idTab   = `ag-tab-${idx+1}`;
      const idPanel = `ag-panel-${idx+1}`;
      const tagText = (Array.isArray(it.tags) && it.tags[0]) ? it.tags[0] : (it.tag || it.title || `议程 ${idx+1}`);

      // 标签
      const btn = document.createElement('button');
      btn.className = 'agenda-tab' + (idx === 0 ? ' is-active' : '');
      btn.id = idTab;
      btn.setAttribute('role','tab');
      btn.setAttribute('aria-controls', idPanel);
      btn.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
      btn.textContent = tagText;
      tabsWrap.appendChild(btn);

      // 面板
      const art = document.createElement('article');
      art.className = 'agenda-panel' + (idx === 0 ? ' is-active' : '');
      art.id = idPanel;
      art.setAttribute('role','tabpanel');
      art.setAttribute('aria-labelledby', idTab);

      // 友好显示截止日期
      let deadlineLine = '';
      if (it.deadline && Number(it.deadline)) {
        const d = new Date(Number(it.deadline));
        if (!isNaN(d)) {
          const mm = String(d.getMonth()+1).padStart(2,'0');
          const dd = String(d.getDate()).padStart(2,'0');
          const hh = String(d.getHours()).padStart(2,'0');
          const mi = String(d.getMinutes()).padStart(2,'0');
          deadlineLine = ` · 截止：${mm}/${dd} ${hh}:${mi}`;
        }
      }

      // 可选跳转链接（你在创建议程时有传 url 字段的话优先使用）
      const href = (it.url && typeof it.url === 'string') ? it.url : `agenda/detail.html?id=${encodeURIComponent(it.id)}`;

      art.innerHTML = `
        <h3 class="agenda-title">
          <a href="${esc(href)}" target="_blank" rel="noopener">${esc(it.title || '未命名议程')}</a>
        </h3>
        <p class="agenda-meta">提交人：${esc(it.author || '管理员')}${deadlineLine}</p>
        <p>${esc(it.desc || '')}</p>
      `;
      panelsWrap.appendChild(art);

      // 事件绑定
      btn.addEventListener('click', () => activate(idx));
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') activate(Math.min(idx+1, items.length-1));
        if (e.key === 'ArrowLeft')  activate(Math.max(idx-1, 0));
      });
    });

    // 手机端左右滑动 → 自动高亮对应标签
    panelsWrap.addEventListener('scroll', onScrollSync, { passive:true });

    // 初始高亮
    activate(0);
  }

  // 切换激活项
  function activate(i){
    const tabs   = Array.from(tabsWrap.querySelectorAll('.agenda-tab'));
    const panels = Array.from(panelsWrap.querySelectorAll('.agenda-panel'));

    tabs.forEach((t, idx) => {
      const on = idx === i;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    panels.forEach((p, idx) => {
      const on = idx === i;
      p.classList.toggle('is-active', on);
      if (on) p.scrollIntoView({ behavior:'smooth', inline:'center', block:'nearest' });
    });
  }

  // 滚动同步标签
  let ticking = false;
  function onScrollSync(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const panels = Array.from(panelsWrap.querySelectorAll('.agenda-panel'));
      if (!panels.length) { ticking = false; return; }
      const viewportLeft = panelsWrap.getBoundingClientRect().left;
      const center = viewportLeft + panelsWrap.clientWidth / 2;

      let best = 0;
      let bestDist = Infinity;
      panels.forEach((p, idx) => {
        const r = p.getBoundingClientRect();
        const mid = r.left + r.width / 2;
        const dist = Math.abs(mid - center);
        if (dist < bestDist) { bestDist = dist; best = idx; }
      });

      // 只更新 tab 的样式，不强制滚动（避免抖动）
      const tabs = Array.from(tabsWrap.querySelectorAll('.agenda-tab'));
      tabs.forEach((t, idx) => {
        const on = idx === best;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      ticking = false;
    });
  }

  // 拉取数据
  async function load(){
    statusEl.textContent = '加载中…';
    try{
      const res = await fetch(AGENDA_LIST_ENDPOINT, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.ok) throw new Error('接口返回失败');
      render(json.items || []);
    }catch(e){
      statusEl.textContent = '加载失败，请稍后再试';
      // 同时清空容器，避免残留
      tabsWrap.innerHTML = '';
      panelsWrap.innerHTML = '';
    }
  }

  load();
})();
