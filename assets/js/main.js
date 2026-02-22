// ----------------- Skills 自动滑动（无缝克隆 + 悬停/触摸/失焦暂停） -----------------
(function(){
  const track = document.getElementById('skillsTrack');
  if (!track) return;
  const clone = track.innerHTML;            // 克隆一轮保证无缝
  track.innerHTML = clone + clone;

  const pause = () => track.style.animationPlayState = 'paused';
  const play  = () => track.style.animationPlayState = 'running';

  track.addEventListener('mouseenter', pause);
  track.addEventListener('mouseleave', play);

  let touching = false;
  track.addEventListener('touchstart', ()=>{ touching=true; pause(); }, {passive:true});
  track.addEventListener('touchend',   ()=>{ touching=false; play(); }, {passive:true});
  track.addEventListener('touchcancel',()=>{ touching=false; play(); }, {passive:true});

  window.addEventListener('blur', pause);
  window.addEventListener('focus', ()=>{ if (!touching) play(); });
})();

// ----------------- 横向作品带（筛选 + 分页点 + 键盘/自动播放 + 拖拽/滚轮横滑 + 点击修复） -----------------
(function(){
  const scroller = document.getElementById('scroller');
  if (!scroller) return;

  const btns = document.querySelectorAll('.nav-btn');
  const filterWrap = document.querySelector('.sc-filter');
  const dotsWrap = document.getElementById('dots');

  // 步长/分页计算
  const itemSize = ()=> {
    const item = scroller.querySelector('.s-item');
    if(!item) return 0;
    const style = getComputedStyle(scroller);
    const gap = parseFloat(style.columnGap || style.gap || 12);
    return item.getBoundingClientRect().width + gap;
  };
  const visibleItems = () => Array.from(scroller.querySelectorAll('.s-item')).filter(el=>el.style.display !== 'none');
  const pagesCount = () => {
    const arr = visibleItems(); if (!arr.length) return 0;
    const perView = Math.max(1, Math.round(scroller.clientWidth / (itemSize() || scroller.clientWidth)));
    return Math.ceil(arr.length / perView);
  };
  const currentPage = () => {
    const size = itemSize() || scroller.clientWidth;
    return Math.round(scroller.scrollLeft / size);
  };

  // 箭头
  btns.forEach(b=>{
    b.addEventListener('click', ()=>{
      const dir = Number(b.dataset.dir || 1);
      const step = Math.max(320, scroller.clientWidth * 0.85);
      scroller.scrollBy({ left: dir * step, behavior: 'smooth' });
      restartAutoplay();
    });
  });

  // 鼠标滚轮 → 横向
  scroller.addEventListener('wheel', (e)=>{
    if (!e.shiftKey && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      scroller.scrollBy({ left: e.deltaY, behavior: 'auto' });
      e.preventDefault();
      restartAutoplay();
    }
  }, { passive:false });

  // 拖拽与点击分离
  let isDown=false, startX=0, startScroll=0, moved=false;
  scroller.addEventListener('pointerdown', e=>{
    isDown=true; moved=false; startX=e.clientX; startScroll=scroller.scrollLeft;
  });
  window.addEventListener('pointermove', e=>{
    if(!isDown) return;
    const dx=e.clientX-startX;
    if(Math.abs(dx)>5){ moved=true; scroller.scrollLeft=startScroll-dx; }
  });
  window.addEventListener('pointerup', ()=>{ isDown=false; });
  scroller.querySelectorAll('.s-item').forEach(item=>{
    item.addEventListener('click', e=>{ if(moved) e.preventDefault(); });
  });

  // 键盘
  window.addEventListener('keydown', (e)=>{
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      scroller.scrollBy({ left: dir * Math.max(320, scroller.clientWidth*0.85), behavior:'smooth' });
      restartAutoplay();
    }
  });

  // 筛选
  filterWrap?.addEventListener('click', e=>{
    const btn = e.target.closest('.chip'); if(!btn) return;
    filterWrap.querySelectorAll('.chip').forEach(c=>c.classList.remove('is-active'));
    btn.classList.add('is-active');
    const type = btn.dataset.filter;

    scroller.querySelectorAll('.s-item').forEach(it=>{
      const show = (type === 'all') || (it.dataset.type === type);
      it.style.display = show ? '' : 'none';
    });

    scroller.scrollTo({ left: 0, behavior: 'smooth' });
    buildDots(); restartAutoplay();
  });

  // 分页点
  function buildDots(){
    const n = pagesCount(); dotsWrap.innerHTML = '';
    for(let i=0;i<n;i++){
      const d = document.createElement('button');
      d.className = 'dot' + (i===0 ? ' is-active':'');
      d.setAttribute('aria-label', `Go to slide ${i+1}`);
      d.addEventListener('click', ()=>{
        const size = itemSize() || scroller.clientWidth;
        scroller.scrollTo({ left: i * size, behavior: 'smooth' });
        restartAutoplay();
      });
      dotsWrap.appendChild(d);
    }
  }
  function highlightDot(){
    const dots = dotsWrap.querySelectorAll('.dot');
    const idx = Math.min(dots.length-1, Math.max(0, currentPage()));
    dots.forEach(d=>d.classList.remove('is-active'));
    dots,[idx]?.classList.add('is-active');
  }
  scroller.addEventListener('scroll', highlightDot);

  // 自动播放
  let autoplayTimer=null;
  const AUTO_MS=5000;
  function startAutoplay(){
    stopAutoplay();
    if (pagesCount() <= 1) return;
    autoplayTimer=setInterval(()=>{
      const size=itemSize()||scroller.clientWidth;
      const maxLeft=(pagesCount()-1)*size;
      const next=scroller.scrollLeft+size;
      scroller.scrollTo({ left: next>maxLeft ? 0 : next, behavior:'smooth' });
    }, AUTO_MS);
  }
  function stopAutoplay(){ if(autoplayTimer){ clearInterval(autoplayTimer); autoplayTimer=null; } }
  function restartAutoplay(){ stopAutoplay(); startAutoplay(); }

  buildDots(); startAutoplay();
  window.addEventListener('resize', ()=>{ buildDots(); highlightDot(); restartAutoplay(); });
})();

