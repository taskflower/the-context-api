import * as admin from 'firebase-admin';
import { db } from '../../config/firebase';
import { User } from './user.types';

export class UserService {
  // Set initial tokens: 0.5 credits = 5000 tokens (1 cent per 1000 tokens)
  private readonly INITIAL_TOKEN_COUNT = 5000;
  private readonly usersCollection = db.collection('users');

  async addOrUpdateUser(decodedToken: admin.auth.DecodedIdToken): Promise<void> {
    try {
      const { uid, email } = decodedToken;
      
      if (!uid) {
        throw new Error('Invalid decoded token: missing uid');
      }
      
      const userRef = this.usersCollection.doc(uid);
      const user = await userRef.get();
      
      if (!user.exists) {
        // Create new user with retry logic
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            await userRef.set({
              uid,
              email: email || '',
              availableTokens: this.INITIAL_TOKEN_COUNT,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`User ${uid} created successfully`);
            break; // Success, exit loop
          } catch (err) {
            retryCount++;
            if (retryCount >= maxRetries) {
              throw err; // Rethrow if max retries reached
            }
            // Exponential backoff: 100ms, 200ms, 400ms
            await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retryCount - 1)));
          }
        }
      } else {
        // Only update lastLoginAt to minimize db operations
        await userRef.update({
          lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch (error: unknown) {
      console.error('Error in addOrUpdateUser:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to add or update user: ${errorMessage}`);
    }
  }

  async checkAvailableTokens(uid: string): Promise<number> {
    try {
      const user = await this.usersCollection.doc(uid).get();
      
      if (!user.exists) {
        throw new Error('User not found');
      }
      
      const userData = user.data() as User;
      return userData.availableTokens || 0;
    } catch (error: unknown) {
      console.error('Error checking available tokens:', error);
      throw error;
    }
  }

  async registerTokenUsage(uid: string, usedTokens: number): Promise<boolean> {
    const userRef = this.usersCollection.doc(uid);
    
    try {
      // Use transactions with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const result = await db.runTransaction(async (transaction) => {
            const user = await transaction.get(userRef);
            
            if (!user.exists) {
              return false; // User not found
            }
            
            const userData = user.data() as User;
            const currentTokens = userData.availableTokens || 0;
            
            if (currentTokens < usedTokens) {
              return false; // Insufficient tokens
            }
            
            transaction.update(userRef, {
              availableTokens: currentTokens - usedTokens
            });
            
            return true;
          });
          
          return result;
        } catch (err) {
          retryCount++;
          console.warn(`Token usage transaction failed, retry ${retryCount}/${maxRetries}`);
          
          if (retryCount >= maxRetries) {
            throw err; // Rethrow if max retries reached
          }
          
          // Exponential backoff: 200ms, 400ms, 800ms
          await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, retryCount - 1)));
        }
      }
      
      return false; // Should not reach here but satisfies TypeScript
    } catch (error) {
      console.error('Error while using tokens:', error);
      return false;
    }
  }
}