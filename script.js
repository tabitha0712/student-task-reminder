/* CLARITY — script.js
   Clean & readable — features:
   - add / edit / delete
   - mark complete / toggle important
   - filter (all/pending/completed)
   - sort (created/deadline/priority)
   - search
   - localStorage autosave
   - export to .txt
   - theme toggle (simple)
*/

// ======= Helpers =======
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);

// ======= DOM refs =======
const taskInput = $('#taskInput');
const deadlineInput = $('#deadlineInput');
const prioritySelect = $('#prioritySelect');
const addTaskBtn = $('#addTaskBtn');
const taskListWrap = $('#taskList');
const taskTemplate = $('#taskTemplate');
const filterBtns = $$('.filter-btn');
const sortSelect = $('#sortSelect');
const searchInput = $('#searchInput');
const exportBtn = $('#exportBtn');
const toggleThemeBtn = $('#toggleTheme');

// ======= App state =======
let tasks = JSON.parse(localStorage.getItem('clarity_tasks')) || [];
let currentFilter = 'all';
let currentSearch = '';
let currentSort = 'created';

// ======= Render tasks =======
function saveAndRender(){
  localStorage.setItem('clarity_tasks', JSON.stringify(tasks));
  renderTasks();
}

function renderTasks(){
  taskListWrap.innerHTML = '';
  // Filter & Search
  let list = tasks.slice();
  if(currentFilter === 'completed') list = list.filter(t => t.completed);
  else if(currentFilter === 'pending') list = list.filter(t => !t.completed);

  if(currentSearch.trim()){
    const q = currentSearch.trim().toLowerCase();
    list = list.filter(t => (t.text || '').toLowerCase().includes(q));
  }

  // Sort
  if(currentSort === 'deadline'){
    list.sort((a,b) => {
      if(!a.deadline) return 1;
      if(!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });
  } else if(currentSort === 'priority'){
    const order = { high:0, medium:1, low:2 };
    list.sort((a,b) => (order[a.priority] - order[b.priority]));
  } else {
    list.sort((a,b) => b.created - a.created);
  }

  // Render each
  list.forEach(task => {
    const tpl = taskTemplate.content.cloneNode(true);
    const card = tpl.querySelector('.task-card');
    const titleEl = tpl.querySelector('.task-title');
    const infoEl = tpl.querySelector('.task-info');
    const checkBtn = tpl.querySelector('.check-btn');
    const starBtn = tpl.querySelector('.star-btn');
    const editBtn = tpl.querySelector('.edit-btn');
    const deleteBtn = tpl.querySelector('.delete-btn');

    // Fill content
    titleEl.textContent = task.text;
    let info = [];
    if(task.deadline) info.push(`Due: ${formatDate(task.deadline)}`);
    info.push(`Priority: ${capitalize(task.priority)}`);
    infoEl.textContent = info.join(' • ');

    // States
    if(task.completed){
      card.classList.add('completed');
      checkBtn.classList.add('completed');
    }
    if(task.important){
      starBtn.classList.add('important');
    }

    // Priority badge (append to title)
    const badge = document.createElement('span');
    badge.className = `badge ${task.priority}`;
    badge.textContent = task.priority;
    // insert badge after title
    titleEl.appendChild(document.createTextNode(' '));
    titleEl.appendChild(badge);

    // Actions binding
    checkBtn.addEventListener('click', () => {
      toggleComplete(task.id);
    });
    starBtn.addEventListener('click', () => {
      toggleImportant(task.id);
    });
    deleteBtn.addEventListener('click', () => {
      if(confirm('Delete this task?')) {
        deleteTask(task.id);
      }
    });
    editBtn.addEventListener('click', () => {
      startEdit(task.id);
    });

    taskListWrap.appendChild(tpl);
  });

  // If empty show placeholder
  if(list.length === 0){
    const p = document.createElement('p');
    p.style.color = 'var(--muted)';
    p.style.textAlign = 'center';
    p.style.padding = '18px';
    p.textContent = 'No tasks found — add your first task!';
    taskListWrap.appendChild(p);
  }
}

// ======= Utils =======
function formatDate(d){
  if(!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString(); // simple
}
function capitalize(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

// ======= CRUD =========
function addTask(){
  const text = (taskInput.value || '').trim();
  if(!text) { alert('Please enter a task.'); return; }
  const newTask = {
    id: uid(),
    text,
    deadline: deadlineInput.value || null,
    priority: prioritySelect.value || 'medium',
    completed: false,
    important: false,
    created: Date.now()
  };
  tasks.push(newTask);
  taskInput.value = '';
  deadlineInput.value = '';
  prioritySelect.value = 'medium';
  saveAndRender();
}
function deleteTask(id){
  tasks = tasks.filter(t => t.id !== id);
  saveAndRender();
}
function toggleComplete(id){
  const t = tasks.find(x=>x.id===id);
  if(!t) return;
  t.completed = !t.completed;
  saveAndRender();
}
function toggleImportant(id){
  const t = tasks.find(x=>x.id===id);
  if(!t) return;
  t.important = !t.important;
  saveAndRender();
}

// ======= Edit flow =======
let editingId = null;
function startEdit(id){
  const t = tasks.find(x=>x.id===id);
  if(!t) return;
  // prefill inputs
  taskInput.value = t.text;
  deadlineInput.value = t.deadline || '';
  prioritySelect.value = t.priority || 'medium';
  editingId = id;
  addTaskBtn.textContent = 'Save';
  addTaskBtn.classList.add('primary');
  // scroll to top for editing
  window.scrollTo({top:0, behavior:'smooth'});
}
function finishEdit(){
  if(!editingId) return;
  const t = tasks.find(x=>x.id===editingId);
  if(!t) return;
  const text = (taskInput.value || '').trim();
  if(!text) { alert('Task cannot be empty'); return; }
  t.text = text;
  t.deadline = deadlineInput.value || null;
  t.priority = prioritySelect.value || 'medium';
  editingId = null;
  addTaskBtn.textContent = 'Add';
  addTaskBtn.classList.remove('primary');
  taskInput.value = '';
  deadlineInput.value = '';
  prioritySelect.value = 'medium';
  saveAndRender();
}

// ======= Search / Filter / Sort handlers =======
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});
sortSelect.addEventListener('change', () => {
  currentSort = sortSelect.value;
  renderTasks();
});
searchInput.addEventListener('input', (e) => {
  currentSearch = e.target.value;
  renderTasks();
});

// ======= Export to TXT =======
function exportToTxt(){
  if(tasks.length === 0){ alert('No tasks to export'); return; }
  const lines = tasks.map(t => {
    const s = `[${t.completed ? 'x':' '}] ${t.text} ${t.deadline ? '(Due: '+t.deadline+')':''} [${t.priority}]`;
    return s;
  });
  const blob = new Blob([lines.join('\n')], {type: 'text/plain'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'clarity_tasks.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ======= Theme toggle (simple) =======
function toggleTheme(){
  document.documentElement.classList.toggle('dark-mode');
  // optional: remember preference
  const isDark = document.documentElement.classList.contains('dark-mode');
  localStorage.setItem('clarity_dark', isDark ? '1' : '0');
}
function applySavedTheme(){
  const v = localStorage.getItem('clarity_dark');
  if(v === '1') document.documentElement.classList.add('dark-mode');
}

// ======= Keyboard / button wiring =======
addTaskBtn.addEventListener('click', () => {
  if (editingId) finishEdit();
  else addTask();
});

taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (editingId) finishEdit();
    else addTask();
  }
});

//exportBtn.addEventListener('click', exportToTxt);
// toggleThemeBtn.addEventListener('click', toggleTheme);
// ======= Init =======
applySavedTheme();
renderTasks();

