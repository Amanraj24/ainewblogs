import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";
import { BlogPost, GeneratedTopic, TrainingModule } from '../types';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// Retry helper function with exponential backoff
async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Check for 503 Service Unavailable, 429 Too Many Requests, or specific error messages
    const status = error?.status || error?.response?.status || error?.code;
    const isTransient = status === 503 || status === 429 || error?.message?.includes('overloaded');

    if (retries === 0 || !isTransient) {
      throw error;
    }

    console.log(`API Busy/Overloaded. Retrying in ${delay}ms... (Attempts left: ${retries})`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

// Helper to generate topics based on a niche
export const generateTopics = async (niche: string, trainingContext?: string, count: number = 3): Promise<GeneratedTopic[]> => {
  const modelId = "gemini-2.0-flash";

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        topic: { type: Type.STRING, description: "A catchy, SEO-friendly blog post title" },
        relevance: { type: Type.STRING, description: "Brief explanation of why this is trending or relevant" },
        content: { type: Type.STRING, description: "Full blog post in Markdown" },
        excerpt: { type: Type.STRING, description: "Short summary under 160 characters" },
        keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "5-7 keywords" },
        category: { type: Type.STRING },
        readTime: { type: Type.STRING },
        geoTargeting: { type: Type.STRING },
        aeoQuestions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING }
            },
            required: ["question", "answer"]
          },
          minItems: 4 as any,
          maxItems: 6 as any
        },
        seoScore: { type: Type.NUMBER },
        coverImage: { type: Type.STRING, description: "A descriptive prompt for generating a relevant cover image for this topic." }
      },
      required: ["topic", "relevance", "content", "excerpt", "keywords", "category", "readTime", "geoTargeting", "aeoQuestions", "seoScore", "coverImage"]
    }
  };

  const contextPrompt = trainingContext ? `\n\n[USER TRAINING/STYLE GUIDE]:\n${trainingContext}\n\nApply the above style/context to the topic suggestions.` : "";

  try {
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: modelId,
      contents: `Generate ${count} varied, high-impact, and click-worthy complete blog posts for the niche: "${niche}". ${contextPrompt}
      For each post, provide the full content, title, excerpt, and SEO/AEO metadata.
      Ensure a mix of content types.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
      },
    }));

    const text = response.text;
    if (!text) return [];
    const topics = JSON.parse(text) as GeneratedTopic[];

    // Add actual cover images to each topic
    return topics.map(topic => ({
      ...topic,
      // Use Picsum with a random seed based on topic length + random number to get variety but some stability
      coverImage: `https://picsum.photos/seed/${encodeURIComponent(topic.topic).substring(0, 10)}${Math.floor(Math.random() * 1000)}/800/400`
    }));
  } catch (error) {
    console.error("Error generating topics:", error);
    throw new Error("Failed to generate topics. Please check your API key or try again later.");
  }
};

// Helper to generate the full blog post
export const generateFullPost = async (topic: string, tone: string, trainingContext?: string): Promise<Partial<BlogPost>> => {
  const modelId = "gemini-2.0-flash";

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      content: { type: Type.STRING, description: "The full blog article in Markdown format. Use headers, bullet points, and clear paragraphs." },
      excerpt: { type: Type.STRING, description: "A short, engaging summary (meta description) under 160 characters." },
      keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "5-7 relevant tags/keywords for the post." },
      category: { type: Type.STRING, description: "A general category for this post." },
      readTime: { type: Type.STRING, description: "Estimated read time, e.g., '5 min read'" },

      // New Fields for Geo/SEO/AEO
      geoTargeting: { type: Type.STRING, description: "The primary geographic target (e.g., 'Global', 'USA')." },
      aeoQuestions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            answer: { type: Type.STRING }
          },
          required: ["question", "answer"],
        },
        minItems: 4 as any,
        maxItems: 6 as any,
        description: "Strictly generate between 4 to 6 'People Also Ask' style Q&A pairs. EVERY question MUST have a detailed 'answer'. Do NOT include these in the main content body."
      },
      seoScore: { type: Type.NUMBER, description: "SEO score (0-100)." }
    },
    required: ["title", "content", "excerpt", "keywords", "category", "readTime", "geoTargeting", "aeoQuestions", "seoScore"]
  };

  const contextPrompt = trainingContext ? `\n\n[USER TRAINING/STYLE GUIDE]:\n${trainingContext}\n\nSTRICTLY ADHERE to the above style guide, facts, and rules in the content generation.` : "";

  try {
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: modelId,
      contents: `You are an expert content writer. Write a complete, high-quality blog post about "${topic}". ${contextPrompt}
      
      Requirements:
      1. **Content**: Comprehensive, engaging, and well-structured. **DO NOT include an H1 title**. Use H2 and H3 for headings. **DO NOT include the FAQ or "People Also Ask" section in this marked-down content**; providing it in the JSON aeoQuestions is sufficient.
      2. **Tags**: Generate 5-7 relevant keywords/tags.
      3. **People Also Ask**: Generate 4-6 conversational Q&A pairs for the "People Also Ask" section. **MUST include both "question" and "answer" keys for EVERY item.** DO NOT leave the answer empty.
      4. **Geo**: Target ${tone.includes('UK') ? 'UK' : 'Global/US'} audience unless specified otherwise.
      5. **Tone**: ${tone}.
      
      Ensure the JSON output is valid and complete.
      
      Example of expected FAQ structure:
      "aeoQuestions": [
        { "question": "What is X?", "answer": "X is Y." },
        { "question": "How does Z work?", "answer": "Z works by..." }
      ]`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.4,
      },
    }));

    const text = response.text;
    if (!text) throw new Error("No content generated");

    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating post:", error);
    throw new Error("Failed to generate blog post. The AI model is currently overloaded. Please try again in a few moments.");
  }
};

