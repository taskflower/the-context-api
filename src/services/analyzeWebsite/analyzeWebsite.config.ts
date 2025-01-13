import { WebPageAnalyzer } from '../../utils/webAnalyzer';
import admin from '../../config/firebase-admin'; // Import Firebase Admin SDK
import { v4 as uuidv4 } from 'uuid';

export interface InitializeParams {
  url: string;
  userId: string;
}

export async function analyzeWebsite(params: InitializeParams) {
  if (!params.url || !params.userId) {
      throw new Error('URL i userId są wymagane.');
  }

  const analyzer = new WebPageAnalyzer();
  const db = admin.firestore();
  const websitesCollection = db.collection('websites');

  try {
      let documentRef = websitesCollection.doc();

      await db.runTransaction(async (transaction) => {
          const querySnapshot = await transaction.get(
              websitesCollection.where('url', '==', params.url).limit(1)
          );

          if (!querySnapshot.empty) {
              documentRef = querySnapshot.docs[0].ref;
          } else {
              transaction.set(documentRef, {
                  url: params.url,
                  userId: params.userId,
                  timestamp: admin.firestore.Timestamp.now(),
                  status: 'in_progress',
              });
          }
      });

      const [{ markdown, images }, links, metrics] = await Promise.all([
          analyzer.htmlToMarkdown(params.url),
          analyzer.collectLinks(params.url),
          analyzer.analyzeTextMetrics(params.url),
      ]);

      await documentRef.set(
          {
              markdown,
              images, // Save collected images with alt texts
              links: {
                  total: links.length,
                  external: links.filter((l) => l.isExternal).length,
                  internal: links.filter((l) => !l.isExternal).length,
                  withImages: links.filter((l) => l.hasImage).length,
                  items: links,
              },
              metrics,
              status: 'completed',
              timestamp: admin.firestore.Timestamp.now(),
          },
          { merge: true }
      );

      return { id: documentRef.id, url: params.url, status: 'completed' };
  } catch (error) {
      console.error('Błąd analizy strony:', error);

      const errorRef = websitesCollection.doc(uuidv4());
      await errorRef.set(
          {
              url: params.url,
              userId: params.userId,
              status: 'failed',
              error: {
                  message: error instanceof Error ? error.message : 'Unknown error',
                  timestamp: admin.firestore.Timestamp.now(),
              },
          },
          { merge: true }
      );

      throw error;
  }
}
