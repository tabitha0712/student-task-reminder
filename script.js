// ---------- Data & LocalStorage ----------
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// ---------- DOM Elements ----------
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const searchInput = document.getElementById('searchInput');
const filterSelect = document.getElementById('filterSelect');
const darkModeToggle = document.getElementById('darkModeToggle');
const exportBtn = document.getElementById('exportBtn');

// ---------- Render Tasks ----------
function renderTasks() {
  taskList.innerHTML = '';

  let filteredTasks = tasks.filter(task => {
    // Filter search
    const searchText = searchInput.value.toLowerCase();
    return task.text.toLowerCase().includes(searchText);
  });

  // Filter by status
  const filter = filterSelect.value;
  if(filter === 'completed'){
    filteredTasks = filteredTasks.filter(t => t.completed);
  } else if(filter === 'pending'){
    filteredTasks = filteredTasks.filter(t => !t.completed);
  }

  filteredTasks.forEach((task, index) => {
    const taskCard = document.createElement('div');
    taskCard.classList.add('task-card');
    if(task.completed) taskCard.classList.add('completed');
    if(task.priority) taskCard.classList.add('priority');

    taskCard.innerHTML = `
      <div class="task-left">
        <button class="check-btn ${task.completed ? 'completed' : ''}"></button>
        <div>
          <p class="task-title">${task.text}</p>
          <p class="task-info">${task.deadline ? 'Deadline: '+task.deadline : ''}</p>
        </div>
      </div>
      <div class="task-actions">
        <button class="star-btn ${task.priority ? 'important' : ''}">★</button>
        <button class="delete-btn">🚮</button>
      </div>
    `;

    // Toggle completed
    taskCard.querySelector('.check-btn').addEventListener('click', () => {
      tasks[index].completed = !tasks[index].completed;
      saveAndRender();
    });

    // Toggle priority
    taskCard.querySelector('.star-btn').addEventListener('click', () => {
      tasks[index].priority = !tasks[index].priority;
      saveAndRender();
    });

    // Delete task
    taskCard.querySelector('.delete-btn').addEventListener('click', () => {
      tasks.splice(index,1);
      saveAndRender();
    });

    taskList.appendChild(taskCard);
  });
}

// ---------- Add Task ----------
addBtn.addEventListener('click', () => {
  const text = taskInput.value.trim();
  const deadline = document.getElementById('deadlineInput').value;
  const priority = document.getElementById('prioritySelect').value === 'high';

  if(text === '') return;

  tasks.push({text, deadline, priority, completed:false});
  taskInput.value = '';
  document.getElementById('deadlineInput').value = '';
  document.getElementById('prioritySelect').value = 'low';

  saveAndRender();
});

// ---------- Search & Filter ----------
searchInput.addEventListener('input', renderTasks);
filterSelect.addEventListener('change', renderTasks);

// ---------- Dark Mode ----------
darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
});

// ---------- Export ----------
exportBtn.addEventListener('click', () => {
  const data = tasks.map(t => `${t.completed ? '[✓]' : '[ ]'} ${t.text} ${t.deadline ? '- '+t.deadline : ''}`).join('\n');
  const blob = new Blob([data], {type:'text/plain'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'tasks.txt';
  link.click();
});

// ---------- Save & Render ----------
function saveAndRender() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
  renderTasks();
}

// ---------- Initial Render ----------
renderTasks();