// ----------------- 详情页：根据 slug 填充内容 -----------------
(function(){
  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');
  if (!slug) return;

  const data = {
    "graph-optimization": {
      title: "Graph Optimization for Real‑World Networks",
      meta: ,[,["Role","Researcher"],,["Type","Research"],,["Year","2025"],,["Focus","flows, matchings, cuts"]],
      lead: "Applies max‑flow/min‑cut, bipartite matching, and community detection to transportation and social graphs; reports speed/quality trade‑offs and scalability.",
      hero: "assets/img/card_graphopt.jpg"
    },
    "ds-pipeline": {
      title: "End‑to‑End Data Science Pipeline",
      meta: ,[,["Role","Data Scientist"],,["Type","Applied"],,["Year","2024"],,["Stack","pandas, sklearn, SQL"]],
      lead: "From data ingestion and cleaning to modeling, diagnostics, and reporting; includes CI checks and reproducible notebooks.",
      hero: "assets/img/card_pipeline.jpg"
    },
    "model-tuning": {
      title: "Model Optimization & Hyperparameter Tuning",
      meta: ,[,["Role","Research Engineer"],,["Type","Methods"],,["Year","2024"],,["Tech","Optuna, pruning"]],
      lead: "Bayesian optimization, early‑stopping, pruning and quantization; consistent accuracy gains with lower latency.",
      hero: "assets/img/card_tuning.jpg"
    },
    "gnn-intro": {
      title: "Graph Neural Networks: From Theory to Practice",
      meta: ,[,["Role","Researcher"],,["Type","Research"],,["Year","2024"],,["Lib","PyTorch Geometric"]],
      lead: "Implements GCN/GraphSAGE; explores over‑smoothing mitigation and sampling strategies on citation and social graphs.",
      hero: "assets/img/card_gnn.jpg"
    },
    "ts-forecasting": {
      title: "Time‑Series Forecasting with Diagnostics",
      meta: ,[,["Role","Data Scientist"],,["Type","Applied"],,["Year","2023"],,["Focus","feature engineering"]],
      lead: "Gradient boosting + residual diagnostics; seasonality handling and backtest protocols for robust deployment.",
      hero: "assets/img/card_ts.jpg"
    },
    "viz-toolkit": {
      title: "Visualization Toolkit for Graphs & Models",
      meta: ,[,["Role","Developer"],,["Type","Tooling"],,["Year","2022"],,["Lang","Python"]],
      lead: "Reusable helpers for confusion matrices, calibration, graph layouts, and convergence curves.",
      hero: "assets/img/card_viz.jpg"
    }
  };

  const d = data,[slug];
  if (!d) return;

  const titleEl = document.getElementById('title');
  const metaEl = document.getElementById('meta');
  const leadEl = document.getElementById('lead');
  const heroEl = document.getElementById('hero');

  if (titleEl) titleEl.textContent = d.title;
  if (leadEl)  leadEl.textContent  = d.lead;
  if (heroEl)  heroEl.src          = d.hero;
  if (metaEl && d.meta) metaEl.innerHTML = d.meta.map((,[k,v]) => `<span><strong>${k}:</strong> ${v}</span>`).join(" | ");
})();