const ROLE_LABELS = { admin: 'مدير', lawyer: 'محامي', secretary: 'سكرتارية' };
const ARABIC_MONTHS = ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
let me = null, employees = [];
const $ = (id) => document.getElementById(id);
const fmtCurrency = (val) => (val || 0).toLocaleString('ar-EG-u-nu-latn');

let toastTimer; 
function flash(text, ok = true) { 
  const t = $('toast'); t.textContent = text; t.className = 'alert toast ' + (ok ? 'ok' : ''); t.hidden = false; 
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 5000); 
}

async function loadData() {
  const { data: users, error: uErr } = await sb.from('profiles').select('id, full_name, role').eq('is_active', true).neq('role', 'admin');
  if (!uErr && users) {
    employees = users;
    const sel = $('p-employee');
    sel.innerHTML = '<option value="">— اختر الموظف —</option>';
    users.forEach(u => sel.innerHTML += `<option value="${u.id}">${u.full_name} (${ROLE_LABELS[u.role]})</option>`);
  }

  const { data: payrolls, error: pErr } = await sb.from('payrolls').select('*, profiles(full_name)').order('created_at', { ascending: false });
  const tbody = $('payroll-list'); tbody.innerHTML = '';
  
  if (pErr) return console.error(pErr);
  if (!payrolls || !payrolls.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="muted" style="text-align: center;">لا يوجد رواتب مسجلة.</td></tr>';
    return;
  }
  
  payrolls.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${p.profiles?.full_name || 'موظف محذوف'}</strong></td>
        <td>${ARABIC_MONTHS[p.month]} ${p.year}</td>
        <td>${fmtCurrency(p.base_salary)}</td>
        <td class="deduction">${p.deductions > 0 ? fmtCurrency(p.deductions) : '-'}</td>
        <td class="net-salary">${fmtCurrency(p.net_salary)}</td>
        <td class="muted" style="font-size:0.85rem;">${p.deduction_reason || '-'}</td>
      </tr>
    `;
  });
}

$('payroll-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = 'جاري الحفظ...';

  const empId = $('p-employee').value;
  const month = parseInt($('p-month').value);
  const year = parseInt($('p-year').value);
  const base = parseFloat($('p-base').value);
  const ded = parseFloat($('p-deduction').value) || 0;
  const reason = $('p-reason').value.trim();
  const net = base - ded;

  if (net < 0) {
    flash('الخصم أكبر من الراتب الأساسي!', false);
    btn.disabled = false; btn.textContent = 'حفظ وإرسال إشعار';
    return;
  }

  // 1. حفظ الراتب
  const { error: insertErr } = await sb.from('payrolls').insert({
    employee_id: empId, month, year, base_salary: base, deductions: ded, net_salary: net, deduction_reason: reason || null
  });

  if (insertErr) {
    flash('حدث خطأ: ' + (insertErr.code === '23505' ? 'تم إضافة راتب هذا الموظف لهذا الشهر بالفعل.' : insertErr.message), false);
    btn.disabled = false; btn.textContent = 'حفظ وإرسال إشعار';
    return;
  }

  // 2. إرسال الإشعار (للموظف نفسه بس)
  const empName = employees.find(u => u.id === empId)?.full_name || 'موظف';
  const { error: notifErr } = await sb.from('notifications').insert({
    title: 'تم إضافة راتب جديد 💰',
    message: `تم إضافة راتب شهر ${ARABIC_MONTHS[month]} ${year}. الصافي: ${fmtCurrency(net)} ج.م.`,
    target_role: 'all',
    user_id: empId // <--- الإشعار ده هيتبعت للموظف ده بس
  });

  if (notifErr) {
      console.error("فشل إرسال الإشعار:", notifErr);
  } else {
      flash('تم حفظ الراتب وإرسال الإشعار بنجاح.');
  }

  $('payroll-form').reset();
  btn.disabled = false; btn.textContent = 'حفظ وإرسال إشعار';
  await loadData();
});

async function init() {
  const { data: { session } } = await sb.auth.getSession(); 
  if (!session) return location.replace('login.html');
  
  const { data: profile } = await sb.from('profiles').select('id, full_name, role, is_active').eq('id', session.user.id).maybeSingle(); 
  if (!profile || !profile.is_active || profile.role !== 'admin') { 
    await sb.auth.signOut(); return location.replace('login.html'); 
  }
  
  me = profile; 
  $('user-name').textContent = profile.full_name; 
  $('user-avatar').textContent = profile.full_name.charAt(0); 
  $('user-role').textContent = ROLE_LABELS[profile.role];
  
  $('p-year').value = new Date().getFullYear();
  $('p-month').value = new Date().getMonth() + 1;

  await loadData(); 
  $('app').hidden = false;
}

$('logout-btn').addEventListener('click', async () => { await sb.auth.signOut(); location.replace('login.html'); });
init();