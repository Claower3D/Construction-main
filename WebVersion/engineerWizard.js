// ========== ENGINEER WIZARD — 4-step object creation ==========
(function(){
'use strict';
const ED = window.EngineerData;
let _wizardPhotos = [];
let _wizardEstimate = [];
let _wizardAiResult = null;

function fmt(n){ return Math.round(n).toLocaleString('ru-RU'); }

function open(preDate){
  _wizardPhotos = [];
  _wizardEstimate = [];
  _wizardAiResult = null;
  const ov = document.createElement('div');
  ov.className = 'qaz-modal-overlay';
  ov.id = 'wizardOverlay';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:999999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);overflow-y:auto;padding:1rem';
  ov.innerHTML = `<div id="wizardCard" style="background:#1a1730;border:1px solid rgba(139,92,246,.3);border-radius:20px;padding:1.5rem;max-width:560px;width:100%;color:#f8fafc;max-height:90vh;overflow-y:auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
      <h3 style="margin:0;font-size:1.15rem" id="wizTitle">📸 Шаг 1: Фото объекта</h3>
      <button onclick="document.getElementById('wizardOverlay').remove()" style="background:none;border:none;color:#94a3b8;font-size:1.5rem;cursor:pointer">&times;</button>
    </div>
    <div id="wizSteps" style="display:flex;gap:.25rem;margin-bottom:1.25rem">${[1,2,3,4].map(i=>`<div id="wizS${i}" style="flex:1;height:4px;border-radius:2px;background:${i===1?'linear-gradient(90deg,#8b5cf6,#6366f1)':'rgba(255,255,255,.1)'}"></div>`).join('')}</div>
    <div id="wizBody"></div>
    <div id="wizNav" style="display:flex;gap:.75rem;margin-top:1.25rem">
      <button id="wizPrev" onclick="EngineerWizard._prev()" style="flex:1;padding:.65rem;border-radius:12px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;cursor:pointer;display:none">← Назад</button>
      <button id="wizNext" onclick="EngineerWizard._next()" style="flex:1;padding:.65rem;border-radius:12px;background:linear-gradient(135deg,#f59e0b,#ef4444);border:none;color:#fff;font-weight:700;cursor:pointer">Далее →</button>
    </div>
  </div>`;
  document.body.appendChild(ov);
  _step = 1;
  renderStep();
}

let _step = 1;
const _dateVal = ()=> new Date().toISOString().split('T')[0];

function renderStep(){
  const body = document.getElementById('wizBody');
  const title = document.getElementById('wizTitle');
  const prev = document.getElementById('wizPrev');
  const next = document.getElementById('wizNext');
  if(!body) return;
  prev.style.display = _step > 1 ? '' : 'none';
  [1,2,3,4].forEach(i=>{
    const s = document.getElementById('wizS'+i);
    if(s) s.style.background = i<=_step ? 'linear-gradient(90deg,#8b5cf6,#6366f1)' : 'rgba(255,255,255,.1)';
  });

  if(_step===1){
    title.textContent = '📸 Шаг 1: Фото объекта';
    next.innerHTML = _wizardPhotos.length ? 'Далее → Анализ 🤖' : 'Загрузите фото';
    next.disabled = !_wizardPhotos.length;
    body.innerHTML = `
      <div id="wizDropZone" style="border:2px dashed rgba(139,92,246,.4);border-radius:16px;padding:2rem;text-align:center;cursor:pointer;transition:all .3s;min-height:120px;display:flex;flex-direction:column;align-items:center;justify-content:center">
        <div style="font-size:2.5rem;margin-bottom:.5rem">📷</div>
        <p style="margin:0;color:#94a3b8">Перетащите фото сюда или <span style="color:#8b5cf6;text-decoration:underline">выберите файл</span></p>
        <p style="margin:.25rem 0 0;font-size:.78rem;color:#64748b">Минимум 1 фото. По фото будет расчёт.</p>
        <input type="file" id="wizPhotoInput" accept="image/*" multiple hidden>
      </div>
      <div id="wizPreviews" style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.75rem">${_wizardPhotos.map((p,i)=>`<div style="position:relative;width:70px;height:70px;border-radius:10px;overflow:hidden;border:2px solid rgba(139,92,246,.3)"><img src="${URL.createObjectURL(p)}" style="width:100%;height:100%;object-fit:cover"><button onclick="EngineerWizard._removePhoto(${i})" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,.7);border:none;color:#fff;border-radius:50%;width:20px;height:20px;font-size:.7rem;cursor:pointer">✕</button></div>`).join('')}</div>`;
    const zone = document.getElementById('wizDropZone');
    const inp = document.getElementById('wizPhotoInput');
    zone.onclick = ()=> inp.click();
    zone.ondragover = e=>{ e.preventDefault(); zone.style.borderColor='#8b5cf6'; zone.style.background='rgba(139,92,246,.1)'; };
    zone.ondragleave = ()=>{ zone.style.borderColor='rgba(139,92,246,.4)'; zone.style.background=''; };
    zone.ondrop = e=>{ e.preventDefault(); zone.style.borderColor='rgba(139,92,246,.4)'; zone.style.background=''; addFiles(e.dataTransfer.files); };
    inp.onchange = ()=>{ addFiles(inp.files); inp.value=''; };
  }
  else if(_step===2){
    title.textContent = '🤖 Шаг 2: AI-Анализ + Клиент';
    next.innerHTML = 'Далее → Смета 📊';
    next.disabled = false;
    const ai = _wizardAiResult;
    const aiHtml = ai ? `<div style="background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:12px;padding:.75rem;margin-bottom:1rem">
      <div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:600;color:#22c55e">✅ AI-анализ завершён</span><span style="font-size:.8rem;color:#94a3b8">${ai.confidence||0}%</span></div>
      <p style="margin:.25rem 0 0;font-size:.85rem;color:#cbd5e1">Тип: <strong>${ai.objectLabel||ai.objectType||'—'}</strong></p>
    </div>` : `<div id="wizAiProgress" style="background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.3);border-radius:12px;padding:.75rem;margin-bottom:1rem;text-align:center">
      <div style="font-size:1.5rem;margin-bottom:.25rem" class="spin-emoji">🤖</div>
      <p style="margin:0;font-size:.85rem;color:#a78bfa" id="wizAiText">Запуск AI-анализа...</p>
      <div style="background:rgba(255,255,255,.1);border-radius:4px;height:6px;margin-top:.5rem;overflow:hidden"><div id="wizAiBar" style="height:100%;background:linear-gradient(90deg,#8b5cf6,#6366f1);width:5%;transition:width .3s;border-radius:4px"></div></div>
    </div>`;
    body.innerHTML = aiHtml + `
      <div style="display:grid;gap:.6rem">
        <div><label style="display:block;font-size:.82rem;color:#94a3b8;margin-bottom:.2rem">Имя клиента *</label>
        <input type="text" id="wizClient" placeholder="Иван Петров" value="${document.getElementById('wizClient')?.value||''}" style="width:100%;padding:.55rem;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.15);color:#fff"></div>
        <div><label style="display:block;font-size:.82rem;color:#94a3b8;margin-bottom:.2rem">Телефон</label>
        <input type="tel" id="wizPhone" placeholder="+7 XXX XXX XXXX" value="${document.getElementById('wizPhone')?.value||''}" style="width:100%;padding:.55rem;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.15);color:#fff"></div>
        <div><label style="display:block;font-size:.82rem;color:#94a3b8;margin-bottom:.2rem">Адрес объекта *</label>
        <input type="text" id="wizAddress" placeholder="Город, улица, дом" value="${document.getElementById('wizAddress')?.value||''}" style="width:100%;padding:.55rem;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.15);color:#fff"></div>
        <div><label style="display:block;font-size:.82rem;color:#94a3b8;margin-bottom:.2rem">Тип работ</label>
        <select id="wizType" style="width:100%;padding:.55rem;border-radius:8px;background:#1a1730;border:1px solid rgba(255,255,255,.15);color:#fff">${ED.WORK_TYPES.map(t=>`<option value="${t}">${t}</option>`).join('')}</select></div>
      </div>`;
    if(!ai) runAI();
  }
  else if(_step===3){
    title.textContent = '📊 Шаг 3: Смета';
    next.innerHTML = 'Далее → Назначение 👷';
    if(!_wizardEstimate.length) generateEstimate();
    const total = _wizardEstimate.reduce((s,it)=>s+(it.total||0),0);
    body.innerHTML = `
      <div style="max-height:280px;overflow-y:auto;margin-bottom:.75rem">
        <table style="width:100%;border-collapse:collapse;font-size:.8rem">
          <thead><tr style="border-bottom:1px solid rgba(255,255,255,.1)"><th style="text-align:left;padding:.4rem;color:#94a3b8">Наименование</th><th style="padding:.4rem;color:#94a3b8;width:45px">Ед.</th><th style="padding:.4rem;color:#94a3b8;width:40px">Кол</th><th style="padding:.4rem;color:#94a3b8;width:65px">Цена</th><th style="padding:.4rem;color:#94a3b8;width:75px">Сумма</th></tr></thead>
          <tbody>${_wizardEstimate.map(it=>`<tr style="border-bottom:1px solid rgba(255,255,255,.05)"><td style="padding:.35rem .4rem">${it.name}</td><td style="padding:.35rem;text-align:center;color:#94a3b8">${it.unit}</td><td style="padding:.35rem;text-align:center">${it.qty}</td><td style="padding:.35rem;text-align:right">${fmt(it.price)}</td><td style="padding:.35rem;text-align:right;color:#f59e0b;font-weight:600">${fmt(it.total)}</td></tr>`).join('')}</tbody>
          <tfoot><tr style="border-top:2px solid rgba(139,92,246,.4)"><td colspan="4" style="padding:.5rem .4rem;font-weight:700">ИТОГО</td><td style="padding:.5rem .4rem;text-align:right;font-weight:800;color:#22c55e;font-size:.95rem">${fmt(total)} ₸</td></tr></tfoot>
        </table>
      </div>
      <button onclick="EngineerWizard._addRow()" style="width:100%;padding:.4rem;border-radius:8px;background:rgba(139,92,246,.15);border:1px dashed rgba(139,92,246,.3);color:#a78bfa;cursor:pointer;font-size:.8rem">+ Добавить строку</button>`;
  }
  else if(_step===4){
    title.textContent = '👷 Шаг 4: Назначение и создание';
    next.innerHTML = '✅ Создать объект';
    next.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';
    const brigades = ED.getAllBrigades();
    const total = _wizardEstimate.reduce((s,it)=>s+(it.total||0),0);
    body.innerHTML = `
      <div style="background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.2);border-radius:12px;padding:.75rem;margin-bottom:1rem;text-align:center">
        <div style="font-size:.82rem;color:#94a3b8">Бюджет объекта</div>
        <div style="font-size:1.4rem;font-weight:800;color:#22c55e">${fmt(total)} ₸</div>
      </div>
      <div style="display:grid;gap:.6rem">
        <div><label style="display:block;font-size:.82rem;color:#94a3b8;margin-bottom:.2rem">Бригада / Исполнитель</label>
        <select id="wizBrigade" style="width:100%;padding:.55rem;border-radius:8px;background:#1a1730;border:1px solid rgba(255,255,255,.15);color:#fff">
          ${brigades.map(b=>`<option value="${b.id}">${b.avatar} ${b.name} (${b.spec})</option>`).join('')}
        </select></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem">
          <div><label style="display:block;font-size:.82rem;color:#94a3b8;margin-bottom:.2rem">Дата начала</label>
          <input type="date" id="wizStartDate" value="${_dateVal()}" style="width:100%;padding:.55rem;border-radius:8px;background:#1a1730;border:1px solid rgba(255,255,255,.15);color:#fff"></div>
          <div><label style="display:block;font-size:.82rem;color:#94a3b8;margin-bottom:.2rem">Длительность (дней)</label>
          <input type="number" id="wizDuration" value="3" min="1" max="60" style="width:100%;padding:.55rem;border-radius:8px;background:#1a1730;border:1px solid rgba(255,255,255,.15);color:#fff"></div>
        </div>
      </div>`;
  }
}

