export interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
  accessToken: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (response: any) => Promise<void>;
  logout: () => void;
}