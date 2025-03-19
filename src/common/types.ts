
export interface UserInterface {
  sub: number;
  username: string;
  role: "ADMIN" | "USER" | "SECURITY";
  privileges?: number[];
}



