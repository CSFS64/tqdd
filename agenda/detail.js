(function(){
  const $ = (sel)=>document.querySelector(sel);

  const titleEl = $('#agTitle');
  const metaEl  = $('#agMeta');
  const descEl  = $('#agDesc');

  const voteBox = $('#voteBox');
  const voteForm = $('#voteForm');
  const voteBtn  = $('#voteSubmit');
  const voteMsg  = $('#voteMsg');

  const qaBox = $('#qaBox');
  const qaText = $('#qaText');
  const qaBtn  = $('#qaSubmit');
  const qaMsg  = $('#qaMsg');

  const params = new URLSearchParams(location.search);
  const agendaId = params.get('id') || '';

  if (!agendaId){
    titleEl.textContent = '未找到议程';
    return;
  }

  // 简单转义
  const esc = (s)=>String(s??'')
    .replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;')
    .replaceAll("'","&#39;");

  // 从公共列表里找该 ID（避免再改 Worker；若你已加 /api/agenda/item，可直接请求它）
  async function loadAgenda(){
    try{
      const res = await fetch('/api/agenda/list', { headers: { 'Accept':'application/json' } });
      const json = await res.json();
      if (!json.ok) throw new Error('接口失败');
      const it = (json.items||[]).find(x => x.id === agendaId);
      if (!it) { titleEl.textContent = '议程不存在或已删除'; return; }

      // 头部信息
      titleEl.innerHTML = esc(it.title || '未命名议程');
      const parts = [];
      parts.push(`提交人：${esc(it.author||'管理员')}`);
      if (it.deadline && Number(it.deadline)){
        const d = new Date(Number(it.deadline));
        if (!isNaN(d)){
          const Y=d.getFullYear(), M=String(d.getMonth()+1).padStart(2,'0'),
                D=String(d.getDate()).padStart(2,'0'), h=String(d.getHours()).padStart(2,'0'),
                m=String(d.getMinutes()).padStart(2,'0');
          parts.push(`截止：${Y}/${M}/${D} ${h}:${m}`);
        }
      }
      metaEl.textContent = parts.join(' · ');
      descEl.textContent = it.desc || '';

      if (it.type === 'vote'){
        // 渲染单选项
        voteBox.hidden = false;
        voteForm.innerHTML = '';
        (it.options || []).forEach((opt, idx)=>{
          const id = `opt-${idx}`;
          const div = document.createElement('label');
          div.style.display = 'flex';
          div.style.gap = '.5rem';
          div.style.alignItems = 'center';
          div.innerHTML = `
            <input type="radio" name="option" value="${esc(opt)}" id="${id}">
            <span>${esc(opt)}</span>
          `;
          voteForm.appendChild(div);
        });

        voteBtn.addEventListener('click', async ()=>{
          voteMsg.textContent = '';
          const data = new FormData(voteForm);
          const option = data.get('option');
          if (!option){
            voteMsg.className = 'msg msg--err';
            voteMsg.textContent = '请先选择一个选项';
            return;
          }
          voteBtn.disabled = true;
          try{
            const res = await fetch('/api/agenda/vote', {
              method:'POST',
              headers:{ 'Content-Type':'application/json', 'Accept':'application/json' },
              body: JSON.stringify({ id: agendaId, option })
            });
            const json = await res.json().catch(()=>({}));
            if (res.ok && json.ok){
              voteMsg.className = 'msg msg--ok';
              voteMsg.textContent = '提交成功，感谢投票！';
            } else if (json.error === 'already_voted'){
              voteMsg.className = 'msg msg--err';
              voteMsg.textContent = '你已经投过票了';
            } else if (json.error === 'invalid_option'){
              voteMsg.className = 'msg msg--err';
              voteMsg.textContent = '选项无效，请刷新页面重试';
            } else {
              voteMsg.className = 'msg msg--err';
              voteMsg.textContent = '提交失败，请稍后再试';
            }
          }catch(e){
            voteMsg.className = 'msg msg--err';
            voteMsg.textContent = '网络错误，请稍后再试';
          }finally{
            voteBtn.disabled = false;
          }
        });

      } else {
        // 问答区
        qaBox.hidden = false;
        qaBtn.addEventListener('click', async ()=>{
          qaMsg.textContent = '';
          const text = qaText.value.trim();
          if (!text){
            qaMsg.className = 'msg msg--err';
            qaMsg.textContent = '请输入你的观点';
            return;
          }
          qaBtn.disabled = true;
          try{
            const res = await fetch('/api/agenda/answer', {
              method:'POST',
              headers:{ 'Content-Type':'application/json', 'Accept':'application/json' },
              body: JSON.stringify({ id: agendaId, text })
            });
            const json = await res.json().catch(()=>({}));
            if (res.ok && json.ok){
              qaMsg.className = 'msg msg--ok';
              qaMsg.textContent = '已提交，感谢参与讨论！';
              qaText.value = '';
            } else {
              qaMsg.className = 'msg msg--err';
              qaMsg.textContent = '提交失败，请稍后再试';
            }
          }catch(e){
            qaMsg.className = 'msg msg--err';
            qaMsg.textContent = '网络错误，请稍后再试';
          }finally{
            qaBtn.disabled = false;
          }
        });
      }
    }catch(e){
      titleEl.textContent = '加载失败';
      metaEl.textContent = '';
      descEl.textContent = '';
    }
  }

  loadAgenda();
})();
