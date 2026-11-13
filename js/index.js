window.navigateWithTransition = (url) => {
  document.body.classList.add('page-exiting');
  setTimeout(() => { window.location.href = url; }, 300);
};

document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (link) {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('#') && !href.startsWith('http') && !link.hasAttribute('target')) {
      e.preventDefault(); 
      window.navigateWithTransition(href); 
    }
  }
});

(function() {
  const ROLE_LABELS = { admin: 'مدير', lawyer: 'محامي', secretary: 'سكرتارية' };
  const CASE_STATUS = { open: 'متداولة', reserved: 'محجوزة للحكم', judged: 'محكوم فيها', archived: 'مؤرشفة' };
  let me = null;
  const $ = (id) => document.getElementById(id);
  const isAdmin = () => me && me.role === 'admin';
  function goToLogin() { location.replace('login.html'); }
  const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

  async function loadNotifications() {
    const today = new Date(); const todayStr = today.toISOString().split('T')[0];
    const in3Days = new Date(today); in3Days.setDate(today.getDate() + 3); const in3DaysStr = in3Days.toISOString().split('T')[0];
    
    // فلترة الإشعارات: العامة + اللي ليا أنا بس
    const hRes = await sb.from('cases').select('id, case_number, case_year, next_hearing_date, clients(full_name)').gte('next_hearing_date', todayStr).lte('next_hearing_date', in3DaysStr);
    const tRes = await sb.from('case_tasks').select('id, title, cases(case_number)').eq('is_completed', false).limit(10);
    const eRes = await sb.from('custom_events').select('id, title, event_date').gte('event_date', todayStr).lte('event_date', in3DaysStr);
    const rRes = await sb.from('edit_requests').select('id').eq('status', 'pending');
    const nRes = await sb.from('notifications').select('*').or(`user_id.is.null,user_id.eq.${me.id}`).order('created_at', { ascending: false }).limit(20);

    const hearings = hRes.data || [];
    const tasks = tRes.data || [];
    const events = eRes.data || [];
    const editReqs = rRes.data || [];
    const notifs = nRes.data || [];

    const editCount = editReqs.length;
    const notifCount = notifs.length;
    const count = hearings.length + tasks.length + events.length + editCount + notifCount;
    
    const badge = $('notif-badge'); const list = $('notif-list');
    if (count > 0) { badge.style.display = 'grid'; badge.textContent = count; } else { badge.style.display = 'none'; }
    list.innerHTML = '';
    
    if (count === 0) { list.innerHTML = '<li class="empty-notif">لا توجد إشعارات جديدة.</li>'; return; }
    
    notifs.forEach(n => {
      list.innerHTML += `<li class="notif-item" style="background:#fef3c7; border-right:3px solid #f59e0b;" onclick="window.navigateWithTransition('payroll.html')"><strong>🔔 ${n.title}</strong><span>${n.message}</span></li>`;
    });

    if (editCount > 0) {
      list.innerHTML += `<li class="notif-item" style="background:#fef3c7; border-right:3px solid #f59e0b;" onclick="window.navigateWithTransition('admin.html')"><strong>🔔 لديك ${editCount} طلب تعديل بيانات جديد</strong><span>اضغط لمراجعة الطلبات في صفحة المدير</span></li>`;
    }

    hearings.forEach(h => { list.innerHTML += `<li class="notif-item hearing" onclick="window.navigateWithTransition('cases.html?id=${h.id}')"><strong>⚖️ جلسة قريبة: قضية ${h.case_number} لسنة ${h.case_year}</strong><span>الموكل: ${h.clients?.full_name} | التاريخ: ${fmtDate(h.next_hearing_date)}</span></li>`; });
    tasks.forEach(t => { list.innerHTML += `<li class="notif-item task" onclick="window.navigateWithTransition('cases.html')"><strong>📝 مهمة معلقة: ${t.title}</strong><span>قضية رقم ${t.cases?.case_number || '-'}</span></li>`; });
    events.forEach(e => { list.innerHTML += `<li class="notif-item event" onclick="window.navigateWithTransition('agenda.html')"><strong>📅 ميعاد شخصي: ${e.title}</strong><span>التاريخ: ${fmtDate(e.event_date)}</span></li>`; });
  }
  
  $('notif-btn').addEventListener('click', (e) => { e.stopPropagation(); $('notif-dropdown').classList.toggle('show'); });
  document.addEventListener('click', (e) => { if (!e.target.closest('.notif-wrapper')) { $('notif-dropdown').classList.remove('show'); } });

  async function loadStats() {
    const today = new Date().toISOString().split('T')[0];
    const [{ count: c1 }, { count: c2 }, { count: c3 }, { count: c4 }] = await Promise.all([
      sb.from('clients').select('*', { count: 'exact', head: true }),
      sb.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      sb.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'reserved'),
      sb.from('cases').select('*', { count: 'exact', head: true }).gte('next_hearing_date', today)
    ]);
    $('stat-clients').textContent = c1 || 0; $('stat-open-cases').textContent = c2 || 0; $('stat-reserved-cases').textContent = c3 || 0; $('stat-upcoming').textContent = c4 || 0;
  }
  
  async function loadUpcomingHearings() {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await sb.from('cases').select('id, case_number, case_year, court, next_hearing_date, clients(full_name)').gte('next_hearing_date', today).order('next_hearing_date', { ascending: true }).limit(5);
    const ul = $('upcoming-list'); ul.replaceChildren();
    if (!data || !data.length) return ul.innerHTML = '<li class="muted" style="padding: 1rem 0;">لا توجد جلسات قادمة.</li>';
    data.forEach(c => { ul.innerHTML += `<li class="hearing-item"><div><strong style="display: block; color: var(--ink); font-size: 0.9rem;">قضية ${c.case_number} / ${c.case_year}</strong><span class="muted" style="font-size: 0.8rem;">${c.clients?.full_name || 'موكل'} - ${c.court}</span></div><div class="hearing-date" style="font-size: 0.8rem; padding: 0.2rem 0.4rem;">${fmtDate(c.next_hearing_date)}</div></li>`; });
  }
  
  async function loadTasks() {
    const { data } = await sb.from('case_tasks').select('id, title, cases(case_number)').eq('is_completed', false).order('created_at', { ascending: true }).limit(5);
    const ul = $('tasks-list'); ul.replaceChildren();
    if (!data || !data.length) return ul.innerHTML = '<li class="muted" style="padding: 1rem 0;">لا يوجد مهام معلقة.</li>';
    data.forEach(t => { ul.innerHTML += `<li class="task-item"><input type="checkbox" disabled><div class="task-text">${t.title}<span class="task-case">قضية ${t.cases?.case_number || ''}</span></div></li>`; });
  }
  
  async function loadRecentCases() {
    const { data } = await sb.from('cases').select('id, case_number, case_year, status, clients(full_name)').order('created_at', { ascending: false }).limit(5);
    const ul = $('recent-cases-list'); ul.replaceChildren();
    if (!data || !data.length) return ul.innerHTML = '<li class="muted" style="padding: 1rem 0;">لا توجد قضايا مسجلة.</li>';
    data.forEach(c => {
      const st = CASE_STATUS[c.status] || c.status;
      ul.innerHTML += `<li class="hearing-item"><div><strong style="display: block; color: var(--ink); font-size: 0.9rem;">قضية ${c.case_number} / ${c.case_year}</strong><span class="muted" style="font-size: 0.8rem;">${c.clients?.full_name || 'موكل'}</span></div><span class="tag ${c.status === 'open' ? 'good' : ''}" style="font-size: 0.75rem;">${st}</span></li>`;
    });
  }

  async function init() {
    const { data: { session } } = await sb.auth.getSession(); if (!session) return goToLogin();
    const { data: profile } = await sb.from('profiles').select('id, full_name, role, is_active').eq('id', session.user.id).maybeSingle();
    if (!profile || !profile.is_active) { await sb.auth.signOut(); return goToLogin(); }
    me = profile; const displayName = profile.full_name || session.user.email;
    $('user-name').textContent = displayName; $('user-avatar').textContent = displayName.charAt(0); $('welcome-name').textContent = displayName.split(' ')[0];
    $('user-role').textContent = ROLE_LABELS[profile.role] || profile.role;
    if (isAdmin()) $('admin-link').hidden = false;
    await Promise.all([loadStats(), loadUpcomingHearings(), loadTasks(), loadRecentCases(), loadNotifications()]);
    $('app').hidden = false;
  }
  
  $('logout-btn').addEventListener('click', async () => { 
    await sb.auth.signOut(); 
    window.navigateWithTransition('login.html'); 
  });
  
  init();
})();