import { GoogleGenerativeAI } from "@google/generative-ai";

export interface PartAnalysis {
  name: string;
  description: string;
  specifications: {
    measurements: string;
    material: string;
    headType?: string;
    threadType?: string;
  };
  replacementAdvice: string;
  searchKeywords: string[];
}

export async function analyzeImage(
  apiKey: string,
  base64Image: string,
  mimeType: string
): Promise<PartAnalysis> {
  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-2.5-flash as the latest standard model for vision and text tasks
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Je bent een expert in hardware en bouwmaterialen (zoals schroeven, bouten, pluggen, scharnieren, etc.).
Analyseer de bijgevoegde afbeelding zorgvuldig.
Wat is dit specifiek? Geef afmetingen (geschat), materiaal en type.
Geef je antwoord UITSLUITEND in het volgende JSON-formaat zonder extra tekst:
{
  "name": "Korte naam van het onderdeel",
  "description": "Korte beschrijving van wat het is en waar het voor gebruikt wordt",
  "specifications": {
    "measurements": "Geschatte afmetingen (bijv. M4 x 20mm)",
    "material": "Geschat materiaal (bijv. RVS, verzinkt staal)",
    "headType": "Type kop (indien van toepassing, bijv. kruiskop, torx)",
    "threadType": "Type draad (indien van toepassing, bijv. metrisch, houtdraad)"
  },
  "replacementAdvice": "Waar moet de gebruiker op letten bij het kopen van een vervanger?",
  "searchKeywords": ["zoekterm1", "zoekterm2", "zoekterm3"]
}`;

  const imageParts = [
    {
      inlineData: {
        data: base64Image,
        mimeType
      },
    },
  ];

  try {
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    // The model might wrap the JSON in markdown code blocks like ```json ... ```
    // So we need to clean it up before parsing.
    const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    const parsedData: PartAnalysis = JSON.parse(cleanText);
    return parsedData;
  } catch (error) {
    console.error("Fout tijdens Gemini API Analyse:", error);
    throw new Error("Kon de afbeelding niet analyseren. Controleer je API sleutel of probeer een duidelijkere foto.");
  }
}
