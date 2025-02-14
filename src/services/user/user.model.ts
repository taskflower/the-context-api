// src/services/user/user.model.ts
interface User {
    uid: string;
    email: string;
    availableTokens: number;
    createdAt: Date;
    lastLoginAt: Date;
  }