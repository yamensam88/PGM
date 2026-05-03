import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeDailyAnomalies(anomalies: any) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const prompt = `
Vous êtes le "Directeur Technique IA" d'une entreprise de livraison.
Votre rôle est d'analyser les données suivantes qui représentent des anomalies détectées aujourd'hui dans les tournées de livraison.
Rédigez un rapport concis, professionnel et direct (en français) destiné à l'équipe d'exploitation (Dispatch).
Mettez en évidence les problèmes critiques (retards majeurs, pertes financières) et proposez des actions correctives.

Données d'anomalies :
${JSON.stringify(anomalies, null, 2)}

Format attendu :
- Un titre clair.
- Un résumé de la situation (2 lignes max).
- Les points d'attention (avec les IDs de tournées ou noms de chauffeurs).
- Recommandation d'action.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error('Error generating AI technical report:', error);
    return 'Erreur lors de la génération du rapport IA.';
  }
}
