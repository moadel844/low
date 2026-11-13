const ROLE_LABELS = { admin: 'مدير', lawyer: 'محامي', secretary: 'سكرتارية' };
const CASE_STATUS = { open: 'متداولة', reserved: 'محجوزة للحكم', judged: 'محكوم فيها', archived: 'مؤرشفة' };
let me = null;
const $ = (id) => document.getElementById(id);
const isAdmin = () => me && me.role === 'admin';
function goToLogin() { location.replace('login.html'); }
const fmtCurrency = (val) => (val || 0).toLocaleString('ar-EG-u-nu-latn');

async function loadReport() {
  const { data, error } = await sb.from('cases').select(`id, case_number, case_year, status, client_fees, court_fees, clients(full_name)`).order('created_at', { ascending: false });
  
  if (error) { 
    $('toast').textContent = 'حدث خطأ في تحميل التقرير.'; 
    $('toast').className = 'alert toast'; 
    $('toast').hidden = false; 
    return; 
  }
  
  let totalFees = 0, totalExpenses = 0; 
  const tbody = $('report-table-body'); 
  tbody.replaceChildren();
  
  if (!data || !data.length) { 
    tbody.innerHTML = '<tr><td colspan="5" class="muted" style="text-align: center;">لا توجد قضايا مسجلة.</td></tr>'; 
  } else {
    data.forEach(c => {
      const fees = c.client_fees || 0, expenses = c.court_fees || 0; 
      totalFees += fees; 
      totalExpenses += expenses; 
      const st = CASE_STATUS[c.status] || c.status;
      
      tbody.innerHTML += `
        <tr>
          <td><a href="cases.html?id=${c.id}" style="font-weight: 600; color: var(--indigo); text-decoration: none;">قضية ${c.case_number} لسنة ${c.case_year}</a></td>
          <td>${c.clients?.full_name || '-'}</td>
          <td><span class="tag ${c.status === 'open' ? 'good' : ''}">${st}</span></td>
          <td class="amount" style="color: #1f7a5a; font-weight: 600;">${fmtCurrency(fees)} ج.م</td>
          <td class="amount" style="color: var(--stamp); font-weight: 600;">${fmtCurrency(expenses)} ج.م</td>
        </tr>
      `;
    });
  }
  
  $('total-fees').textContent = fmtCurrency(totalFees) + ' ج.م'; 
  $('total-expenses').textContent = fmtCurrency(totalExpenses) + ' ج.م'; 
  $('total-net').textContent = fmtCurrency(totalFees - totalExpenses) + ' ج.م';
}

async function init() {
  const { data: { session } } = await sb.auth.getSession(); 
  if (!session) return goToLogin();
  
  const { data: profile } = await sb.from('profiles').select('id, full_name, role, is_active').eq('id', session.user.id).maybeSingle(); 
  if (!profile || !profile.is_active) { await sb.auth.signOut(); return goToLogin(); }
  
  me = profile; 
  $('user-name').textContent = profile.full_name; 
  $('user-avatar').textContent = profile.full_name.charAt(0); 
  $('user-role').textContent = ROLE_LABELS[profile.role] || profile.role; 
  
  if (isAdmin()) $('admin-link').hidden = false;
  
  await loadReport(); 
  $('app').hidden = false;
}

$('logout-btn').addEventListener('click', async () => { await sb.auth.signOut(); goToLogin(); });
init();