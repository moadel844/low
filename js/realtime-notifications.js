(function() {
  // 1. تجهيز الصوت (Web Audio API)
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    // لو المتصفح شغال بس مكتوم، بنفك الكتم
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // أول ما المستخدم يدوس في أي حتة في الصفحة، بنفك قفل الصوت
  document.addEventListener('click', initAudio, { once: true });
  document.addEventListener('keydown', initAudio, { once: true });
  document.addEventListener('touchstart', initAudio, { once: true });

  // دالة تشغيل الصوت
  function playNotificationSound() {
    try {
      if (!audioCtx) initAudio();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1); 
      
      gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.log('المتصفح منع تشغيل الصوت:', e);
    }
  }

  window.addEventListener('load', async () => {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return;

    const badge = document.getElementById('notif-badge');
    const list = document.getElementById('notif-list');

    const channel = sb.channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotif = payload.new;
          
          // لو الإشعار ده متوجه لشخص تاني، متعرضهوش عندي
          if (newNotif.user_id && newNotif.user_id !== session.user.id) return;

          console.log('إشعار جديد وصل!', newNotif);

          // تشغيل الصوت
          playNotificationSound();

          if (badge) {
            let currentCount = parseInt(badge.textContent) || 0;
            if (badge.style.display === 'none') currentCount = 0;
            currentCount++;
            badge.style.display = 'grid';
            badge.textContent = currentCount;
          }

          if (list) {
            if (list.innerHTML.includes('لا توجد إشعارات') || list.innerHTML.includes('جاري التحميل')) {
              list.innerHTML = '';
            }

            const li = document.createElement('li');
            li.className = 'notif-item';
            li.style.background = '#fef3c7';
            li.style.borderRight = '3px solid #f59e0b';
            li.onclick = () => { window.navigateWithTransition('index.html'); };
            
            li.innerHTML = `<strong>🔔 ${newNotif.title}</strong><span>${newNotif.message}</span>`;
            
            list.insertBefore(li, list.firstChild);
          }

          if (window.flash) {
            window.flash(`إشعار جديد: ${newNotif.title}`, true);
          }
        }
      )
      .subscribe();
  });
})();