const API_URL = "https://cursos-tv.onrender.com";

// Interface para resposta de login
interface LoginResponse {
  token: string;
  username: string;
  role: string;
}

// Interface para decodificar token JWT
interface DecodedToken {
  header: any;
  payload: any;
  signature: string;
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
    try {
      const response: Response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage: string;
        try {
          // Tenta fazer o parse do erro como JSON
          const errorJson = JSON.parse(errorData);
          errorMessage = errorJson.error || errorJson.message || `Erro ao fazer login: ${response.status}`;
        } catch {
          // Se não for JSON, usa o texto original
          errorMessage = `Erro ao fazer login: ${response.status} - ${errorData || response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data: { token: string; username?: string; role?: string } = await response.json();
      
      // Verificar se o token realmente existe na resposta
      if (!data.token) {
        throw new Error("Token não encontrado na resposta do servidor");
      }

      // Decodificar token para extrair username e role caso não venham na resposta
      const decodedToken = this.decodeToken(data.token);
      
      // Usar os dados do token se não foram fornecidos na resposta
      const usernameFromResponse: string = data.username || (decodedToken?.payload?.username || '');
      const roleFromResponse: string = data.role || (decodedToken?.payload?.role || '');

      // Armazenar dados no localStorage
      localStorage.setItem("token", data.token);
      
      if (usernameFromResponse) {
        localStorage.setItem("username", usernameFromResponse);
      }
      
      if (roleFromResponse) {
        localStorage.setItem("role", roleFromResponse);
      }
      
      localStorage.setItem("auth", "true");
      
      return {
        token: data.token,
        username: usernameFromResponse,
        role: roleFromResponse
      };
    } catch (error) {
      console.error("Erro durante login:", error);
      throw error;
    }
  }

  /**
   * Decodifica um token JWT sem verificar a assinatura
   * @param token O token JWT
   * @returns Objeto com partes decodificadas do token ou null se inválido
   */
  static decodeToken(token: string): DecodedToken | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const header = JSON.parse(this.base64UrlDecode(parts[0]));
      const payload = JSON.parse(this.base64UrlDecode(parts[1]));
      const signature = parts[2];

      return { header, payload, signature };
    } catch (error) {
      console.error('Erro ao decodificar o token:', error);
      return null;
    }
  }

  /**
   * Decodifica uma string Base64URL para texto
   * @param str String em Base64URL
   * @returns String decodificada
   */
  private static base64UrlDecode(str: string): string {
    // Converte Base64URL para Base64 adicionando padding
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    
    // Decodifica
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  }

  /**
   * Verifica se o token atual está expirado
   * @returns True se expirado, false caso contrário
   */
  static isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.payload.exp) return true;
      
      // Exp é em segundos desde 1970, Date.now() é em milissegundos
      const expirationTime = decoded.payload.exp * 1000;
      return Date.now() >= expirationTime;
    } catch (error) {
      console.error("Erro ao verificar expiração do token:", error);
      return true;
    }
  }

  /**
   * Realiza o logout do usuário atual
   */
  static logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("auth");
    
    // Opcionalmente redirecionar para a página de login ou home
    // window.location.href = '/login';
  }

  /**
   * Verifica se o usuário está autenticado
   * @returns True se autenticado, false caso contrário
   */
  static isAuthenticated(): boolean {
    // Verifica se o token existe e não está expirado
    return localStorage.getItem("auth") === "true" && 
           !!localStorage.getItem("token") && 
           !this.isTokenExpired();
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
    // Tenta obter do localStorage
    const username = localStorage.getItem("username");
    if (username) return username;
    
    // Se não encontrar, tenta extrair do token
    const token = this.getToken();
    if (token) {
      const decoded = this.decodeToken(token);
      return decoded?.payload?.username || null;
    }
    
    return null;
  }

  /**
   * Obtém o papel do usuário atual (admin, etc)
   * @returns O papel do usuário ou null se não estiver autenticado
   */
  static getRole(): string | null {
    // Tenta obter do localStorage
    const role = localStorage.getItem("role");
    if (role) return role;
    
    // Se não encontrar, tenta extrair do token
    const token = this.getToken();
    if (token) {
      const decoded = this.decodeToken(token);
      return decoded?.payload?.role || null;
    }
    
    return null;
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
    
    // Se options.headers já é um Headers object
    if (options.headers instanceof Headers) {
      const headers = options.headers;
      headers.set('Authorization', `Bearer ${token}`);
      return { ...options, headers };
    }
    
    // Se options.headers é um objeto plano
    if (options.headers && typeof options.headers === 'object') {
      return {
        ...options,
        headers: {
          ...options.headers as Record<string, string>,
          Authorization: `Bearer ${token}`
        }
      };
    }
    
    // Se options.headers não existe
    return {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  }

  /**
   * Método utilitário para fazer solicitações autenticadas
   * @param url URL para a solicitação
   * @param options Opções do fetch
   * @returns Resposta da solicitação
   */
  static async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    // Adiciona o cabeçalho de autenticação às opções
    const authOptions = this.addAuthHeader(options);
    
    // Faz a solicitação
    const response: Response = await fetch(url, authOptions);
    
    // Verifica se a resposta indica que o token expirou (401 Unauthorized)
    if (response.status === 401) {
      // Opcionalmente, poderia tentar renovar o token aqui
      // ou simplesmente fazer logout
      console.warn('Token inválido ou expirado durante solicitação');
      // this.logout();
    }
    
    return response;
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
    
    // Verifica localmente primeiro se o token está expirado
    if (this.isTokenExpired()) {
      console.warn("Token expirado localmente");
      return false;
    }
    
    try {
      const response: Response = await fetch(`${API_URL}/auth/validate`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.warn(`Validação de token falhou: ${response.status} ${response.statusText}`);
      }
      
      return response.ok;
    } catch (error) {
      console.error("Erro ao validar token:", error);
      return false;
    }
  }
}

export default AuthService;