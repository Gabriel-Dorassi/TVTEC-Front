import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

export default function Menu() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem("auth") === "true");
  const [username, setUsername] = useState(localStorage.getItem("username") || "Administrador");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const auth = localStorage.getItem("auth") === "true";
      setIsAuthenticated(auth);
      setUsername(localStorage.getItem("username") || "Administrador");
    };

    checkAuth();

    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth");
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    
    setIsAuthenticated(false);
    setIsMobileMenuOpen(false);
    
    toast.success("Logout realizado com sucesso!");
    navigate("/");
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const activeLinkClass = "text-white bg-blue-700 px-3 py-2 rounded";
  const inactiveLinkClass = "text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded transition duration-150";

  return (
    <nav className="bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <img 
                src="/tvtec-logo.png" 
                alt="TVTEC Logo" 
                className="h-10 w-auto mr-2" 
              />
              <Link to="/" className="text-white font-bold text-xl">
                TVTEC Cursos
              </Link>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-4">
                <Link 
                  to="/" 
                  className={isActive("/") ? activeLinkClass : inactiveLinkClass}
                >
                  Início
                </Link>
                
                <Link 
                  to="/cursos-disponiveis" 
                  className={isActive("/cursos-disponiveis") ? activeLinkClass : inactiveLinkClass}
                >
                  Cursos
                </Link>
                
                {isAuthenticated && (
                  <>
                    <Link 
                      to="/cadastrar-curso" 
                      className={isActive("/cadastrar-curso") ? activeLinkClass : inactiveLinkClass}
                    >
                      Cadastrar Curso
                    </Link>
                    <Link 
                      to="/inscricoes" 
                      className={isActive("/inscricoes") ? activeLinkClass : inactiveLinkClass}
                    >
                      Inscrições
                    </Link>
                    <Link 
                      to="/admin" 
                      className={isActive("/admin") ? activeLinkClass : inactiveLinkClass}
                    >
                      Painel Admin
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div className="text-gray-300 flex items-center">
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-2">
                      {username.charAt(0).toUpperCase()}
                    </div>
                    <span>{username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition duration-150"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-150"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
          
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              <span className="sr-only">Abrir menu principal</span>
              <svg
                className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link
            to="/"
            className={`block ${isActive("/") ? activeLinkClass : inactiveLinkClass}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Início
          </Link>
          
          <Link
            to="/cursos-disponiveis"
            className={`block ${isActive("/cursos-disponiveis") ? activeLinkClass : inactiveLinkClass}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Cursos
          </Link>
          
          {isAuthenticated && (
            <>
              <Link
                to="/cadastrar-curso"
                className={`block ${isActive("/cadastrar-curso") ? activeLinkClass : inactiveLinkClass}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Cadastrar Curso
              </Link>
              <Link
                to="/inscricoes"
                className={`block ${isActive("/inscricoes") ? activeLinkClass : inactiveLinkClass}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Inscrições
              </Link>
              <Link
                to="/admin"
                className={`block ${isActive("/admin") ? activeLinkClass : inactiveLinkClass}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Painel Admin
              </Link>
            </>
          )}
        </div>
        
        <div className="pt-4 pb-3 border-t border-gray-700">
          {isAuthenticated ? (
            <div className="px-2 space-y-3">
              <div className="flex items-center px-3">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-2">
                  {username.charAt(0).toUpperCase()}
                </div>
                <div className="text-gray-300">{username}</div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition"
              >
                Sair
              </button>
            </div>
          ) : (
            <div className="px-2">
              <Link
                to="/login"
                className="block w-full text-center bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
