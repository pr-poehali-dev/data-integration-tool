import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const STUDENTS_URL = "https://functions.poehali.dev/7ec4323a-32eb-48af-96e1-d6282043cc20";
const TASKS_URL = "https://functions.poehali.dev/35f202fc-fcaa-4c90-b16d-dfb62a9e2b9c";

interface Student {
  id: number;
  username: string;
  full_name: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  task_type: string;
  status: string;
  student_answer: string | null;
  teacher_comment: string | null;
  created_at: string;
  student_name: string;
  student_id: number;
}

const STATUS_LABELS: Record<string, string> = {
  new: "Новое",
  in_progress: "Выполняется",
  done: "Готово",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-900/40 text-blue-300 border border-blue-800",
  in_progress: "bg-yellow-900/40 text-yellow-300 border border-yellow-800",
  done: "bg-green-900/40 text-green-300 border border-green-800",
};

const TASK_TYPES = ["Орфография", "Пунктуация", "Лексика", "Грамматика", "Сочинение", "Тест", "Другое"];

export default function Teacher() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: number; full_name: string } | null>(null);
  const [tab, setTab] = useState<"tasks" | "students" | "new_task" | "new_student">("tasks");
  const [students, setStudents] = useState<Student[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const [newTask, setNewTask] = useState({ student_id: "", title: "", description: "", task_type: "Орфография" });
  const [newStudent, setNewStudent] = useState({ username: "", password: "", full_name: "" });
  const [formMsg, setFormMsg] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { navigate("/login"); return; }
    const u = JSON.parse(stored);
    if (u.role !== "teacher") { navigate("/student"); return; }
    setUser(u);
    loadStudents();
    loadTasks(u.id);
  }, []);

  const loadStudents = async () => {
    const res = await fetch(STUDENTS_URL);
    const data = await res.json();
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    setStudents(parsed.students || []);
  };

  const loadTasks = async (teacherId: number) => {
    const res = await fetch(`${TASKS_URL}?teacher_id=${teacherId}`);
    const data = await res.json();
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    setTasks(parsed.tasks || []);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg("");
    setLoading(true);
    try {
      const res = await fetch(TASKS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTask, teacher_id: user?.id, student_id: Number(newTask.student_id) }),
      });
      if (res.ok) {
        setFormMsg("✓ Задание выдано!");
        setNewTask({ student_id: "", title: "", description: "", task_type: "Орфография" });
        if (user) loadTasks(user.id);
        setTimeout(() => { setTab("tasks"); setFormMsg(""); }, 1200);
      } else {
        const d = await res.json();
        const p = typeof d === "string" ? JSON.parse(d) : d;
        setFormMsg(p.error || "Ошибка");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg("");
    setLoading(true);
    try {
      const res = await fetch(STUDENTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent),
      });
      if (res.ok) {
        setFormMsg("✓ Ученик добавлен!");
        setNewStudent({ username: "", password: "", full_name: "" });
        loadStudents();
        setTimeout(() => { setTab("students"); setFormMsg(""); }, 1200);
      } else {
        const d = await res.json();
        const p = typeof d === "string" ? JSON.parse(d) : d;
        setFormMsg(p.error || "Ошибка");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveComment = async () => {
    if (!selectedTask) return;
    setLoading(true);
    await fetch(TASKS_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: selectedTask.id, teacher_comment: comment }),
    });
    if (user) loadTasks(user.id);
    setSelectedTask(null);
    setLoading(false);
  };

  const inputCls = "w-full bg-neutral-900 border border-neutral-700 text-white px-4 py-3 focus:outline-none focus:border-white transition-colors text-sm";
  const labelCls = "block text-neutral-400 text-xs uppercase tracking-wide mb-2";

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <div className="border-b border-neutral-800 px-6 py-4 flex justify-between items-center">
        <div>
          <span className="text-xs text-neutral-500 uppercase tracking-widest">Кабинет учителя</span>
          <h1 className="text-lg font-bold">{user?.full_name}</h1>
        </div>
        <button onClick={handleLogout} className="text-neutral-400 hover:text-white text-sm flex items-center gap-2 transition-colors">
          <Icon name="LogOut" size={16} />
          Выйти
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-800 px-6 flex gap-0">
        {[
          { key: "tasks", label: "Задания", icon: "BookOpen" },
          { key: "students", label: "Ученики", icon: "Users" },
          { key: "new_task", label: "Выдать задание", icon: "Plus" },
          { key: "new_student", label: "Добавить ученика", icon: "UserPlus" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key as typeof tab); setFormMsg(""); }}
            className={`flex items-center gap-2 px-5 py-4 text-sm uppercase tracking-wide transition-colors border-b-2 ${
              tab === t.key ? "border-white text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Icon name={t.icon} size={15} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* TASKS TAB */}
        {tab === "tasks" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Все задания ({tasks.length})</h2>
            </div>
            {tasks.length === 0 ? (
              <div className="text-center py-20 text-neutral-500">
                <Icon name="Inbox" size={40} />
                <p className="mt-4">Заданий пока нет. Выдайте первое!</p>
                <button onClick={() => setTab("new_task")} className="mt-4 text-white underline text-sm">Выдать задание →</button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {tasks.map((task) => (
                  <div key={task.id} className="bg-neutral-900 border border-neutral-800 p-5 hover:border-neutral-600 transition-colors">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 ${STATUS_COLORS[task.status]}`}>{STATUS_LABELS[task.status]}</span>
                          <span className="text-xs text-neutral-500 border border-neutral-700 px-2 py-0.5">{task.task_type}</span>
                        </div>
                        <h3 className="font-semibold text-white mb-1">{task.title}</h3>
                        <p className="text-neutral-400 text-sm mb-2 line-clamp-2">{task.description}</p>
                        <div className="flex items-center gap-2 text-neutral-500 text-xs">
                          <Icon name="User" size={12} />
                          <span>{task.student_name}</span>
                          <span>·</span>
                          <span>{new Date(task.created_at).toLocaleDateString("ru-RU")}</span>
                        </div>
                        {task.student_answer && (
                          <div className="mt-3 p-3 bg-neutral-800 border-l-2 border-blue-500">
                            <p className="text-xs text-neutral-400 mb-1 uppercase tracking-wide">Ответ ученика</p>
                            <p className="text-sm text-neutral-200">{task.student_answer}</p>
                          </div>
                        )}
                        {task.teacher_comment && (
                          <div className="mt-2 p-3 bg-neutral-800 border-l-2 border-green-500">
                            <p className="text-xs text-neutral-400 mb-1 uppercase tracking-wide">Ваш комментарий</p>
                            <p className="text-sm text-neutral-200">{task.teacher_comment}</p>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => { setSelectedTask(task); setComment(task.teacher_comment || ""); }}
                        className="text-neutral-400 hover:text-white transition-colors flex-shrink-0"
                      >
                        <Icon name="MessageSquare" size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STUDENTS TAB */}
        {tab === "students" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Ученики ({students.length})</h2>
              <button onClick={() => setTab("new_student")} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
                <Icon name="UserPlus" size={15} /> Добавить
              </button>
            </div>
            {students.length === 0 ? (
              <div className="text-center py-20 text-neutral-500">
                <Icon name="Users" size={40} />
                <p className="mt-4">Учеников пока нет.</p>
                <button onClick={() => setTab("new_student")} className="mt-4 text-white underline text-sm">Добавить первого →</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map((s) => (
                  <div key={s.id} className="bg-neutral-900 border border-neutral-800 p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-neutral-700 flex items-center justify-center text-white font-bold text-lg">
                        {s.full_name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{s.full_name}</p>
                        <p className="text-neutral-500 text-xs">@{s.username}</p>
                      </div>
                    </div>
                    <div className="text-xs text-neutral-500">
                      Заданий: {tasks.filter((t) => t.student_id === s.id).length}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NEW TASK TAB */}
        {tab === "new_task" && (
          <div className="max-w-xl">
            <h2 className="text-xl font-semibold mb-6">Выдать задание</h2>
            <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Ученик</label>
                <select
                  value={newTask.student_id}
                  onChange={(e) => setNewTask({ ...newTask, student_id: e.target.value })}
                  className={inputCls}
                  required
                >
                  <option value="">Выберите ученика</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Тип задания</label>
                <select
                  value={newTask.task_type}
                  onChange={(e) => setNewTask({ ...newTask, task_type: e.target.value })}
                  className={inputCls}
                >
                  {TASK_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Заголовок</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className={inputCls}
                  placeholder="Например: Правописание -Н- и -НН-"
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Задание</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className={`${inputCls} h-36 resize-none`}
                  placeholder="Опишите задание подробно..."
                  required
                />
              </div>
              {formMsg && <p className="text-green-400 text-sm">{formMsg}</p>}
              <button
                type="submit"
                disabled={loading || students.length === 0}
                className="bg-white text-black py-3 uppercase text-sm tracking-wide font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-50"
              >
                {loading ? "Выдаём..." : "Выдать задание"}
              </button>
              {students.length === 0 && (
                <p className="text-yellow-500 text-sm text-center">Сначала добавьте хотя бы одного ученика</p>
              )}
            </form>
          </div>
        )}

        {/* NEW STUDENT TAB */}
        {tab === "new_student" && (
          <div className="max-w-xl">
            <h2 className="text-xl font-semibold mb-6">Добавить ученика</h2>
            <form onSubmit={handleCreateStudent} className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Полное имя</label>
                <input
                  type="text"
                  value={newStudent.full_name}
                  onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
                  className={inputCls}
                  placeholder="Иванова Мария Сергеевна"
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Логин</label>
                <input
                  type="text"
                  value={newStudent.username}
                  onChange={(e) => setNewStudent({ ...newStudent, username: e.target.value })}
                  className={inputCls}
                  placeholder="ivanova_maria"
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Пароль</label>
                <input
                  type="text"
                  value={newStudent.password}
                  onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                  className={inputCls}
                  placeholder="Придумайте пароль"
                  required
                />
              </div>
              {formMsg && <p className="text-green-400 text-sm">{formMsg}</p>}
              <button
                type="submit"
                disabled={loading}
                className="bg-white text-black py-3 uppercase text-sm tracking-wide font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-50"
              >
                {loading ? "Добавляем..." : "Добавить ученика"}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Comment Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-white">{selectedTask.title}</h3>
              <button onClick={() => setSelectedTask(null)} className="text-neutral-500 hover:text-white">
                <Icon name="X" size={20} />
              </button>
            </div>
            {selectedTask.student_answer && (
              <div className="mb-4 p-3 bg-neutral-800 border-l-2 border-blue-500">
                <p className="text-xs text-neutral-400 mb-1 uppercase tracking-wide">Ответ ученика</p>
                <p className="text-sm text-neutral-200">{selectedTask.student_answer}</p>
              </div>
            )}
            <label className={labelCls}>Ваш комментарий</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className={`${inputCls} h-28 resize-none mb-4`}
              placeholder="Напишите комментарий к ответу..."
            />
            <div className="flex gap-3">
              <button
                onClick={handleSaveComment}
                disabled={loading}
                className="flex-1 bg-white text-black py-2.5 text-sm uppercase tracking-wide font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-50"
              >
                Сохранить
              </button>
              <button onClick={() => setSelectedTask(null)} className="px-4 py-2.5 border border-neutral-700 text-neutral-400 hover:text-white text-sm transition-colors">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
