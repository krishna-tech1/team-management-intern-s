export interface LoginDto {
  email: string;
  password: string;
}

export interface JwtPayload {
  id: number;
  email: string;
  role: string;
}