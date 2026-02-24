import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { getSupabaseAdmin } from "./src/services/supabaseAdmin.ts";
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  app.use(express.json());

  // Initialize Supabase Admin
  let supabase: any;
  try {
    supabase = getSupabaseAdmin();
  } catch (e) {
    console.error("Supabase Initialization Error:", e);
  }

  // Initialize Gemini AI
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const systemInstruction = process.env.AI_SYSTEM_INSTRUCTION || "You are a professional health consultant for SD GHT Health Care. Recommend GHT products based on symptoms.";

  // Middleware to simulate RLS by checking the access_token header
  const getAccessToken = (req: express.Request) => req.headers['x-access-token'] as string;

  // Admin Auth Middleware
  const adminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const password = req.headers['x-admin-password'];
    if (password === process.env.ADMIN_PASSWORD) {
      next();
    } else {
      res.status(401).json({ error: "Unauthorized Admin Access" });
    }
  };

  // --- Admin CRUD Routes ---

  // Generic Admin GET
  app.get("/api/admin/:table", adminAuth, async (req, res) => {
    const { table } = req.params;
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // Generic Admin POST
  app.post("/api/admin/:table", adminAuth, async (req, res) => {
    const { table } = req.params;
    const { data, error } = await supabase.from(table).insert([req.body]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // Generic Admin PUT
  app.put("/api/admin/:table/:id", adminAuth, async (req, res) => {
    const { table, id } = req.params;
    const { data, error } = await supabase.from(table).update(req.body).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // Generic Admin DELETE
  app.delete("/api/admin/:table/:id", adminAuth, async (req, res) => {
    const { table, id } = req.params;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // --- Public Routes ---
  app.get("/api/products", async (req, res) => {
    if (!supabase) return res.json([]);
    const { data, error } = await supabase.from('products').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  });

  app.get("/api/blogs", async (req, res) => {
    if (!supabase) return res.json([]);
    const { data, error } = await supabase.from('blog_posts').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  });

  app.post("/api/consultations", async (req, res) => {
    if (!supabase) return res.status(503).json({ error: "Database not configured" });
    const { patient_name, phone, illness, symptoms, distributor_id } = req.body;
    const access_token = getAccessToken(req);
    
    if (!access_token) return res.status(401).json({ error: "No session token found" });

    // Fetch products to give context to Gemini
    const { data: products } = await supabase.from('products').select('name, short_desc');
    const productList = products?.map((p: any) => p.name).join(", ") || "";

    // Generate AI Recommendation using Gemini
    let ai_recommendation = "Our team will review your symptoms and get back to you.";
    let recommended_products: string[] = [];

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: `Patient: ${patient_name}. Symptoms: ${symptoms}. Illness: ${illness}. Available Products: ${productList}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text || "{}");
      ai_recommendation = result.recommendation || ai_recommendation;
      recommended_products = result.products || [];
    } catch (e) {
      console.error("Gemini Error:", e);
    }

    const { data, error } = await supabase
      .from('consultations')
      .insert([
        { 
          patient_name, 
          phone, 
          illness, 
          symptoms, 
          ai_recommendation, 
          recommended_products, 
          access_token, 
          distributor_id 
        }
      ])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id, ai_recommendation });
  });

  app.get("/api/my-consultations", async (req, res) => {
    const access_token = getAccessToken(req);
    if (!access_token) return res.json([]);

    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('access_token', access_token);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
  }

  app.listen(3000, "0.0.0.0", () => console.log("Server running on http://localhost:3000"));
}

startServer();