// Helper to generate a cover image
export const generateCoverImage = async (topic: string): Promise<string> => {
  // Use Pollinations AI for real image generation based on the topic
  // Encode the topic to be URL safe
  const encodedTopic = encodeURIComponent(topic);
  // Add some randomness to bypass caching if the same topic is used multiple times, 
  // but keep it consistent enough for the same session if needed. 
  // actually, for a "generate" action, we want a new image each time.
  const randomSeed = Math.floor(Math.random() * 1000);
  return `https://image.pollinations.ai/prompt/${encodedTopic}?width=800&height=400&nologo=true&seed=${randomSeed}`;
};

// Redundant helper - now delegates to SVG as requested by user
export const generateWebPImage = async (topic: string): Promise<string> => {
  console.log("generateWebPImage called - redirecting to generateSVGImage");
  return generateSVGImage(topic);
};


// New helper to generate a minimalist SVG illustration via Gemini
export const generateSVGImage = async (topic: string): Promise<string> => {
  const modelId = "gemini-2.0-flash";

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      svg: { type: Type.STRING, description: "The complete SVG code, including <svg> tags and viewBox. Use minimalist, modern colors." }
    },
    required: ["svg"]
  };

  try {
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: modelId,
      contents: `You are a professional graphic designer and SVG expert. Generate a high-quality, modern, and minimalist SVG illustration for a blog post titled: "${topic}".
      
      Design Requirements:
      1. **Aesthetic**: Modern, clean, and premium look. Use a mix of geometric and organic shapes.
      2. **Color Palette**: Use a sophisticated color palette with 3-4 harmonious colors (e.g., indigo, soft teal, warm amber). Avoid harsh black/white or generic colors.
      3. **Composition**: Well-balanced composition with a clear center of interest.
      4. **Relevance**: The shapes and elements must symbolically represent the topic: "${topic}".
      5. **Technical**: 
         - Use viewBox="0 0 800 400".
         - Use smooth paths and gradients where appropriate for a "glassmorphism" or "claymorphism" effect.
         - Ensure the SVG is responsive (no hardcoded width/height outside viewBox).
      
      Return ONLY the valid SVG code within the "svg" field of the JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.5,
      },
    }));

    const text = response.text;
    if (!text) throw new Error("No SVG generated");
    const data = JSON.parse(text);

    // Return as a data URI for easy use in <img> tags
    const svgCode = data.svg;
    const base64Svg = Buffer.from(svgCode).toString('base64');
    return `data:image/svg+xml;base64,${base64Svg}`;
  } catch (error) {
    console.error("Error generating SVG:", error);
    // Fallback if SVG generation fails
    return generateCoverImage(topic);
  }
};

// New helper to orchestrate the entire auto-posting flow
export const generateAndPublishAutoPost = async (niche: string): Promise<BlogPost> => {
  // 1. Identify Topics
  const topics = await generateTopics(niche);
  if (!topics || topics.length === 0) {
    throw new Error("Failed to auto-generate topics");
  }

  // Pick a random topic from the suggestions
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];

  // 2. Generate Content
  const content = await generateFullPost(randomTopic.topic, "Professional & Engaging");

  // 3. Generate Image
  let coverImage;
  try {
    coverImage = await generateCoverImage(randomTopic.topic);
  } catch (e) {
    console.warn("Auto-post image generation failed, using fallback");
    const encodedTopic = encodeURIComponent(randomTopic.topic);
    coverImage = `https://image.pollinations.ai/prompt/${encodedTopic}?width=800&height=400&nologo=true`;
  }

  // 4. Return complete post
  return {
    id: Date.now().toString(),
    slug: (content.title || randomTopic.topic)
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, ''),
    title: content.title || randomTopic.topic,
    content: content.content || "",
    excerpt: content.excerpt || "",
    keywords: content.keywords || [],
    category: content.category || "Auto-Generated",
    readTime: content.readTime || "3 min read",
    dateCreated: new Date().toLocaleString(),
    status: 'published',
    geoTargeting: content.geoTargeting || "Global",
    aeoQuestions: content.aeoQuestions || [],
    seoScore: content.seoScore || 85,
    coverImage
  };
};

// New helper for Managerial Training Hub
export const generateTrainingModule = async (topic: string): Promise<Partial<TrainingModule>> => {
  const modelId = "gemini-2.0-flash";

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      learningObjectives: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4 bullet points on what the manager will learn." },
      keyConcepts: { type: Type.STRING, description: "A few paragraphs explaining the core ideas and principles." },
      caseStudy: { type: Type.STRING, description: "A short, practical scenario demonstrating the topic, including a problem and a successful resolution." },
      actionableTakeaways: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 concrete, actionable steps the manager can implement immediately." },
    },
    required: ["topic", "learningObjectives", "keyConcepts", "caseStudy", "actionableTakeaways"]
  };

  try {
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: modelId,
      contents: `Generate a concise, high-impact training module for managers on the topic of "${topic}". The tone should be professional, clear, and highly practical.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.6,
      },
    }));

    const text = response.text;
    if (!text) throw new Error("No content generated for training module");

    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating training module:", error);
    throw new Error("Failed to generate training module. The AI model might be busy. Please try again.");
  }
};