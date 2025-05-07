import * as admin from 'firebase-admin';
import { db } from '../../config/firebase';

export class AppConfigService {
  private readonly configsCollection = db.collection('configs');

  /**
   * Pobiera config z Firestore dla podanego ID dokumentu (domyślnie 'default')
   */
  async getConfig(configId: string = 'default'): Promise<any> {
    const doc = await this.configsCollection.doc(configId).get();
    if (!doc.exists) {
      throw new Error(`Config '${configId}' nie istnieje w Firestore`);
    }
    return doc.data();
  }

  /**
   * Wgrywa przekazany obiekt config do Firestore pod dokument o podanym ID
   */
  async uploadConfig(configId: string = 'default', configData: any): Promise<void> {
    const docRef = this.configsCollection.doc(configId);
    await docRef.set({
      ...configData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }
}