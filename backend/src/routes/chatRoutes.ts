import type { Request, RequestHandler, Response } from "express";
import express from "express";
import OpenAI from "openai";
import Supermemory from "supermemory";

const router = express.Router();
const client = new Supermemory({
  apiKey: process.env["SUPERMEMORY_API_KEY"], 
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.supermemory.ai/v3/https://api.openai.com/v1",
  defaultHeaders: {
    "x-api-key": process.env.SUPERMEMORY_API_KEY,
  },
});

router.get("/connect", async (req: Request, res: Response) => {
  try {
    const connection = await client.connections.create("google-drive", {
      redirectUrl: "http://localhost:5174",
    });
    res.status(201).json({
      message: "authenticate",
      url: connection.authLink,
    });
  } catch (error) {
    console.error("Connection creation failed:", error);
    res.status(500).json({
      message: "Failed to initiate connection",
      error: (error as Error).message,
    });
  }
});

router.get("/sync", async (req: Request, res: Response) => {
  try {
    await client.connections.import("google-drive");
    res.status(201).json({
      message: "synced",
    });
  } catch (error) {
    console.error("Sync failed:", error);
    res.status(500).json({
      message: "Failed to initiate sync",
      error: (error as Error).message,
    });
  }
});

interface ChatRequestBody {
  message: string;
}
interface ChatResponse {
  response: string | null;
}
interface ErrorResponse {
  error: string;
}

const chatHandler: RequestHandler<
  {},
  ChatResponse | ErrorResponse,
  ChatRequestBody
> = async (req, res, next) => {
  const { message } = req.body;
  if (!message) {
    res
      .status(400)
      .json({ error: 'Request body must include a "message" field.' });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      user: "sheriff",
      messages: [
        {
          role: "system",
          content:
            "You are ContractGuard, an AI assistant for contract and compliance reviews. When given any contract text, you will:\n\n1. Highlight key obligations and risks.\n2. Point out missing or non-standard clauses.\n3. Recommend fixes or best-practice language.\n4. Always format your answer in Markdown with headings and bullet points.",
        },
        { role: "user", content: message },
      ],
    });

    res.status(200).json({
      response: completion.choices[0]?.message?.content ?? null,
    });
    return;
  } catch (err) {
    console.error("Chat failed:", err);
    res.status(500).json({ error: "Failed to initiate AI chat." });
    return;
  }
};

router.post("/chat", chatHandler);

export default router;

