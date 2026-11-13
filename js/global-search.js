document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('global-search-input');
  const resultsBox = document.getElementById('global-search-results');
  if (!input || !resultsBox) return;
  let timer;
  input.addEventListener('input', (e) => {
    clearTimeout(timer);
    const term = e.target.value.trim();
    if (!term) { resultsBox.style.display = 'none'; return; }
    timer = setTimeout(() => performSearch(term), 300);
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.global-search-wrapper')) resultsBox.style.display = 'none';
  });
  async function performSearch(term) {
    const p = `"%${term}%"`;
    resultsBox.innerHTML = '<div class="search-result-item">جاري البحث...</div>';
    resultsBox.style.display = 'block';
    const [clients, cases, poas] = await Promise.all([
      sb.from('clients').select('id, full_name, phone').or(`full_name.ilike.${p},phone.ilike.${p},national_id.ilike.${p}`).limit(5),
      sb.from('cases').select('id, case_number, case_year, court').or(`case_number.ilike.${p}, court.ilike.${p}`).limit(5),
      sb.from('powers_of_attorney').select('id, poa_number, client_id, clients(full_name)').ilike('poa_number', term).limit(5)
    ]);
    let html = '';
    if (clients.data?.length) {
      html += `<div style="padding: 0.5rem 1rem; font-size: 0.8rem; font-weight: bold; color: var(--ink-soft); background: #f1f3f8;">الموكلين</div>`;
      clients.data.forEach(c => html += `<div class="search-result-item" onclick="window.location.href='clients.html?id=${c.id}'"><div><strong>${c.full_name}</strong> ${c.phone ? '- ' + c.phone : ''}</div></div>`);
    }
    if (cases.data?.length) {
      html += `<div style="padding: 0.5rem 1rem; font-size: 0.8rem; font-weight: bold; color: var(--ink-soft); background: #f1f3f8;">القضايا</div>`;
      cases.data.forEach(c => html += `<div class="search-result-item" onclick="window.location.href='cases.html?id=${c.id}'"><div>قضية <strong>${c.case_number}</strong> لسنة ${c.case_year} - ${c.court}</div></div>`);
    }
    if (poas.data?.length) {
      html += `<div style="padding: 0.5rem 1rem; font-size: 0.8rem; font-weight: bold; color: var(--ink-soft); background: #f1f3f8;">التوكيلات</div>`;
      poas.data.forEach(p => html += `<div class="search-result-item" onclick="window.location.href='clients.html?id=${p.client_id}'"><div>توكيل رقم <strong>${p.poa_number}</strong> - ${p.clients?.full_name || ''}</div></div>`);
    }
    resultsBox.innerHTML = html || '<div class="search-result-item" style="color:var(--ink-soft);">لا توجد نتائج.</div>';
  }
});