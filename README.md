# JARVIS AI — Gemini Edition

This version uses the Gemini Developer API instead of OpenAI.

## Vercel environment variables

Required:
GEMINI_API_KEY=your_gemini_api_key

Optional:
GEMINI_MODEL=gemini-3.1-flash-lite-preview

## Deploy

1. Push this folder to GitHub.
2. Import the repository into Vercel.
3. Add `GEMINI_API_KEY` in Vercel → Settings → Environment Variables.
4. Redeploy.
5. Open the deployed site.

Do not put the API key in `index.html` or `script.js`.
