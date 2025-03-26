// src/services/status/status.service.ts
import * as admin from 'firebase-admin';

export class StatusService {
  getHealthStatus(): { status: string; timestamp: string; environment: string | undefined } {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    };
  }

  async checkFirebaseAuthStatus(): Promise<{ connected: boolean; error: string | null }> {
    try {
      // Try to list users (limit to 1) to verify Auth connection
      await admin.auth().listUsers(1);
      return { connected: true, error: null };
    } catch (error) {
      console.error('Firebase Auth connection error:', error);
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async checkFirestoreStatus(): Promise<{ connected: boolean; documentExists?: boolean; error: string | null }> {
    try {
      // Try to get a document from Firestore to verify connection
      const db = admin.firestore();
      const timestamp = Date.now();
      const docRef = db.collection('_health_checks').doc(`check-${timestamp}`);
      
      // Write a test document
      await docRef.set({ timestamp });
      
      // Read the test document
      const doc = await docRef.get();
      
      // Delete the test document
      await docRef.delete();
      
      return { 
        connected: true, 
        documentExists: doc.exists,
        error: null 
      };
    } catch (error) {
      console.error('Firestore connection error:', error);
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async getFirebaseStatus(appVersion: string): Promise<any> {
    // Check Firebase Auth connection
    const authStatus = await this.checkFirebaseAuthStatus();
    
    // Check Firestore connection
    const firestoreStatus = await this.checkFirestoreStatus();
    
    return {
      version: appVersion,
      firebase: {
        auth: authStatus,
        firestore: firestoreStatus,
        sdkVersion: admin.SDK_VERSION,
        appInitialized: admin.apps.length > 0
      },
      timestamp: new Date().toISOString()
    };
  }
}