(function(){
  'use strict';

  const STORAGE_KEY = 'canteiro_state_v1';

  let state = {
    blocks: [] // { id, type, data }
  };
  let selectedId = null;
  let uidCounter = 1;

  const canvas = document.getElementById('canvas');
  const canvasEmpty = document.getElementById('canvas-empty');
  const canvasCount = document.getElementById('canvas-count');
  const paletteList = document.getElementById('palette-list');
  const inspectorBody = document.getElementById('inspector-body');
  const inspectorHint = document.getElementById('inspector-hint');
  const toastEl = document.getElementById('toast');

  function uid(){ return 'b' + (uidCounter++) + '_' + Math.random().toString(36).slice(2,7); }

  function toast(msg){
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(()=> toastEl.classList.remove('show'), 1800);
  }

  function save(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
  }
  function load(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw){ state = JSON.parse(raw); }
    }catch(e){}
  }

  /* ---------- Palette ---------- */
  function buildPalette(){
    paletteList.innerHTML = '';
    BLOCK_ORDER.forEach(type=>{
      const def = BLOCK_DEFS[type];
      const item = document.createElement('div');
      item.className = 'palette-item';
      item.draggable = true;
      item.tabIndex = 0;
      item.setAttribute('role','button');
      item.innerHTML = `
        <div class="palette-item-icon">${def.icon}</div>
        <div>
          <span class="palette-item-label">${def.label}</span>
          <span class="palette-item-desc">${def.desc}</span>
        </div>`;
      item.addEventListener('dragstart', (e)=>{
        e.dataTransfer.setData('text/x-new-block', type);
        e.dataTransfer.effectAllowed = 'copy';
      });
      item.addEventListener('click', ()=>{
        addBlock(type, state.blocks.length);
        toast(def.label + ' adicionado');
      });
      item.addEventListener('keydown', (e)=>{
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); item.click(); }
      });
      paletteList.appendChild(item);
    });
  }

  /* ---------- State ops ---------- */
  function addBlock(type, index){
    const def = BLOCK_DEFS[type];
    const block = { id: uid(), type, data: JSON.parse(JSON.stringify(def.defaultData)) };
    state.blocks.splice(index, 0, block);
    selectedId = block.id;
    save();
    renderCanvas();
    renderInspector();
  }
  function removeBlock(id){
    state.blocks = state.blocks.filter(b=>b.id!==id);
    if(selectedId===id) selectedId = null;
    save();
    renderCanvas();
    renderInspector();
  }
  function duplicateBlock(id){
    const idx = state.blocks.findIndex(b=>b.id===id);
    if(idx<0) return;
    const copy = JSON.parse(JSON.stringify(state.blocks[idx]));
    copy.id = uid();
    state.blocks.splice(idx+1,0,copy);
    selectedId = copy.id;
    save();
    renderCanvas();
    renderInspector();
  }
  function moveBlock(id, dir){
    const idx = state.blocks.findIndex(b=>b.id===id);
    const newIdx = idx + dir;
    if(idx<0 || newIdx<0 || newIdx>=state.blocks.length) return;
    const [b] = state.blocks.splice(idx,1);
    state.blocks.splice(newIdx,0,b);
    save();
    renderCanvas();
  }
  function moveBlockToIndex(id, index){
    const idx = state.blocks.findIndex(b=>b.id===id);
    if(idx<0) return;
    const [b] = state.blocks.splice(idx,1);
    let target = index;
    if(idx < target) target -= 1;
    state.blocks.splice(target,0,b);
    save();
    renderCanvas();
  }

  /* ---------- Canvas rendering ---------- */
  function renderCanvas(){
    canvasCount.textContent = `(${state.blocks.length} bloco${state.blocks.length===1?'':'s'})`;
    canvas.innerHTML = '';
    if(state.blocks.length===0){
      canvas.appendChild(canvasEmpty);
      canvasEmpty.style.display = '';
    } else {
      canvasEmpty.style.display = 'none';
    }

    state.blocks.forEach((block, i)=>{
      const def = BLOCK_DEFS[block.type];
      const wrap = document.createElement('div');
      wrap.className = 'block' + (block.id===selectedId ? ' selected' : '');
      wrap.dataset.id = block.id;
      wrap.draggable = true;
      wrap.innerHTML = `
        <span class="block-tag"><span class="block-handle">⠿</span> BLOCO ${String(i+1).padStart(2,'0')} — ${def.label.toUpperCase()}</span>
        <div class="block-controls">
          <button class="block-btn" data-act="up" title="Mover para cima">↑</button>
          <button class="block-btn" data-act="down" title="Mover para baixo">↓</button>
          <button class="block-btn" data-act="dup" title="Duplicar">⧉</button>
          <button class="block-btn danger" data-act="del" title="Remover">✕</button>
        </div>
        ${def.render(block.data)}
      `;

      wrap.addEventListener('click', (e)=>{
        if(e.target.closest('.block-controls')) return;
        selectedId = block.id;
        renderCanvas();
        renderInspector();
      });

      wrap.querySelectorAll('.block-btn').forEach(btn=>{
        btn.addEventListener('click', (e)=>{
          e.stopPropagation();
          const act = btn.dataset.act;
          if(act==='up') moveBlock(block.id, -1);
          if(act==='down') moveBlock(block.id, 1);
          if(act==='dup') duplicateBlock(block.id);
          if(act==='del') removeBlock(block.id);
        });
      });

      wrap.addEventListener('dragstart', (e)=>{
        e.dataTransfer.setData('text/x-reorder-block', block.id);
        e.dataTransfer.effectAllowed = 'move';
        wrap.classList.add('drag-ghost');
      });
      wrap.addEventListener('dragend', ()=> wrap.classList.remove('drag-ghost'));

      canvas.appendChild(wrap);
    });
  }

  /* Drop handling on canvas (both new blocks from palette and reordering) */
  canvas.addEventListener('dragover', (e)=>{
    e.preventDefault();
    canvas.parentElement.classList.add('drag-over');
  });
  canvas.addEventListener('dragleave', (e)=>{
    if(!canvas.contains(e.relatedTarget)) canvas.parentElement.classList.remove('drag-over');
  });
  canvas.addEventListener('drop', (e)=>{
    e.preventDefault();
    canvas.parentElement.classList.remove('drag-over');
    const dropIndex = computeDropIndex(e.clientY);

    const newType = e.dataTransfer.getData('text/x-new-block');
    const reorderId = e.dataTransfer.getData('text/x-reorder-block');

    if(newType){
      addBlock(newType, dropIndex);
      toast(BLOCK_DEFS[newType].label + ' adicionado');
    } else if(reorderId){
      moveBlockToIndex(reorderId, dropIndex);
    }
  });

  function computeDropIndex(clientY){
    const blockEls = Array.from(canvas.querySelectorAll('.block'));
    for(let i=0;i<blockEls.length;i++){
      const rect = blockEls[i].getBoundingClientRect();
      if(clientY < rect.top + rect.height/2) return i;
    }
    return blockEls.length;
  }

  /* ---------- Inspector ---------- */
  function renderInspector(){
    const block = state.blocks.find(b=>b.id===selectedId);
    if(!block){
      inspectorHint.style.display = '';
      inspectorHint.textContent = 'Selecione um bloco na página para editar.';
      inspectorBody.innerHTML = '';
      return;
    }
    inspectorHint.style.display = 'none';
    const def = BLOCK_DEFS[block.type];
    inspectorBody.innerHTML = '';

    const title = document.createElement('div');
    title.innerHTML = `<p style="font-family:var(--mono);font-size:11px;color:#C7D4E8;margin-bottom:14px">Editando: <b style="color:var(--cyan)">${def.label}</b></p>`;
    inspectorBody.appendChild(title);

    if(def.fields.length===0){
      const p = document.createElement('p');
      p.style.cssText = 'font-size:12.5px;color:#8FA3C4;';
      p.textContent = 'Este bloco não tem opções ajustáveis.';
      inspectorBody.appendChild(p);
    }

    def.fields.forEach(f=>{
      if(f.type==='repeat'){
        inspectorBody.appendChild(buildRepeatField(block, f));
        return;
      }
      inspectorBody.appendChild(buildField(block, f, block.data[f.key], (val)=>{
        block.data[f.key] = val;
        save();
        renderCanvas();
      }));
    });

    const hr = document.createElement('hr');
    hr.className = 'section-divider';
    inspectorBody.appendChild(hr);

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-ghost';
    delBtn.style.width = '100%';
    delBtn.textContent = 'Remover este bloco';
    delBtn.addEventListener('click', ()=> removeBlock(block.id));
    inspectorBody.appendChild(delBtn);
  }

  function buildField(scopeObj, f, value, onChange){
    const wrap = document.createElement('div');
    wrap.className = 'field';
    const label = document.createElement('label');
    label.textContent = f.label;
    wrap.appendChild(label);

    let input;
    if(f.type==='textarea'){
      input = document.createElement('textarea');
      input.value = value ?? '';
    } else if(f.type==='color'){
      input = document.createElement('input');
      input.type = 'color';
      input.value = value ?? '#000000';
    } else {
      input = document.createElement('input');
      input.type = (f.type==='url') ? 'text' : 'text';
      input.value = value ?? '';
      if(f.type==='url') input.placeholder = 'https://...';
    }
    input.addEventListener('input', ()=> onChange(input.value));
    wrap.appendChild(input);
    return wrap;
  }

  function buildRepeatField(block, f){
    const wrap = document.createElement('div');
    wrap.className = 'field';
    const label = document.createElement('label');
    label.textContent = f.label;
    wrap.appendChild(label);

    const list = block.data[f.key] || [];
    list.forEach((item, idx)=>{
      const box = document.createElement('div');
      box.className = 'repeat-item';
      const head = document.createElement('div');
      head.className = 'repeat-item-head';
      head.innerHTML = `<span>ITEM ${idx+1}</span>`;
      const rmBtn = document.createElement('button');
      rmBtn.className = 'mini-btn';
      rmBtn.textContent = 'remover';
      rmBtn.addEventListener('click', ()=>{
        list.splice(idx,1);
        save(); renderCanvas(); renderInspector();
      });
      head.appendChild(rmBtn);
      box.appendChild(head);

      f.itemFields.forEach(itf=>{
        box.appendChild(buildField(item, itf, item[itf.key], (val)=>{
          item[itf.key] = val;
          save();
          renderCanvas();
        }));
      });
      wrap.appendChild(box);
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'mini-btn';
    addBtn.style.width = '100%';
    addBtn.textContent = '+ adicionar item';
    addBtn.addEventListener('click', ()=>{
      const blank = {};
      f.itemFields.forEach(itf=> blank[itf.key] = '');
      list.push(blank);
      block.data[f.key] = list;
      save(); renderCanvas(); renderInspector();
    });
    wrap.appendChild(addBtn);

    return wrap;
  }

  /* ---------- Export ---------- */
  const EXPORT_CSS = `
  *{box-sizing:border-box;}
  body{margin:0;font-family:'Manrope',system-ui,sans-serif;color:#16202E;background:#FAF9F4;}
  :root{--ink-soft:#55627A;}
  .cta-button{display:inline-block;background:#E07A3E;color:#fff;font-weight:700;font-size:14px;padding:12px 26px;border-radius:3px;text-decoration:none;border:none;cursor:pointer;}
  .blk-section{padding:46px 48px;}
  .blk-hero{text-align:center;padding:64px 48px;}
  .blk-hero h1{font-size:34px;line-height:1.15;font-weight:800;margin:0 0 14px;}
  .blk-hero p{font-size:16px;color:#55627A;max-width:520px;margin:0 auto 22px;}
  .blk-heading h2{font-size:26px;font-weight:800;margin:0;}
  .blk-heading p{color:#55627A;margin-top:8px;font-size:14px;}
  .blk-text p{font-size:15px;line-height:1.7;color:#2B3648;max-width:640px;margin:0 auto;}
  .blk-image img{width:100%;display:block;border-radius:4px;}
  .blk-image figcaption{font-size:12px;color:#55627A;text-align:center;margin-top:8px;}
  .blk-button{text-align:center;}
  .blk-features{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;}
  .blk-features .feat{text-align:left;}
  .blk-features .feat-icon{font-size:20px;margin-bottom:8px;color:#E07A3E;}
  .blk-features h3{font-size:15px;font-weight:700;margin:0 0 6px;}
  .blk-features p{font-size:13px;color:#55627A;line-height:1.55;margin:0;}
  .blk-testimonial{text-align:center;max-width:560px;margin:0 auto;}
  .blk-testimonial .quote{font-size:18px;font-style:italic;line-height:1.6;margin:0;}
  .blk-testimonial .who{margin-top:14px;font-size:13px;color:#55627A;font-weight:600;}
  .blk-pricing{text-align:center;}
  .blk-pricing .price{font-size:40px;font-weight:800;margin:10px 0;}
  .blk-pricing .price span{font-size:14px;font-weight:500;color:#55627A;}
  .blk-form{max-width:420px;margin:0 auto;text-align:center;}
  .blk-form .form-row{display:flex;gap:8px;margin-top:16px;}
  .blk-form input[type=email]{flex:1;padding:11px 12px;border:1px solid #C7D2E0;border-radius:3px;font-size:14px;}
  .blk-divider{padding:0 48px;}
  .blk-divider hr{border:none;border-top:1px dashed #C7D2E0;margin:0;}
  .blk-footer{text-align:center;padding:34px 48px;font-size:12.5px;color:#55627A;}
  @media (max-width:640px){
    .blk-features{grid-template-columns:1fr;}
    .blk-section, .blk-hero, .blk-footer{padding-left:24px;padding-right:24px;}
  }
  `;

  function buildExportHTML(){
    const body = state.blocks.map(b=> BLOCK_DEFS[b.type].render(b.data)).join('\n');
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Minha landing page</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${EXPORT_CSS}</style>
</head>
<body>
${body}
</body>
</html>`;
  }

  function downloadHTML(){
    if(state.blocks.length===0){ toast('Adicione ao menos um bloco antes de baixar'); return; }
    const html = buildExportHTML();
    const blob = new Blob([html], {type:'text/html'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'landing-page.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Arquivo baixado: landing-page.html');
  }

  function previewPage(){
    if(state.blocks.length===0){ toast('Adicione ao menos um bloco antes de pré-visualizar'); return; }
    const html = buildExportHTML();
    const w = window.open('', '_blank');
    if(!w){ toast('Permita pop-ups para pré-visualizar'); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  /* ---------- Top bar actions ---------- */
  document.getElementById('btn-export').addEventListener('click', downloadHTML);
  document.getElementById('btn-preview').addEventListener('click', previewPage);
  document.getElementById('btn-clear').addEventListener('click', ()=>{
    if(state.blocks.length===0) return;
    if(confirm('Remover todos os blocos da página?')){
      state.blocks = [];
      selectedId = null;
      save();
      renderCanvas();
      renderInspector();
    }
  });

  /* ---------- Init ---------- */
  load();
  buildPalette();
  renderCanvas();
  renderInspector();

})();
