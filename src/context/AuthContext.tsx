import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import client, { TOKEN_KEY } from "../api/client";

interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>({
    id: 1,
    email: "demo@example.com",
    full_name: "Demo User",
    is_active: true,
    created_at: new Date().toISOString()
  });
  const [token, setToken] = useState<string | null>(
    localStorage.getItem(TOKEN_KEY) || "mock_demo_token"
  );
  const [isLoading] = useState(false);


  // Validate existing token on mount
  useEffect(() => {
    // Disabled backend token validation for offline mode
    // if (!token) {
    //   setIsLoading(false);
    //   return;
    // }
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await client.post("/auth/login", { email, password });
      const { access_token } = res.data;
      localStorage.setItem(TOKEN_KEY, access_token);
      setToken(access_token);

      const userRes = await client.get("/auth/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      setUser(userRes.data);
    } catch (err) {
      console.warn("Backend login failed, using mock auth");
      // Mock login fallback
      const mockToken = "mock_token_" + Date.now();
      localStorage.setItem(TOKEN_KEY, mockToken);
      setToken(mockToken);
      setUser({
        id: 1,
        email,
        full_name: "Mock User",
        is_active: true,
        created_at: new Date().toISOString()
      });
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, fullName: string) => {
      try {
        const res = await client.post("/auth/register", {
          email,
          password,
          full_name: fullName,
        });
        const { access_token } = res.data;
        localStorage.setItem(TOKEN_KEY, access_token);
        setToken(access_token);

        const userRes = await client.get("/auth/me", {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        setUser(userRes.data);
      } catch (err) {
        console.warn("Backend register failed, using mock auth");
        // Mock register fallback
        const mockToken = "mock_token_" + Date.now();
        localStorage.setItem(TOKEN_KEY, mockToken);
        setToken(mockToken);
        setUser({
          id: 1,
          email,
          full_name: fullName,
          is_active: true,
          created_at: new Date().toISOString()
        });
      }
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
