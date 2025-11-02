document.addEventListener('DOMContentLoaded', () => {
  // DOM
  const taskInput = document.getElementById('taskInput');
  const addBtn = document.getElementById('addBtn');
  const deadlineInput = document.getElementById('deadlineInput');
  const prioritySelect = document.getElementById('prioritySelect');
  const taskList = document.getElementById('taskList');
  const searchInput = document.getElementById('searchInput');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const darkModeToggle = document.getElementById('darkModeToggle');
  const exportBtn = document.getElementById('exportBtn');
  const taskCount = document.getElementById('taskCount');
  const reminderModal = document.getElementById('reminderModal');
  const reminderText = document.getElementById('reminderText');
  const closeReminder = document.getElementById('closeReminder');

  // Data
  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  let currentFilter = 'all';

  // helpers
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  const save = () => localStorage.setItem('tasks', JSON.stringify(tasks));

  // render
  function renderTasks() {
    taskList.innerHTML = '';
    const q = (searchInput.value || '').toLowerCase();

    const filtered = tasks.filter(t => {
      if (currentFilter === 'completed' && !t.completed) return false;
      if (currentFilter === 'pending' && t.completed) return false;
      if (q && !t.text.toLowerCase().includes(q)) return false;
      return true;
    });

    taskCount.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;

    filtered.forEach(t => {
      const card = document.createElement('div');
      card.className = 'task-card' + (t.completed ? ' completed' : '');
      card.dataset.id = t.id;

      const top = document.createElement('div');
      top.className = 'task-top';

      const left = document.createElement('div');
      left.className = 'task-left';

      const check = document.createElement('button');
      check.className = 'check-btn' + (t.completed ? ' completed' : '');
      check.title = t.completed ? 'Mark as pending' : 'Mark as completed';
      const checkSpan = document.createElement('span');
      checkSpan.textContent = '✓';
      check.appendChild(checkSpan);

      const meta = document.createElement('div');
      const title = document.createElement('p');
      title.className = 'task-title';
      title.textContent = t.text;
      title.title = 'Click to edit';

      title.addEventListener('click', () => {
        const newText = prompt('Edit task text:', t.text);
        if (newText !== null) {
          t.text = newText.trim() || t.text;
          save(); renderTasks();
        }
      });

      const info = document.createElement('p');
      info.className = 'task-info';
      info.textContent = t.deadline ? `Deadline: ${t.deadline}` : '';
      const badge = document.createElement('span');
      badge.className = 'badge ' + (t.priority === 'high' ? 'high' : 'low');
      badge.textContent = t.priority === 'high' ? 'High' : 'Low';
      info.appendChild(badge);

      meta.appendChild(title);
      meta.appendChild(info);

      left.appendChild(check);
      left.appendChild(meta);

      const right = document.createElement('div');
      right.className = 'task-actions';

      const star = document.createElement('button');
      star.className = 'star-btn' + (t.priority === 'high' ? ' important' : '');
      star.textContent = '★';
      star.title = t.priority === 'high' ? 'Unset priority' : 'Set as high priority';

      const editBtn = document.createElement('button');
      editBtn.className = 'edit-btn';
      editBtn.textContent = '✎';
      editBtn.title = 'Edit task';

      const del = document.createElement('button');
      del.className = 'delete-btn';
      del.textContent = '🚮';
      del.title = 'Delete task';

      right.appendChild(star);
      right.appendChild(editBtn);
      right.appendChild(del);

      top.appendChild(left);
      top.appendChild(right);
      card.appendChild(top);

      taskList.appendChild(card);

      // events
      check.addEventListener('click', () => {
        t.completed = !t.completed; save(); renderTasks();
      });
      star.addEventListener('click', () => { t.priority = t.priority === 'high' ? 'low' : 'high'; save(); renderTasks(); });
      editBtn.addEventListener('click', () => {
        const newText = prompt('Edit task text:', t.text);
        if (newText !== null) { t.text = newText.trim() || t.text; save(); renderTasks(); }
      });
      del.addEventListener('click', () => { tasks = tasks.filter(x=>x.id!==t.id); save(); renderTasks(); });

    });
  }

  // add
  addBtn.addEventListener('click', () => {
    const text = (taskInput.value || '').trim();
    if (!text) return;
    const newTask = {
      id: uid(),
      text,
      deadline: deadlineInput.value || '',
      priority: prioritySelect.value || 'low',
      completed: false
    };
    tasks.unshift(newTask);
    save(); renderTasks();
    taskInput.value=''; deadlineInput.value=''; prioritySelect.value='low';
  });

  taskInput.addEventListener('keyup', e => { if (e.key==='Enter') addBtn.click(); });

  // search
  searchInput.addEventListener('input', renderTasks);

  // filter
  filterBtns.forEach(b=>{
    b.addEventListener('click', ()=>{
      filterBtns.forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      currentFilter = b.dataset.value;
      renderTasks();
    });
  });

  // dark mode
  darkModeToggle.addEventListener('click', ()=>{
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? '1':'0');
  });
  if(localStorage.getItem('darkMode')==='1') document.body.classList.add('dark-mode');

  // export
  exportBtn.addEventListener('click', ()=>{
    const text = tasks.map(t=>`${t.completed? '[✓]':'[ ]'} ${t.text} ${t.deadline? '- '+t.deadline : ''} (Priority: ${t.priority})`).join('\n');
    const blob = new Blob([text], {type:'text/plain'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='tasks.txt'; a.click();
    URL.revokeObjectURL(a.href);
  });

  // Reminder detection (fake reminder)
  function tasksDueSoon() {
    const soon = [];
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24*60*60*1000);
    tasks.forEach(t=>{
      if (!t.deadline) return;
      // parse yyyy-mm-dd
      const d = new Date(t.deadline + 'T00:00:00');
      if (d >= now && d <= tomorrow) soon.push(t);
    });
    return soon;
  }

  function showReminderIfAny() {
    const soon = tasksDueSoon();
    if (soon.length === 0) return;

    // build message
    const names = soon.map(s => s.text + (s.deadline ? ` (due ${s.deadline})` : '')).join('\n• ');
    reminderText.textContent = `You have ${soon.length} task(s) due within 24 hours:\n• ${names}`;

    // show modal
    reminderModal.classList.remove('hidden');

    // browser notification if allowed
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('CLARITY — Task Reminder', { body: `${soon.length} task(s) due soon. Open site to view.` });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(p => {
          if (p === 'granted') {
            new Notification('CLARITY — Task Reminder', { body: `${soon.length} task(s) due soon. Open site to view.` });
          }
        });
      }
    }
  }

  // close reminder
  // the modal has id closeReminder button inside index.html; if not present, fallback to click anywhere to close
  (function wireClose(){
    const closeBtn = document.getElementById('closeReminder');
    if (closeBtn) closeBtn.addEventListener('click', ()=> reminderModal.classList.add('hidden'));
    // also allow clicking outside
    reminderModal.addEventListener('click', e=>{
      if (e.target === reminderModal) reminderModal.classList.add('hidden');
    });
  })();

  // initial render + show reminder
  renderTasks();
  // small delay so UI ready
  setTimeout(showReminderIfAny, 300);

});
