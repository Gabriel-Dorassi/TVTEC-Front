const API_URL = "https://cursos-tv.onrender.com";

// Interface para resposta de login
interface LoginResponse {
  token: string;
  username: string;
  role: string;
}

// Classe de serviço de autenticação
class AuthService {
  /**
   * Realiza o login de um usuário
   * @param username Nome de usuário
   * @param password Senha
   * @returns Promessa com os dados de resposta do login
   */
  static async login(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erro ao fazer login");
    }

    const data = await response.json();
    
    // Armazenar dados no localStorage
    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);
    localStorage.setItem("role", data.role);
    localStorage.setItem("auth", "true");
    
    return data;
  }

  /**
   * Realiza o logout do usuário atual
   */
  static logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("auth");
  }

  /**
   * Verifica se o usuário está autenticado
   * @returns True se autenticado, false caso contrário
   */
  static isAuthenticated(): boolean {
    return localStorage.getItem("auth") === "true" && !!localStorage.getItem("token");
  }

  /**
   * Obtém o token de autenticação
   * @returns O token JWT ou null se não estiver autenticado
   */
  static getToken(): string | null {
    return localStorage.getItem("token");
  }

  /**
   * Obtém o nome de usuário atual
   * @returns O nome de usuário ou null se não estiver autenticado
   */
  static getUsername(): string | null {
    return localStorage.getItem("username");
  }

  /**
   * Obtém o papel do usuário atual (admin, etc)
   * @returns O papel do usuário ou null se não estiver autenticado
   */
  static getRole(): string | null {
    return localStorage.getItem("role");
  }

  /**
   * Verifica se o usuário é um administrador
   * @returns True se o usuário for admin, false caso contrário
   */
  static isAdmin(): boolean {
    return this.getRole() === "admin";
  }

  /**
   * Adiciona o token de autenticação a um objeto de opções fetch
   * @param options Opções do fetch (opcional)
   * @returns Opções com o token adicionado
   */
  static addAuthHeader(options: RequestInit = {}): RequestInit {
    const token = this.getToken();
    
    if (!token) {
      return options;
    }
    
    return {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`
      }
    };
  }

  /**
   * Valida o token atual com o backend
   * @returns Promessa que resolve para true se válido, false caso contrário
   */
  static async validateToken(): Promise<boolean> {
    const token = this.getToken();
    
    if (!token) {
      return false;
    }
    
    try {
      const response = await fetch(`${API_URL}/auth/validate`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error("Erro ao validar token:", error);
      return false;
    }
  }
}

export default AuthService;
