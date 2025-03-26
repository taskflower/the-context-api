// src/services/status/status.types.ts
export interface HealthCheckResponse {
    status: string;
    timestamp: string;
    environment?: string;
  }
  
  export interface FirebaseStatusResponse {
    auth: {
      connected: boolean;
      error: string | null;
    };
    firestore: {
      connected: boolean;
      documentExists?: boolean;
      error: string | null;
    };
    sdkVersion: string;
    appInitialized: boolean;
  }