import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const fetchTasks = async () => {
    try {
      const res = await api.get("/tasks", {
        params: {
          page,
          limit,
          status: statusFilter || undefined,
          search: search || undefined,
        },
      });
      setTasks(res.data.tasks);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [page, statusFilter, search]);

  // ---------------- LOGOUT ----------------
  const handleLogout = () => {
  localStorage.removeItem("token");
  navigate("/login");
 };


  // ---------------- TASK CRUD ----------------
  const createTask = async (e) => {
    e.preventDefault();
    if (!title) return alert("Title required");

    await api.post("/tasks", { title, description });
    setTitle("");
    setDescription("");
    fetchTasks();
  };

  const toggleTask = async (id) => {
    await api.patch(`/tasks/${id}/toggle`);
    fetchTasks();
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Delete task?")) return;
    await api.delete(`/tasks/${id}`);
    fetchTasks();
  };

  const updateTask = async (task) => {
    const newTitle = prompt("Edit title", task.title);
    if (!newTitle) return;

    await api.patch(`/tasks/${task.id}`, { title: newTitle });
    fetchTasks();
  };

  return (
    <div className="dashboard-container">
      
      {/* Header */}
      <div className="dashboard-header">
        <h2>Task Dashboard</h2>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Create Task */}
      <form className="task-form" onSubmit={createTask}>
        <input
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button>Add Task</button>
      </form>

      {/* Filters */}
      <div className="filters">
        <input
          placeholder="Search by title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Task List */}
      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task.id} className="task-item">
            <div>
              <strong>{task.title}</strong>
              <p>{task.description}</p>
              <span className={`status ${task.status}`}>
                {task.status}
              </span>
            </div>

            <div className="task-actions">
              <button onClick={() => toggleTask(task.id)}>Toggle</button>
              <button onClick={() => updateTask(task)}>Edit</button>
              <button className="danger" onClick={() => deleteTask(task.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Pagination */}
      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Prev
        </button>
        <span>Page {page}</span>
        <button onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
};

export default Dashboard;
