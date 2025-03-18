import { Request } from "express";

export interface CustomRequest extends Request {
  user: {
    sub: number;
    username: string;
    role: "ADMIN" | "USER";
    allowedSections: number[];
  }
}
