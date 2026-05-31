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

/**
 * Synthèse exécutive (Direction) rédigée à partir d'indicateurs DÉJÀ calculés.
 * Règle clé : l'IA n'invente aucun chiffre, elle ne fait que rédiger l'analyse décisionnelle.
 * Retourne "__NO_KEY__" si la clé n'est pas configurée, "__ERROR__" en cas d'échec.
 */
export async function generateExecutiveSummary(data: any): Promise<string> {
  if (!process.env.GEMINI_API_KEY) return "__NO_KEY__";

  const prompt = `Tu es le Directeur Financier IA d'une société de livraison du dernier kilomètre.
À partir des indicateurs RÉELS ci-dessous (déjà calculés, en euros), rédige une synthèse exécutive en français pour la Direction.

RÈGLES STRICTES :
- Utilise UNIQUEMENT les chiffres fournis. N'invente AUCUN chiffre, aucun nom, aucune donnée absente.
- Structure en 3 brefs paragraphes : (1) Constat (2 phrases : marge, statut), (2) Où l'on perd / risques (postes dominants, inactivité, qualité), (3) Décisions à prendre, classées par impact € décroissant.
- Ton direct, factuel, orienté décision. ~130-170 mots. Pas de listes à puces interminables, pas de remplissage.
- Si une valeur vaut 0 ou est nulle, ne la commente pas.

Indicateurs (JSON) :
${JSON.stringify(data, null, 2)}`;

  try {
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    return (response.text || "").trim() || "__ERROR__";
  } catch (error) {
    console.error("generateExecutiveSummary error:", error);
    return "__ERROR__";
  }
}
