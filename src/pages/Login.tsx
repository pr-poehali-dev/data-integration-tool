import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AUTH_URL = "https://functions.poehali.dev/079aa815-7299-49d5-86e7-565481bac788";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка входа");
        return;
      }
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      localStorage.setItem("user", JSON.stringify(parsed));
      if (parsed.role === "teacher") {
        navigate("/teacher");
      } else {
        navigate("/student");
      }
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <p className="text-neutral-400 text-xs uppercase tracking-widest mb-2">Подготовка к ОГЭ · 9 класс</p>
          <h1 className="text-white text-4xl font-bold tracking-tight">Войти</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-neutral-400 text-xs uppercase tracking-wide mb-2">Логин</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 text-white px-4 py-3 focus:outline-none focus:border-white transition-colors"
              placeholder="Введите логин"
              required
            />
          </div>
          <div>
            <label className="block text-neutral-400 text-xs uppercase tracking-wide mb-2">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 text-white px-4 py-3 focus:outline-none focus:border-white transition-colors"
              placeholder="Введите пароль"
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-white text-black py-3 uppercase text-sm tracking-wide font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            {loading ? "Входим..." : "Войти"}
          </button>
        </form>

        <p className="text-center mt-6">
          <a href="/" className="text-neutral-500 text-sm hover:text-neutral-300 transition-colors">
            ← На главную
          </a>
        </p>
      </div>
    </div>
  );
}
