import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { useState, useEffect } from "react";

// Páginas
import Home from "./pages/Home";
import Confirmacao from "./pages/Confirmacao";
import Login from "./pages/Login";
import CadastroCurso from "./pages/CadastroCurso";
import CursosDisponiveis from "./pages/CursosDisponiveis";
import CursoDetalhes from "./pages/CursoDetalhes";
import InscricoesDetalhadas from "./pages/InscricoesDetalhadas";
import PaginaGerenciamento from "./pages/PaginaGerenciamento";
import TestAuthComponent from "./pages/TestAuthComponent"

// Componentes
import Menu from "./components/Menu";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  // Estado para controlar a autenticação em toda a aplicação
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem("auth") === "true");

  // Observar mudanças no localStorage
  useEffect(() => {
    const checkAuth = () => {
      const auth = localStorage.getItem("auth") === "true";
      setIsAuthenticated(auth);
    };

    // Verificar autenticação inicial
    checkAuth();

    // Adicionar um ouvinte para o evento de storage para detectar mudanças
    window.addEventListener("storage", checkAuth);

    // Limpar o ouvinte quando o componente for desmontado
    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  return (
    <Router>
      <Menu />

      <ToastContainer position="top-center" autoClose={3000} />
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/confirmacao" element={<Confirmacao />} />
        <Route path="/cursos-disponiveis" element={<CursosDisponiveis />} />
        <Route path="/cursos/:id" element={<CursoDetalhes />} />
        <Route path="/test-auth" element={<TestAuthComponent />} />
        
        {/* Rotas protegidas que requerem autenticação */}
        <Route
          path="/cadastrar-curso"
          element={
            isAuthenticated ? <CadastroCurso /> : <Navigate to="/login" replace />
          }
        />
        
        <Route
          path="/inscricoes"
          element={
            isAuthenticated ? <InscricoesDetalhadas /> : <Navigate to="/login" replace />
          }
        />
        
        <Route
          path="/admin"
          element={
            isAuthenticated ? <PaginaGerenciamento /> : <Navigate to="/login" replace />
          }
        />
        
        {/* Rota de fallback - redireciona para a página inicial */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Container de notificações global */}
      <ToastContainer position="top-center" autoClose={3000} />
    </Router>
  );
}

export default App;