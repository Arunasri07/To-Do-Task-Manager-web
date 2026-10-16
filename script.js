
const API = "/api/tasks";
const $ = id => document.getElementById(id);

let tasks = [];
let category = "Accepted";
let editingId = null;
let page = 1;
let pageSize = 10;
let searchText = "";
let filters = { status: "", priority: "", deadline: "" };

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

function notify(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  setTimeout(() => $("toast").classList.remove("show"), 2500);
}

function safe(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[c]);
}

function dateText(value) {
  if (!value) return "—";
  const d = new Date(value + "T00:00:00");
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-GB");
}

async function refresh() {
  try {
    tasks = await api(API);
    const stats = {
      total: tasks.length,
      progress: tasks.filter(t => t.status === "In progress").length,
      completed: tasks.filter(t => t.status === "Completed").length,
      overdue: tasks.filter(t => t.overdue).length
    };

    $("total").textContent = stats.total;
    $("progress").textContent = stats.progress;
    $("completed").textContent = stats.completed;
    $("overdue").textContent = stats.overdue;

    ["Assigned", "Accepted", "Review"].forEach(c => {
      $(`count-${c.toLowerCase()}`).textContent =
        tasks.filter(t => t.category === c).length;
    });

    render();
  } catch (error) {
    $("task-list").innerHTML =
      `<tr><td colspan="7" class="empty-row">${safe(error.message)}. Is Flask running?</td></tr>`;
  }
}

function filteredTasks() {
  return tasks.filter(t => {
    const matchesCategory = t.category === category;
    const matchesSearch =
      (t.title + " " + (t.description || "") + " " + (t.created_by || ""))
        .toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = !filters.status || t.status === filters.status;
    const matchesPriority = !filters.priority || t.priority === filters.priority;
    const matchesDate = !filters.deadline || t.deadline === filters.deadline;

    return matchesCategory && matchesSearch &&
      matchesStatus && matchesPriority && matchesDate;
  });
}

function render() {
  const list = filteredTasks();
  const pages = Math.max(1, Math.ceil(list.length / pageSize));
  page = Math.min(page, pages);
  const start = (page - 1) * pageSize;
  const visible = list.slice(start, start + pageSize);

  $("task-list").innerHTML = visible.length ? visible.map(t => {
    const statusClass = t.status.toLowerCase().replace(" ", "-");
    const overdue = t.overdue
      ? '<div class="task-desc overdue-text">Overdue</div>' : "";

    return `
      <tr>
        <td>
          <div class="task-name">${safe(t.title)}</div>
          ${t.description ? `<div class="task-desc">${safe(t.description)}</div>` : ""}
          ${overdue}
        </td>
        <td><span class="badge ${t.priority.toLowerCase()}">${safe(t.priority)}</span></td>
        <td><span class="badge ${statusClass}">${safe(t.status)}</span></td>
        <td>${safe(t.created_by || "You")}</td>
        <td>${dateText(t.date_assigned)}</td>
        <td>${dateText(t.deadline)}</td>
        <td>
          <div class="actions">
            <button data-action="view" data-id="${t.id}" title="View">⌕</button>
            <button data-action="edit" data-id="${t.id}" title="Edit">✎</button>
            <button class="delete" data-action="delete" data-id="${t.id}" title="Delete">×</button>
            <button class="change-status" data-action="status" data-id="${t.id}" title="Change status">⋮</button>
          </div>
        </td>
      </tr>`;
  }).join("") : '<tr><td colspan="7" class="empty-row">No tasks found. Create a new task!</td></tr>';

  $("page-info").textContent =
    `${list.length ? start + 1 : 0}–${Math.min(start + pageSize, list.length)} of ${list.length}`;
  $("previous").disabled = page <= 1;
  $("next").disabled = page >= pages;
}

function openModal(task = null) {
  editingId = task ? task.id : null;
  $("task-form").reset();
  $("error").textContent = "";
  $("modal-heading").textContent = task ? "Edit Task" : "Create New Task";
  $("save").textContent = task ? "Save Changes" : "Create Task";

  $("title").value = task?.title || "";
  $("description").value = task?.description || "";
  $("priority").value = task?.priority || "Medium";
  $("status").value = task?.status || "Pending";
  $("deadline").value = task?.deadline || "";
  $("category").value = task?.category || category;
  $("creator").value = task?.created_by || "You";

  $("modal").hidden = false;
  $("title").focus();
}

function closeModal() {
  $("modal").hidden = true;
  editingId = null;
}

$("create").addEventListener("click", () => openModal());
$("close").addEventListener("click", closeModal);
$("cancel").addEventListener("click", closeModal);

$("modal").addEventListener("click", e => {
  if (e.target === $("modal")) closeModal();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
});

