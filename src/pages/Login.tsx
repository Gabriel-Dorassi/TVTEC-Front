import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

// URL da API
const API_URL = "https://cursos-tv.onrender.com";

export default function Login() {
  const [username, setUsername] = useState("admin"); // Nome de usuário padrão
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    try {
      setLoading(true);

      // Primeiro verificamos se estamos usando a senha local (para compatibilidade)
      if (senha === "tvtec123") {
        // Login com senha local (manter compatibilidade com versão anterior)
        localStorage.setItem("auth", "true");
        localStorage.setItem("username", "admin");
        localStorage.setItem("role", "admin");
        
        toast.success("Login realizado com sucesso!");
        setTimeout(() => {
          navigate("/admin");
        }, 1000);
        return;
      }

      // Tenta fazer login usando a API
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: username,
          password: senha
        })
      });

      if (!response.ok) {
        // Verifica se o servidor está disponível
        if (response.status >= 500) {
          throw new Error("Servidor indisponível. Tente novamente mais tarde.");
        }

        // Caso o servidor responda, mas com erro de credenciais
        throw new Error("Credenciais inválidas. Tente novamente.");
      }

      // Resposta bem-sucedida - parse do JSON
      const data = await response.json();

      // Armazena os dados de autenticação
      localStorage.setItem("auth", "true");
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      localStorage.setItem("role", data.role);

      // Mostra mensagem de sucesso
      toast.success("Login realizado com sucesso!");
      
      // Espera a notificação mostrar antes de redirecionar
      setTimeout(() => {
        navigate("/admin");
      }, 1000);
      
    } catch (error) {
      // Mostra erro
      console.error("Erro no login:", error);
      setErro(error instanceof Error ? error.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Login Administrativo</h1>
          <p className="text-gray-600 mt-2">Acesse o painel de gerenciamento</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome de Usuário
            </label>
            <input 
              type="text" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input 
              type="password" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" 
              value={senha} 
              onChange={(e) => setSenha(e.target.value)}
              disabled={loading}
              required 
            />
          </div>
          
          {erro && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{erro}</p>
            </div>
          )}
          
          <button 
            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition ${
              loading 
                ? "bg-blue-400 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            }`}
            type="submit"
            disabled={loading}
          >
            {loading ? "Autenticando..." : "Entrar"}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Área restrita de administração. Usuários normais não precisam de login.
          </p>
        </div>
      </div>
      
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}