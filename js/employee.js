const ROLE_LABELS = { admin: 'مدير', lawyer: 'محامي', secretary: 'سكرتارية' };
let me = null, currentEmployee = null;
const $ = (id) => document.getElementById(id);

function goToLogin() { location.replace('login.html'); }

function flash(text, ok = true) { 
  const t = $('toast'); t.textContent = text; t.className = 'alert toast ' + (ok ? 'ok' : ''); t.hidden = false; 
  setTimeout(() => { t.hidden = true; }, 5000); 
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('ar-EG-u-nu-latn', { hour: '2-digit', minute: '2-digit' }) : '-';
const fmtMoney = (n) => (n || 0).toLocaleString('ar-EG-u-nu-latn');

async function loadEmployeeData(empId) {
  // جلب بيانات الموظف
  const { data: emp } = await sb.from('profiles').select('*').eq('id', empId).maybeSingle();
  if (!emp) { alert('الموظف غير موجود'); return goToLogin(); }
  currentEmployee = emp;

  // تحديث الواجهة
  $('emp-name').textContent = emp.full_name;
  $('emp-role').textContent = ROLE_LABELS[emp.role];
  $('emp-avatar').textContent = emp.full_name.charAt(0);

  // الإحصائيات
  const [{ count: casesCount }, { count: tasksCount }, { data: sessions }, { data: attendance }, { data: rewards }] = await Promise.all([
    sb.from('cases').select('id', { count: 'exact', head: true }).eq('responsible_lawyer_id', empId),
    sb.from('case_tasks').select('id', { count: 'exact', head: true }).eq('is_completed', true), // ملاحظة: لو عايز مهام الموظف نفسه محتاجين نربط المهام بالموظف
    sb.from('case_sessions').select('id, session_date, case_id').eq('created_by', empId),
    sb.from('attendance').select('*').eq('user_id', empId).order('date', { ascending: false }).limit(30),
    sb.from('rewards').select('*').eq('user_id', empId).order('created_at', { ascending: false })
  ]);

  $('stat-cases').textContent = casesCount || 0;
  $('stat-tasks').textContent = tasksCount || 0;
  $('stat-sessions').textContent = sessions?.length || 0;
  $('stat-days').textContent = attendance?.length || 0;

  // سجل المكافآت
  let totalBonus = 0, totalPenalty = 0;
  const rList = $('rewards-list'); rList.innerHTML = '';
  if (!rewards || !rewards.length) {
    rList.innerHTML = '<tr><td colspan="4" class="muted" style="text-align: center;">لا يوجد سجل مكافآت.</td></tr>';
  } else {
    rewards.forEach(r => {
      if (r.type === 'bonus') totalBonus += r.amount;
      else totalPenalty += r.amount;
      
      const badge = r.type === 'bonus' ? '<span class="badge-bonus">مكافأة</span>' : '<span class="badge-penalty">خصم</span>';
      rList.innerHTML += `<tr><td>${fmtDate(r.created_at)}</td><td>${badge}</td><td>${fmtMoney(r.amount)} ج.م</td><td>${r.reason}</td></tr>`;
    });
  }
  $('sum-bonus').textContent = fmtMoney(totalBonus) + ' ج.م';
  $('sum-penalty').textContent = fmtMoney(totalPenalty) + ' ج.م';

  // سجل الحضور
  const aList = $('attendance-list'); aList.innerHTML = '';
  if (!attendance || !attendance.length) {
    aList.innerHTML = '<tr><td colspan="3" class="muted" style="text-align: center;">لا يوجد سجل حضور.</td></tr>';
  } else {
    attendance.forEach(a => {
      aList.innerHTML += `<tr><td>${fmtDate(a.date)}</td><td style="color: #166534; font-weight: bold;">${fmtTime(a.check_in)}</td><td style="color: #991b1b; font-weight: bold;">${fmtTime(a.check_out)}</td></tr>`;
    });
  }
}

// إضافة مكافأة / خصم
window.openRewardModal = () => {
  $('reward-form').reset();
  $('rw-error').hidden = true;
  $('reward-dialog').showModal();
};

$('reward-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = 'جاري الحفظ...';

  const type = $('rw-type').value;
  const amount = parseFloat($('rw-amount').value);
  const reason = $('rw-reason').value.trim();

  if (!amount || amount <= 0) {
    $('rw-error').textContent = 'اكتب مبلغ صحيح'; $('rw-error').hidden = false;
    btn.disabled = false; btn.textContent = 'حفظ';
    return;
  }

  const { error } = await sb.from('rewards').insert({
    user_id: currentEmployee.id,
    type,
    amount,
    reason,
    created_by: me.id
  });

  btn.disabled = false; btn.textContent = 'حفظ';

  if (error) {
    $('rw-error').textContent = 'حدث خطأ: ' + error.message; $('rw-error').hidden = false;
  } else {
    $('reward-dialog').close();
    flash('تم الحفظ بنجاح');
    await loadEmployeeData(currentEmployee.id);
    
    // إشعار للموظف
    await sb.from('notifications').insert({
      title: type === 'bonus' ? 'مكافأة جديدة 💰' : 'تم تسجيل خصم ⚠️',
      message: `تم ${type === 'bonus' ? 'إضافة مكافأة لك' : 'تسجيل خصم عليك'} بقيمة ${fmtMoney(amount)} ج.م. السبب: ${reason}`,
      target_role: 'all',
      user_id: currentEmployee.id
    });
  }
});

async function init() {
  const { data: { session } } = await sb.auth.getSession(); 
  if (!session) return goToLogin();
  
  const { data: profile } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle(); 
  if (!profile || !profile.is_active) { await sb.auth.signOut(); return goToLogin(); }
  
  me = profile; 
  $('user-name').textContent = profile.full_name || session.user.email; 
  $('user-avatar').textContent = (document.getElementById('user-name').textContent || '?').trim().charAt(0); 
  $('user-role').textContent = ROLE_LABELS[profile.role];
  
  // زرار إضافة مكافأة للمدير بس
  if (profile.role === 'admin') {
    $('add-reward-btn').hidden = false;
    $('add-reward-btn').onclick = () => window.openRewardModal();
  }

  // جلب الـ ID من الرابط
  const urlParams = new URLSearchParams(window.location.search);
  const empId = urlParams.get('id');
  if (!empId) { alert('اختر موظف'); return goToLogin(); }

  await loadEmployeeData(empId);
  $('app').hidden = false;
}

$('logout-btn').addEventListener('click', async () => { await sb.auth.signOut(); goToLogin(); });
init();