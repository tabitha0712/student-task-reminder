document.addEventListener("DOMContentLoaded", function() {

  // ---------- Elemen ----------
  const taskInput = document.getElementById("taskInput");
  const addBtn = document.getElementById("addBtn");
  const deadlineInput = document.getElementById("deadlineInput");
  const prioritySelect = document.getElementById("prioritySelect");
  const taskList = document.getElementById("taskList");
  const searchInput = document.getElementById("searchInput");
  const filterSelect = { value: "all" }; // dummy object untuk filter
  const darkModeToggle = document.getElementById("darkModeToggle");
  const exportBtn = document.getElementById("exportBtn");

  // ---------- Data ----------
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  // ---------- Render ----------
  function renderTasks() {
    taskList.innerHTML = "";
    let filtered = tasks;

    // Filter
    if (filterSelect.value === "completed") {
      filtered = tasks.filter(t => t.completed);
    } else if (filterSelect.value === "pending") {
      filtered = tasks.filter(t => !t.completed);
    }

    // Search
    const query = searchInput.value.toLowerCase();
    filtered = filtered.filter(t => t.text.toLowerCase().includes(query));

    // Render each task
    filtered.forEach((task, index) => {
      const card = document.createElement("div");
      card.className = "task-card" + (task.completed ? " completed" : "");

      const left = document.createElement("div");
      left.className = "task-left";

      const checkBtn = document.createElement("button");
      checkBtn.className = "check-btn" + (task.completed ? " completed" : "");
      checkBtn.addEventListener("click", () => {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
      });

      const titleEl = document.createElement("div");
      titleEl.className = "task-title";
      titleEl.textContent = task.text;

      const infoEl = document.createElement("div");
      infoEl.className = "task-info";
      infoEl.textContent = task.deadline ? `Deadline: ${task.deadline}` : "";

      const badge = document.createElement("span");
      badge.className = "badge " + task.priority;
      badge.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

      infoEl.appendChild(badge);
      left.appendChild(checkBtn);
      left.appendChild(titleEl);
      left.appendChild(infoEl);

      const right = document.createElement("div");
      right.className = "task-actions";

      const starBtn = document.createElement("button");
      starBtn.className = "star-btn" + (task.priority === "high" ? " important" : "");
      starBtn.textContent = "★";
      starBtn.addEventListener("click", () => {
        task.priority = task.priority === "high" ? "low" : "high";
        saveTasks();
        renderTasks();
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "🚮";
      deleteBtn.addEventListener("click", () => {
        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
      });

      right.appendChild(starBtn);
      right.appendChild(deleteBtn);

      card.appendChild(left);
      card.appendChild(right);

      taskList.appendChild(card);
    });
  }

  // ---------- Save ----------
  function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  // ---------- Add Task ----------
  addBtn.addEventListener("click", () => {
    const text = taskInput.value.trim();
    const deadline = deadlineInput.value;
    const priority = prioritySelect.value;

    if (text === "") return;

    tasks.push({ text, deadline, priority, completed: false });
    saveTasks();
    renderTasks();

    taskInput.value = "";
    deadlineInput.value = "";
    prioritySelect.value = "low";
  });

  // Enter key
  taskInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") addBtn.click();
  });

  // ---------- Search ----------
  searchInput.addEventListener("input", renderTasks);

  // ---------- Filter ----------
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      filterSelect.value = btn.value;
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderTasks();
    });
  });

  // ---------- Dark Mode ----------
  darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
  });

  // ---------- Export ----------
  exportBtn.addEventListener("click", () => {
    let data = tasks.map(t => `${t.completed ? "[✓]" : "[ ]"} ${t.text} (Priority: ${t.priority}, Deadline: ${t.deadline || "-"})`).join("\n");
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tasks.txt";
    a.click();
    URL.revokeObjectURL(url);
  });

  // ---------- Initial Render ----------
  renderTasks();

});


