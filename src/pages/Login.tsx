import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

// URL da API
const API_URL = "https://cursos-tv.onrender.com";

// Função para obter um token válido diretamente da API
async function obterToken() {
  try {
    // Credenciais para a API
    const credenciais = {
      username: "admin",
      password: "tvtec123"
    };
    
    // Fazer a requisição para o endpoint de login
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(credenciais)
    });
    
    if (!response.ok) {
      throw new Error(`Erro no login: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Retornar o token da resposta
    return data.token;
  } catch (error) {
    console.error("Falha ao obter token:", error);
    throw error;
  }
}

export default function Login() {
  const [username, setUsername] = useState("admin"); // Nome de usuário padrão
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Verificar se já está autenticado ao montar o componente
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("auth") === "true";
    if (isAuthenticated) {
      // Se já estiver autenticado, redirecionar para admin
      navigate("/admin");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    try {
      setLoading(true);
      console.log("Tentando login com:", { username, senha });

      // Verificação da senha local primeiro (para compatibilidade)
      if (senha === "tvtec123") {
        try {
          // Obter um token válido da API, mesmo para o login "local"
          const token = await obterToken();
          
          // Login com senha local + token da API
          localStorage.setItem("auth", "true");
          localStorage.setItem("token", token);
          localStorage.setItem("username", "admin");
          localStorage.setItem("role", "admin");
          
          console.log("Login local bem-sucedido, dados salvos:", {
            auth: localStorage.getItem("auth"),
            token: token ? `${token.substring(0, 15)}...` : "Não obtido",
            username: localStorage.getItem("username"),
            role: localStorage.getItem("role"),
          });
          
          toast.success("Login realizado com sucesso!");
          
          // Forçar um refresh da página
          window.location.href = "/admin";
          return;
        } catch (error) {
          console.error("Erro ao obter token durante login local:", error);
          // Se falhar na obtenção do token, continua com o fluxo normal da API
        }
      }

      // Se a senha local não funcionar ou falhar na obtenção do token, tenta a API
      console.log("Tentando login via API");
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
        console.error("Erro de resposta da API:", response.status, response.statusText);
        throw new Error("Credenciais inválidas");
      }

      // Resposta bem-sucedida - parse do JSON
      const data = await response.json();
      console.log("Resposta de login da API:", data);

      // Armazena os dados de autenticação
      localStorage.setItem("auth", "true");
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      localStorage.setItem("role", data.role);

      console.log("Dados de autenticação salvos:", {
        auth: localStorage.getItem("auth"),
        token: localStorage.getItem("token")?.substring(0, 20) + "...",
        username: localStorage.getItem("username"),
        role: localStorage.getItem("role"),
      });

      // Mostra mensagem de sucesso
      toast.success("Login realizado com sucesso!");
      
      // Forçar um refresh da página para garantir que o estado global seja atualizado
      window.location.href = "/admin";
      
    } catch (error) {
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