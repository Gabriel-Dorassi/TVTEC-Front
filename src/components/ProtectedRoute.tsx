import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

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
    // Verificação simplificada - confia no localStorage
    const auth = localStorage.getItem("auth") === "true";
    setIsAuthenticated(auth);
    setLoading(false);
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