
export interface UserInterface {
  sub: number;
  username: string;
  role: "ADMIN" | "USER";
  privileges?: number[];
}



