// backend/services/identity/src/types/express.d.ts
declare namespace Express {
  export interface Request {
    user?: {
      userId: string;
      email: string;
      role: string;
    };
  }
}
