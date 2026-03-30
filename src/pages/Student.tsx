import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const TASKS_URL = "https://functions.poehali.dev/35f202fc-fcaa-4c90-b16d-dfb62a9e2b9c";

interface Task {
  id: number;
  title: string;
  description: string;
  task_type: string;
  status: string;
  student_answer: string | null;
  teacher_comment: string | null;
  created_at: string;
  teacher_name: string;
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

export default function Student() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: number; full_name: string } | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { navigate("/login"); return; }
    const u = JSON.parse(stored);
    if (u.role !== "student") { navigate("/teacher"); return; }
    setUser(u);
    loadTasks(u.id);
  }, []);

  const loadTasks = async (studentId: number) => {
    const res = await fetch(`${TASKS_URL}?student_id=${studentId}`);
    const data = await res.json();
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    setTasks(parsed.tasks || []);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleSubmitAnswer = async () => {
    if (!selectedTask || !answer.trim()) return;
    setLoading(true);
    await fetch(TASKS_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: selectedTask.id, student_answer: answer, status: "done" }),
    });
    if (user) loadTasks(user.id);
    setSelectedTask(null);
    setAnswer("");
    setLoading(false);
  };

  const newCount = tasks.filter((t) => t.status === "new").length;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <div className="border-b border-neutral-800 px-6 py-4 flex justify-between items-center">
        <div>
          <span className="text-xs text-neutral-500 uppercase tracking-widest">Подготовка к ОГЭ · Русский язык</span>
          <h1 className="text-lg font-bold">{user?.full_name}</h1>
        </div>
        <button onClick={handleLogout} className="text-neutral-400 hover:text-white text-sm flex items-center gap-2 transition-colors">
          <Icon name="LogOut" size={16} />
          Выйти
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Новых", value: tasks.filter((t) => t.status === "new").length, icon: "Inbox" },
            { label: "Выполнено", value: tasks.filter((t) => t.status === "done").length, icon: "CheckCircle" },
            { label: "Всего", value: tasks.length, icon: "BookOpen" },
          ].map((s) => (
            <div key={s.label} className="bg-neutral-900 border border-neutral-800 p-4 text-center">
              <Icon name={s.icon} size={20} className="mx-auto mb-2 text-neutral-400" />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-neutral-500 text-xs uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-semibold mb-4">
          Мои задания
          {newCount > 0 && (
            <span className="ml-3 text-sm bg-blue-900/50 text-blue-300 border border-blue-800 px-2 py-0.5">
              {newCount} новых
            </span>
          )}
        </h2>

        {tasks.length === 0 ? (
          <div className="text-center py-20 text-neutral-500">
            <Icon name="Inbox" size={40} />
            <p className="mt-4">Заданий пока нет. Скоро учитель их добавит!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => { setSelectedTask(task); setAnswer(task.student_answer || ""); }}
                className="bg-neutral-900 border border-neutral-800 p-5 hover:border-neutral-600 transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 ${STATUS_COLORS[task.status]}`}>{STATUS_LABELS[task.status]}</span>
                      <span className="text-xs text-neutral-500 border border-neutral-700 px-2 py-0.5">{task.task_type}</span>
                    </div>
                    <h3 className="font-semibold text-white mb-1">{task.title}</h3>
                    <p className="text-neutral-400 text-sm line-clamp-2">{task.description}</p>
                    {task.teacher_comment && (
                      <div className="mt-3 p-3 bg-neutral-800 border-l-2 border-green-500">
                        <p className="text-xs text-neutral-400 mb-1 uppercase tracking-wide">Комментарий учителя</p>
                        <p className="text-sm text-neutral-200">{task.teacher_comment}</p>
                      </div>
                    )}
                  </div>
                  <Icon name="ChevronRight" size={18} className="text-neutral-600 flex-shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`text-xs px-2 py-0.5 ${STATUS_COLORS[selectedTask.status]} mb-2 inline-block`}>
                  {STATUS_LABELS[selectedTask.status]}
                </span>
                <h3 className="font-semibold text-white text-lg">{selectedTask.title}</h3>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-neutral-500 hover:text-white">
                <Icon name="X" size={20} />
              </button>
            </div>

            <div className="mb-4 p-4 bg-neutral-800">
              <p className="text-xs text-neutral-400 uppercase tracking-wide mb-2">Задание</p>
              <p className="text-neutral-200 text-sm leading-relaxed">{selectedTask.description}</p>
            </div>

            {selectedTask.teacher_comment && (
              <div className="mb-4 p-3 bg-neutral-800 border-l-2 border-green-500">
                <p className="text-xs text-neutral-400 mb-1 uppercase tracking-wide">Комментарий учителя</p>
                <p className="text-sm text-neutral-200">{selectedTask.teacher_comment}</p>
              </div>
            )}

            {selectedTask.status !== "done" && (
              <>
                <label className="block text-neutral-400 text-xs uppercase tracking-wide mb-2">Ваш ответ</label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 text-white px-4 py-3 focus:outline-none focus:border-white transition-colors text-sm h-32 resize-none mb-4"
                  placeholder="Напишите ваш ответ здесь..."
                />
                <button
                  onClick={handleSubmitAnswer}
                  disabled={loading || !answer.trim()}
                  className="w-full bg-white text-black py-3 uppercase text-sm tracking-wide font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-50"
                >
                  {loading ? "Отправляем..." : "Отправить ответ"}
                </button>
              </>
            )}

            {selectedTask.status === "done" && selectedTask.student_answer && (
              <div className="p-3 bg-neutral-800 border-l-2 border-blue-500">
                <p className="text-xs text-neutral-400 mb-1 uppercase tracking-wide">Ваш ответ</p>
                <p className="text-sm text-neutral-200">{selectedTask.student_answer}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
