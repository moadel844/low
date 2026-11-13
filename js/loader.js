(function() {
  // 1. إضافة الستايلات الخاصة بشاشة التحميل والدوائر
  const style = document.createElement('style');
  style.innerHTML = `
    .page-loader-overlay {
      position: fixed; inset: 0; z-index: 99999;
      background: var(--paper, #f8fafc);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      transition: opacity 0.5s ease, visibility 0.5s ease;
    }
    [data-theme="dark"] .page-loader-overlay { background: #0f172a; }
    
    .page-loader-overlay.hidden { opacity: 0; visibility: hidden; }
    
    /* الحاوية الأساسية للميزان والدوائر */
    .loader-ring-wrapper {
      position: relative;
      width: 180px; height: 180px; /* حجم الميزان */
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 2rem;
    }
    
    /* الدائرة الذهبية الخارجية المتقطعة */
    .loader-ring-outer {
      position: absolute; inset: -25px;
      border-radius: 50%;
      border: 3px dashed var(--brass, #b45309);
      animation: spin-slow 6s linear infinite;
    }
    
    /* الدائرة الداخلية (كحلي وذهبي) */
    .loader-ring-inner {
      position: absolute; inset: -10px;
      border-radius: 50%;
      border: 4px solid transparent;
      border-top-color: var(--brass, #b45309);
      border-bottom-color: var(--indigo, #1e2d5a);
      animation: spin-reverse 1.5s ease-in-out infinite;
    }
    [data-theme="dark"] .loader-ring-inner { border-bottom-color: #93c5fd; }
    
    /* الميزان نفسه */
    .loader-icon-container {
      width: 100%; height: 100%;
      color: var(--brass, #b45309);
      animation: swing 2.5s ease-in-out infinite;
      transform-origin: top center;
      z-index: 2; /* فوق الدوائر */
    }
    
    .loader-text {
      font-family: var(--font-head, 'Cairo', sans-serif);
      font-weight: 800; font-size: 3rem;
      color: var(--indigo, #1e2d5a);
      letter-spacing: 2px;
      animation: pulse 1.5s infinite;
    }
    [data-theme="dark"] .loader-text { color: #fff; }
    
    @keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @keyframes spin-reverse { 0% { transform: rotate(0deg); } 100% { transform: rotate(-360deg); } }
    @keyframes swing { 0% { transform: rotate(-8deg); } 50% { transform: rotate(8deg); } 100% { transform: rotate(-8deg); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
  `;
  document.head.appendChild(style);

  // 2. إضافة شكل الميزان والدوائر والكلام
  const loaderHtml = `
    <div id="global-page-loader" class="page-loader-overlay">
      <div class="loader-ring-wrapper">
        <div class="loader-ring-outer"></div>
        <div class="loader-ring-inner"></div>
        <div class="loader-icon-container">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="width: 100%; height: 100%;">
            <path d="M12 3v18"></path>
            <path d="M8 21h8"></path>
            <path d="M12 3l8 5"></path>
            <path d="M12 3l-8 5"></path>
            <path d="M4 8l-2 6h4z"></path>
            <path d="M20 8l-2 6h4z"></path>
            <path d="M2 14a3 3 0 0 0 6 0"></path>
            <path d="M16 14a3 3 0 0 0 6 0"></path>
            <circle cx="12" cy="3" r="1.5"></circle>
          </svg>
        </div>
      </div>
      <div class="loader-text">المستشار</div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', loaderHtml);
  const loader = document.getElementById('global-page-loader');

  // 3. إخفاء الشاشة لما الصفحة تخلص تحميل (استنى شوية عشان تبان)
  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('hidden');
    }, 500); 
  });

  // 4. إظهار الشاشة لما تدوس على أي لينك وتأخير الانتقال
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link) {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('http') && !link.hasAttribute('target')) {
        e.preventDefault(); 
        loader.classList.remove('hidden'); 
        
        // نستنى ثانية ونص عشان الناس تشوف الدوائر والميزان وهما بيلفوا
        setTimeout(() => {
          window.location.href = href;
        }, 1500);
      }
    }
  });
})();