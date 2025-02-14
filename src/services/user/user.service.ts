// src/services/user/user.service.ts
import * as admin from 'firebase-admin';
import { db } from '../../config/firebase';
import { User } from './user.types';

export class UserService {
  private readonly INITIAL_TOKEN_COUNT = 100;
  private readonly usersCollection = db.collection('users');

  async addOrUpdateUser(decodedToken: admin.auth.DecodedIdToken): Promise<void> {
    const { uid, email } = decodedToken;
    const userRef = this.usersCollection.doc(uid);
    
    const user = await userRef.get();
    
    if (!user.exists) {
      await userRef.set({
        uid,
        email,
        availableTokens: this.INITIAL_TOKEN_COUNT,
        createdAt: new Date(),
        lastLoginAt: new Date()
      });
    } else {
      await userRef.update({
        lastLoginAt: new Date()
      });
    }
  }

  async checkAvailableTokens(uid: string): Promise<number> {
    const user = await this.usersCollection.doc(uid).get();
    if (!user.exists) {
      throw new Error('User not found');
    }
    return (user.data() as User).availableTokens;
  }

  async registerTokenUsage(uid: string, usedTokens: number): Promise<boolean> {
    const userRef = this.usersCollection.doc(uid);
    
    try {
      const result = await db.runTransaction(async (transaction) => {
        const user = await transaction.get(userRef);
        
        if (!user.exists) {
          throw new Error('User not found');
        }

        const userData = user.data() as User;
        
        if (userData.availableTokens < usedTokens) {
          return false; // Insufficient tokens
        }

        transaction.update(userRef, {
          availableTokens: userData.availableTokens - usedTokens
        });

        return true;
      });

      return result;
    } catch (error) {
      console.error('Error while using tokens:', error);
      return false;
    }
  }
}