function addFiles(files){
  for(const f of files) if(f.type.startsWith('image/')) _wizardPhotos.push(f);
  renderStep();
}

function _removePhoto(i){ _wizardPhotos.splice(i,1); renderStep(); }

async function runAI(){
  const bar = document.getElementById('wizAiBar');
  const txt = document.getElementById('wizAiText');
  const setP = (p,t)=>{ if(bar) bar.style.width=p+'%'; if(txt) txt.textContent=t; };
  try {
    if(window.PhotoEstimateEngine && _wizardPhotos[0]){
      _wizardAiResult = await window.PhotoEstimateEngine.estimateByPhoto(_wizardPhotos[0], {
        region:'Караганда',
        onProgress:(p,t)=> setP(p,t)
      });
    } else if(window.GeminiService && window.GeminiService.isConfigured()){
      setP(30,'Gemini анализ фото...');
      const res = await window.GeminiService.analyzeConstructionPhoto(_wizardPhotos[0],{region:'Караганда'});
      _wizardAiResult = { objectType: res.objectType||'generic', confidence: res.confidence||50, objectLabel: res.objectLabel||'Строительный объект', estimate: res.estimateItems||[], measurements: res.dimensions||{} };
      setP(100,'✅ Gemini анализ завершён');
    } else {
      setP(100,'⚠️ AI недоступен — ручной ввод');
      _wizardAiResult = { objectType:'generic', confidence:30, objectLabel:'Объект (ручной ввод)', estimate:[], measurements:{} };
    }
  } catch(e){
    console.warn('AI error:',e);
    _wizardAiResult = { objectType:'generic', confidence:20, objectLabel:'Объект (ошибка AI)', estimate:[], measurements:{} };
    setP(100,'⚠️ AI ошибка — ручной режим');
  }
  setTimeout(()=> renderStep(), 800);
}

