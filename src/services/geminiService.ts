import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getPollinationAnalysis(
  cropData: any,
  climateData: any[],
  lang: 'en' | 'te'
) {
  const prompt = `
    Analyze the following pollination risk for a farmer:
    Crop: ${cropData.crop_name}
    Category: ${cropData.crop_category}
    Sowing Date: ${cropData.sowing_date}
    Location: ${cropData.location_name}

    Historical Climate Data (last 20 years):
    ${JSON.stringify(climateData)}

    Based on the warming trend and bloom shifts, provide:
    1. A risk score (Low, Moderate, High).
    2. A brief explanation of the mismatch risk.
    3. 3-4 actionable recommendations for the farmer (e.g., adjust sowing date, switch crops, etc.).

    Respond in ${lang === 'te' ? 'Telugu' : 'English'}.
    Format the response as JSON with keys: "riskScore", "explanation", "recommendations" (array of strings).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini API error:", error);
    if (lang === 'te') {
      return {
        riskScore: "మధ్యస్థం",
        explanation: "AI సలహాదారుని కనెక్ట్ చేయడంలో లోపం. చారిత్రక డేటా ఆధారంగా, మధ్యస్థ మార్పు అంచనా వేయబడింది.",
        recommendations: ["స్థానిక వాతావరణ నమూనాలను పర్యవేక్షించండి", "ముందస్తు విత్తడం గురించి ఆలోచించండి", "స్థానిక వ్యవసాయ నిపుణులను సంప్రదించండి"]
      };
    }
    return {
      riskScore: "Moderate",
      explanation: "Error connecting to AI advisor. Based on historical data, a moderate shift is expected.",
      recommendations: ["Monitor local weather patterns", "Consider early sowing", "Consult local agriculture experts"]
    };
  }
}