$("task-form").addEventListener("submit", async e => {
  e.preventDefault();

  const title = $("title").value.trim();
  if (!title) {
    $("error").textContent = "Please enter a task title.";
    return;
  }

  const data = {
    title,
    description: $("description").value.trim(),
    priority: $("priority").value,
    status: $("status").value,
    deadline: $("deadline").value,
    category: $("category").value,
    created_by: $("creator").value.trim() || "You"
  };

  try {
    if (editingId !== null) {
      await api(`${API}/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
      notify("Task updated successfully");
    } else {
      await api(API, {
        method: "POST",
        body: JSON.stringify(data)
      });
      notify("Task created successfully");
    }

    closeModal();
    page = 1;
    await refresh();
  } catch (error) {
    $("error").textContent = error.message;
  }
});

$("task-list").addEventListener("click", async e => {
  const button = e.target.closest("button[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  try {
    if (button.dataset.action === "view") {
      alert(
        `Title: ${task.title}\nDescription: ${task.description || "—"}\n` +
        `Priority: ${task.priority}\nStatus: ${task.status}\n` +
        `Category: ${task.category}\nCreated by: ${task.created_by}\n` +
        `Due date: ${dateText(task.deadline)}`
      );
    }

    if (button.dataset.action === "edit") openModal(task);

    if (button.dataset.action === "delete") {
      if (!confirm(`Delete "${task.title}"?`)) return;
      await api(`${API}/${id}`, { method: "DELETE" });
      notify("Task deleted");
      await refresh();
    }

    if (button.dataset.action === "status") {
      const statuses = ["Pending", "In progress", "Completed"];
      const next = statuses[(statuses.indexOf(task.status) + 1) % 3];

      await api(`${API}/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: next })
      });

      notify(`Status changed to ${next}`);
      await refresh();
    }
  } catch (error) {
    notify(error.message);
  }
});

document.querySelectorAll(".tabs button").forEach(button => {
  button.addEventListener("click", () => {
    category = button.dataset.category;
    page = 1;

    document.querySelectorAll(".tabs button").forEach(b =>
      b.classList.toggle("selected", b === button)
    );

    render();
  });
});

$("search").addEventListener("input", e => {
  searchText = e.target.value;
  page = 1;
  render();
});

$("apply").addEventListener("click", () => {
  filters.status = $("filter-status").value;
  filters.priority = $("filter-priority").value;
  filters.deadline = $("filter-date").value;
  page = 1;
  render();
});

$("clear").addEventListener("click", () => {
  $("filter-status").value = "";
  $("filter-priority").value = "";
  $("filter-date").value = "";
  $("search").value = "";
  searchText = "";
  filters = { status: "", priority: "", deadline: "" };
  page = 1;
  render();
});

$("page-size").addEventListener("change", e => {
  pageSize = Number(e.target.value);
  page = 1;
  render();
});

$("previous").addEventListener("click", () => {
  if (page > 1) page--;
  render();
});

$("next").addEventListener("click", () => {
  page++;
  render();
});

$("theme").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

$("settings").addEventListener("click", () => {
  alert("Use the moon icon to change the dashboard theme.");
});

$("notifications").addEventListener("click", () => {
  const overdue = tasks.filter(t => t.overdue);
  alert(overdue.length
    ? `You have ${overdue.length} overdue task(s).`
    : "You're all caught up!");
});

document.querySelectorAll(".nav[data-view]").forEach(button => {
  button.addEventListener("click", () => {
    const view = button.dataset.view;

    document.querySelectorAll(".nav").forEach(n =>
      n.classList.toggle("active", n === button)
    );

    if (view === "tasks") {
      $("other-view").hidden = true;
      $("tasks-view").hidden = false;
      return;
    }

    $("tasks-view").hidden = true;
    $("other-view").hidden = false;

    if (view === "analytics") {
      $("other-title").textContent = "Analytics";
      const done = tasks.filter(t => t.status === "Completed").length;
      const percent = tasks.length ? Math.round(done / tasks.length * 100) : 0;
      $("other-description").textContent =
        `${done} of ${tasks.length} tasks completed (${percent}%).`;
      $("other-content").textContent =
        `Pending: ${tasks.filter(t => t.status === "Pending").length} | ` +
        `In progress: ${tasks.filter(t => t.status === "In progress").length}`;
    }

    if (view === "calendar") {
      $("other-title").textContent = "Upcoming Deadlines";
      $("other-description").textContent = "Your unfinished tasks with due dates.";
      $("other-content").innerHTML = tasks
        .filter(t => t.deadline && t.status !== "Completed")
        .sort((a, b) => a.deadline.localeCompare(b.deadline))
        .map(t => `<p>${safe(t.title)} — ${dateText(t.deadline)}</p>`)
        .join("") || "No upcoming deadlines.";
    }

    if (view === "inbox") {
      $("other-title").textContent = "Notifications";
      $("other-description").textContent = "Tasks that may need your attention.";
      $("other-content").textContent = tasks.some(t => t.overdue)
        ? `${tasks.filter(t => t.overdue).length} task(s) overdue.`
        : "No overdue tasks. You're all caught up!";
    }
  });
});

refresh();
