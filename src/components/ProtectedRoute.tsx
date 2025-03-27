import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

// URL da API
const API_URL = "https://cursos-tv.onrender.com";

type ProtectedRouteProps = {
  redirectPath?: string;
  children?: React.ReactNode;
};

export default function ProtectedRoute({ 
  redirectPath = "/login", 
  children 
}: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("token");
      
      // Se não há token, não está autenticado
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      try {
        // Validar o token com o backend
        const response = await fetch(`${API_URL}/auth/validate`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          // Se o token não é válido, limpar o armazenamento
          localStorage.removeItem("token");
          localStorage.removeItem("username");
          localStorage.removeItem("role");
          localStorage.removeItem("auth");
          
          setIsAuthenticated(false);
          toast.error("Sua sessão expirou. Por favor, faça login novamente.");
        }
      } catch (error) {
        console.error("Erro ao validar token:", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    validateToken();
  }, []);

  // Mostra um spinner enquanto verifica a autenticação
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  // Se não estiver autenticado, redireciona
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  // Se estiver autenticado, renderiza o conteúdo protegido
  return children ? <>{children}</> : <Outlet />;
}
