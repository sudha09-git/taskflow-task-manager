import { useState, useEffect } from "react";
import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:5000/api" });

api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium", category: "work", dueDate: "" });
  const [authError, setAuthError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (user) loadTasks();
  }, [user]);

  const loadTasks = async () => {
    try {
      const res = await api.get("/tasks");
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuth = async () => {
    setAuthError("");
    try {
      const url = authMode === "login" ? "/auth/login" : "/auth/register";
      const res = await api.post(url, authForm);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);
    } catch (err) {
      setAuthError(err.response?.data?.message || "Something went wrong");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setTasks([]);
  };

  const openModal = (task = null) => {
    if (task) {
      setEditTask(task);
      setTaskForm({
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        category: task.category,
        dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
      });
    } else {
      setEditTask(null);
      setTaskForm({ title: "", description: "", priority: "medium", category: "work", dueDate: "" });
    }
    setShowModal(true);
  };

  const saveTask = async () => {
    if (!taskForm.title.trim()) return;
    try {
      if (editTask) {
        const res = await api.put(`/tasks/${editTask._id}`, taskForm);
        setTasks(prev => prev.map(t => t._id === editTask._id ? res.data : t));
      } else {
        const res = await api.post("/tasks", taskForm);
        setTasks(prev => [res.data, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDone = async (task) => {
    try {
      const res = await api.put(`/tasks/${task._id}`, { done: !task.done });
      setTasks(prev => prev.map(t => t._id === task._id ? res.data : t));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(t => t._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  const filteredTasks = tasks
    .filter(t => {
      if (view === "today") return t.dueDate?.split("T")[0] === today;
      if (view === "pending") return !t.done;
      if (view === "done") return t.done;
      if (["high","medium","low"].includes(view)) return t.priority === view;
      return true;
    })
    .filter(t => filter === "all" || t.category === filter)
    .filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.done).length,
    pending: tasks.filter(t => !t.done).length,
    overdue: tasks.filter(t => !t.done && t.dueDate?.split("T")[0] < today).length,
  };

  const s = {
    page: { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f5f5", fontFamily:"system-ui,sans-serif" },
    card: { background:"#fff", padding:"2rem", borderRadius:"12px", width:"360px", boxShadow:"0 2px 12px rgba(0,0,0,0.1)" },
    input: { width:"100%", padding:"8px 12px", marginBottom:"12px", borderRadius:"8px", border:"1px solid #ddd", boxSizing:"border-box", fontSize:"14px" },
    btnPrimary: { width:"100%", padding:"10px", background:"#000", color:"#fff", border:"none", borderRadius:"8px", cursor:"pointer", fontWeight:500, fontSize:"14px" },
    pill: (active) => ({ padding:"5px 12px", borderRadius:"99px", border:"1px solid #ddd", background: active ? "#000" : "none", color: active ? "#fff" : "#555", cursor:"pointer", fontSize:"13px" }),
    sideBtn: (active) => ({ display:"block", width:"100%", textAlign:"left", padding:"7px 10px", marginBottom:"4px", borderRadius:"8px", border:"none", background: active ? "#000" : "none", color: active ? "#fff" : "#555", cursor:"pointer", fontSize:"14px" }),
    taskCard: { background:"#fff", borderRadius:"10px", border:"1px solid #eee", padding:"1rem 1.25rem", marginBottom:"8px", display:"flex", alignItems:"flex-start", gap:"12px" },
    modalOverlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 },
    modal: { background:"#fff", borderRadius:"12px", width:"460px", maxWidth:"90vw" },
    modalInput: { padding:"8px 12px", borderRadius:"8px", border:"1px solid #ddd", fontSize:"14px", width:"100%", boxSizing:"border-box" },
  };

  if (!user) return (
    <div style={s.page}>
      <div style={s.card}>
        <h2 style={{ marginBottom:"0.25rem" }}>✅ TaskFlow</h2>
        <p style={{ color:"#888", marginBottom:"1.5rem", fontSize:"14px" }}>Manage your work, beautifully.</p>
        <div style={{ display:"flex", gap:"8px", marginBottom:"1.5rem" }}>
          {["login","register"].map(m => (
            <button key={m} onClick={() => setAuthMode(m)} style={{ flex:1, padding:"8px", borderRadius:"8px", border:"none", background: authMode===m ? "#000" : "#eee", color: authMode===m ? "#fff" : "#333", cursor:"pointer", fontWeight:500 }}>
              {m === "login" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>
        {authMode === "register" && (
          <input placeholder="Your name" value={authForm.name}
            onChange={e => setAuthForm({...authForm, name: e.target.value})} style={s.input} />
        )}
        <input placeholder="Email" value={authForm.email}
          onChange={e => setAuthForm({...authForm, email: e.target.value})} style={s.input} />
        <input placeholder="Password" type="password" value={authForm.password}
          onChange={e => setAuthForm({...authForm, password: e.target.value})} style={s.input} />
        {authError && <p style={{ color:"red", fontSize:"13px", marginBottom:"8px" }}>{authError}</p>}
        <button onClick={handleAuth} style={s.btnPrimary}>
          {authMode === "login" ? "Sign in" : "Create account"}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", background:"#f5f5f5", fontFamily:"system-ui,sans-serif" }}>

      <div style={{ background:"#fff", borderBottom:"1px solid #eee", padding:"0 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", height:"56px" }}>
        <strong>✅ TaskFlow</strong>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding:"6px 12px", borderRadius:"8px", border:"1px solid #ddd", fontSize:"13px" }} />
          <span style={{ fontSize:"14px", color:"#555" }}>Hi, {user.name}</span>
          <button onClick={handleLogout} style={{ padding:"6px 12px", borderRadius:"8px", border:"1px solid #ddd", background:"none", cursor:"pointer", fontSize:"13px" }}>Sign out</button>
        </div>
      </div>

      <div style={{ display:"flex", flex:1 }}>
        <div style={{ width:"200px", background:"#fff", borderRight:"1px solid #eee", padding:"1rem" }}>
          {[["all","All tasks"],["today","Today"],["pending","Pending"],["done","Completed"],["high","High priority"],["medium","Medium"],["low","Low priority"]].map(([v,label]) => (
            <button key={v} onClick={() => setView(v)} style={s.sideBtn(view===v)}>{label}</button>
          ))}
        </div>

        <div style={{ flex:1, padding:"1.5rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem" }}>
            <h2 style={{ fontSize:"18px", fontWeight:500, margin:0 }}>
              { {all:"All tasks",today:"Today",pending:"Pending",done:"Completed",high:"High priority",medium:"Medium priority",low:"Low priority"}[view] }
            </h2>
            <button onClick={() => openModal()} style={{ background:"#000", color:"#fff", border:"none", borderRadius:"8px", padding:"8px 14px", cursor:"pointer", fontSize:"13px", fontWeight:500 }}>
              + Add task
            </button>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px", marginBottom:"1.5rem" }}>
            {[["Total",stats.total,"#000"],["Completed",stats.done,"#000"],["Pending",stats.pending,"#000"],["Overdue",stats.overdue, stats.overdue > 0 ? "red" : "#000"]].map(([label,val,color]) => (
              <div key={label} style={{ background:"#fff", borderRadius:"10px", padding:"1rem" }}>
                <div style={{ fontSize:"12px", color:"#888", marginBottom:"6px" }}>{label}</div>
                <div style={{ fontSize:"24px", fontWeight:500, color }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ display:"flex", gap:"8px", marginBottom:"1.25rem", flexWrap:"wrap" }}>
            {["all","work","personal","learning","health"].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={s.pill(filter===f)}>{f}</button>
            ))}
          </div>

          {filteredTasks.length === 0 ? (
            <div style={{ textAlign:"center", padding:"3rem", color:"#aaa" }}>No tasks here. Add one!</div>
          ) : filteredTasks.map(task => {
            const overdue = task.dueDate && task.dueDate.split("T")[0] < today && !task.done;
            const pColor = { high:["#FCEBEB","#A32D2D"], medium:["#FAEEDA","#854F0B"], low:["#EAF3DE","#3B6D11"] }[task.priority];
            return (
              <div key={task._id} style={{ ...s.taskCard, opacity: task.done ? 0.6 : 1 }}>
                <div onClick={() => toggleDone(task)} style={{ width:"18px", height:"18px", borderRadius:"4px", border:"1.5px solid #ccc", background: task.done ? "#000" : "none", cursor:"pointer", flexShrink:0, marginTop:"2px", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {task.done && <span style={{ color:"#fff", fontSize:"11px" }}>✓</span>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:500, fontSize:"14px", textDecoration: task.done ? "line-through" : "none" }}>{task.title}</div>
                  {task.description && <div style={{ fontSize:"13px", color:"#888", margin:"4px 0" }}>{task.description}</div>}
                  <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginTop:"4px" }}>
                    <span style={{ fontSize:"11px", padding:"2px 8px", borderRadius:"99px", background:pColor[0], color:pColor[1], fontWeight:500 }}>{task.priority}</span>
                    <span style={{ fontSize:"11px", padding:"2px 8px", borderRadius:"99px", background:"#f0f0f0", color:"#666" }}>{task.category}</span>
                    {task.dueDate && <span style={{ fontSize:"12px", color: overdue ? "red" : "#aaa" }}>📅 {task.dueDate.split("T")[0]}{overdue ? " · Overdue":""}</span>}
                  </div>
                </div>
                <div style={{ display:"flex", gap:"4px" }}>
                  <button onClick={() => openModal(task)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"15px" }}>✏️</button>
                  <button onClick={() => deleteTask(task._id)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"15px" }}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <div onClick={e => e.target === e.currentTarget && setShowModal(false)} style={s.modalOverlay}>
          <div style={s.modal}>
            <div style={{ padding:"1.25rem 1.5rem", borderBottom:"1px solid #eee", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <strong>{editTask ? "Edit task" : "New task"}</strong>
              <button onClick={() => setShowModal(false)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"20px", lineHeight:1 }}>×</button>
            </div>
            <div style={{ padding:"1.5rem", display:"flex", flexDirection:"column", gap:"12px" }}>
              <input placeholder="Task title *" value={taskForm.title}
                onChange={e => setTaskForm({...taskForm, title: e.target.value})} style={s.modalInput} />
              <textarea placeholder="Description" value={taskForm.description}
                onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                style={{ ...s.modalInput, minHeight:"72px", resize:"vertical" }} />
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                <select value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})} style={s.modalInput}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select value={taskForm.category} onChange={e => setTaskForm({...taskForm, category: e.target.value})} style={s.modalInput}>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="learning">Learning</option>
                  <option value="health">Health</option>
                </select>
              </div>
              <input type="date" value={taskForm.dueDate}
                onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} style={s.modalInput} />
            </div>
            <div style={{ padding:"1rem 1.5rem", borderTop:"1px solid #eee", display:"flex", gap:"8px", justifyContent:"flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{ padding:"8px 16px", borderRadius:"8px", border:"1px solid #ddd", background:"none", cursor:"pointer" }}>Cancel</button>
              <button onClick={saveTask} style={{ padding:"8px 16px", borderRadius:"8px", background:"#000", color:"#fff", border:"none", cursor:"pointer", fontWeight:500 }}>Save task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}