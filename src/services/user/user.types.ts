// src/services/user/user.types.ts
export interface User {
    uid: string;
    email: string;
    availableTokens: number;
    createdAt: Date;
    lastLoginAt: Date;
  }