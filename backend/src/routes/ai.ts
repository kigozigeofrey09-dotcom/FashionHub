import { Router } from 'express';
import { z } from 'zod';

export const aiRouter = Router();

const aiInput = z.object({
  prompt: z.string().trim().min(1).max(1000),
  context: z.record(z.any()).optional()
});

aiRouter.post('/chat', async (req, res) => {
  const parsed = aiInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ message: 'Invalid prompt provided.' });
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.SEMMY_API_KEY;
  if (!apiKey) {
    return res.json({
      reply: "Semmy AI (Fallback Mode): I received your request, but the server's AI API key environment variable is not configured yet. Add OPENAI_API_KEY or SEMMY_API_KEY in your backend environment variables to enable live cloud AI intelligence!"
    });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are Semmy, FashionHub\'s intelligent administrative AI assistant for small businesses in Uganda using UGX. Be helpful, professional, and concise.' },
          { role: 'user', content: parsed.data.prompt }
        ],
        max_tokens: 300
      })
    });

    const data = await response.json() as any;
    const reply = data.choices?.[0]?.message?.content || "Semmy processed your request.";
    return res.json({ reply });
  } catch (err: any) {
    console.error('AI API error:', err);
    return res.status(500).json({ message: 'Could not reach AI provider service.' });
  }
});