function generateEstimate(){
  // Use AI result estimate if available
  if(_wizardAiResult && _wizardAiResult.estimate && _wizardAiResult.estimate.length){
    _wizardEstimate = _wizardAiResult.estimate.map(it=>({
      name: it.name||it.work_name||'Работа', unit: it.unit||'шт', qty: it.qty||it.quantity||1,
      price: it.price||it.unit_price||0, total: it.total||(it.qty||1)*(it.price||it.unit_price||0)
    }));
    return;
  }
  // Use SmartEstimateEngine if available
  if(window.SmartEstimateEngine && _wizardAiResult){
    try {
      const smart = window.SmartEstimateEngine.build({
        objectType: _wizardAiResult.objectType||'generic',
        objectParams: _wizardAiResult.measurements||{},
        region:'almaty'
      });
      if(smart && smart.items && smart.items.length){
        _wizardEstimate = smart.items.map(it=>({
          name: it.name||it.work_name, unit: it.unit||'шт', qty: it.qty||it.quantity||1,
          price: it.unitPrice||it.unit_price||0, total: it.total||0
        }));
        return;
      }
    } catch(e){ console.warn('SmartEstimate error:',e); }
  }
  // Fallback: basic template
  const type = document.getElementById('wizType')?.value || 'Водопровод';
  const templates = {
    'Водопровод':[
      {name:'Разработка грунта (траншея)',unit:'м³',qty:30,price:3500},
      {name:'Труба ПНД Ø32',unit:'м.п.',qty:25,price:450},
      {name:'Песчаная подушка',unit:'м³',qty:5,price:8000},
      {name:'Колодец водопроводный',unit:'шт',qty:1,price:85000},
      {name:'Врезка',unit:'компл.',qty:1,price:45000},
      {name:'Обратная засыпка',unit:'м³',qty:25,price:2000},
      {name:'Благоустройство',unit:'м²',qty:15,price:1500}
    ],
    'Канализация':[
      {name:'Разработка грунта',unit:'м³',qty:20,price:3500},
      {name:'Труба ПВХ Ø110',unit:'м.п.',qty:15,price:800},
      {name:'Колодцы КС-10',unit:'шт',qty:2,price:42500},
      {name:'Обратная засыпка',unit:'м³',qty:18,price:2000},
      {name:'Люк чугунный',unit:'шт',qty:2,price:12000}
    ]
  };
  const items = templates[type] || templates['Водопровод'];
  _wizardEstimate = items.map(it=>({...it, total: it.qty * it.price}));
}

