(function() {
  window.addEventListener('load', async () => {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return;

    const userBox = document.querySelector('.user-box');
    const logoutBtn = document.getElementById('logout-btn');
    if (!userBox || !logoutBtn) return;

    // إنشاء الزرار
    const btn = document.createElement('button');
    btn.className = 'btn btn-quiet';
    btn.style.marginLeft = '0.5rem';
    btn.id = 'attendance-btn';
    btn.textContent = 'تسجيل حضور';
    
    // فحص هل سجل حضور النهاردة
    const today = new Date().toISOString().split('T')[0];
    const { data: att } = await sb.from('attendance').select('*').eq('user_id', session.user.id).eq('date', today).maybeSingle();

    if (att && att.check_in && !att.check_out) {
      btn.textContent = 'تسجيل انصراف';
      btn.style.background = '#ef4444';
    } else if (att && att.check_out) {
      btn.textContent = 'تم تسجيل اليوم ✓';
      btn.disabled = true;
    }

    btn.onclick = async () => {
      const now = new Date().toISOString();
      
      if (att && att.check_in && !att.check_out) {
        // انصراف
        await sb.from('attendance').update({ check_out: now }).eq('id', att.id);
        btn.textContent = 'تم تسجيل اليوم ✓';
        btn.disabled = true;
        btn.style.background = '#10b981';
        alert('تم تسجيل الانصراف بنجاح!');
      } else if (!att) {
        // حضور
        await sb.from('attendance').insert({ user_id: session.user.id, date: today, check_in: now });
        btn.textContent = 'تسجيل انصراف';
        btn.style.background = '#ef4444';
        alert('تم تسجيل الحضور بنجاح!');
      }
    };

    userBox.insertBefore(btn, logoutBtn);
  });
})();