function _addRow(){
  _wizardEstimate.push({name:'Новая позиция',unit:'шт',qty:1,price:5000,total:5000});
  renderStep();
}

function _next(){
  if(_step===1){
    if(!_wizardPhotos.length){ alert('Загрузите минимум 1 фото объекта'); return; }
    _step=2; renderStep();
  } else if(_step===2){
    const cl = document.getElementById('wizClient')?.value.trim();
    const addr = document.getElementById('wizAddress')?.value.trim();
    if(!cl||!addr){ alert('Заполните Имя клиента и Адрес'); return; }
    _step=3; renderStep();
  } else if(_step===3){
    _step=4; renderStep();
  } else if(_step===4){
    createObject();
  }
}

function _prev(){
  if(_step>1){ _step--; renderStep(); }
}

function createObject(){
  const client = document.getElementById('wizClient')?.value.trim()||'';
  const phone = document.getElementById('wizPhone')?.value.trim()||'';
  const address = document.getElementById('wizAddress')?.value.trim()||'';
  const type = document.getElementById('wizType')?.value||'Водопровод';
  const brigadeId = document.getElementById('wizBrigade')?.value||'';
  const startDate = document.getElementById('wizStartDate')?.value||'';
  const duration = document.getElementById('wizDuration')?.value||'3';

  const obj = ED.createFullObject({
    client, phone, address, type,
    estimate: _wizardEstimate,
    measurements: _wizardAiResult?.measurements || {},
    aiResult: _wizardAiResult,
    aiBackend: _wizardAiResult?.source || 'gemini',
    photoCount: _wizardPhotos.length,
    brigadeId, startDate, duration
  });

  document.getElementById('wizardOverlay')?.remove();
  if(window.EngineerUI){
    EngineerUI.showToast('✅ Объект «'+client+'» создан! Смета + график в календаре.');
    EngineerUI.switchTab('calendar');
  }
}

window.EngineerWizard = { open, _next, _prev, _removePhoto, _addRow };
console.log('✅ [EngineerWizard] 4-step object creation wizard loaded');
})();
