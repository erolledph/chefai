# AI Chef App - Setup & Deployment Guide

## Overview

Production-ready AI Chef application that uses:
- **Gemini 2.5 Flash** for recipe generation
- **Firebase Firestore** for caching and persistence
- **Next.js API routes** (Express backend) for orchestration
- **Zero-cost operation** through aggressive caching

## Environment Setup

### 1. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Create a new API key
3. Copy the API key

### 2. Set Up Firebase Project

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database
3. Create a new service account:
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file
4. Extract the following from the JSON:
   - `project_id` → FIREBASE_PROJECT_ID
   - `private_key` → FIREBASE_PRIVATE_KEY
   - `client_email` → FIREBASE_CLIENT_EMAIL

### 3. Update .env File

```
GEMINI_API_KEY=your_gemini_api_key_here
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key_here
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
VITE_API_URL=http://localhost:3001
```

## Installation

```bash
npm install
```

## Development

### Terminal 1: Start Backend Server

```bash
npm run server
```

Backend runs on `http://localhost:3001`

### Terminal 2: Start Frontend Dev Server

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

## Production Deployment

### Build Frontend
```bash
npm run build
```

### Deploy Backend
Deploy the `server.ts` file to your preferred hosting:
- Vercel (with serverless functions)
- Railway
- Render
- AWS Lambda
- Google Cloud Run

### Deploy Frontend
Build output is in `dist/` directory. Deploy to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting

## Architecture

### API Endpoints

**POST /api/suggestions**
- Input: FormInput (ingredients, dishType, taste, cookingTime, dietaryRestrictions)
- Output: 3 recipe suggestions
- Caching: Checks Firebase first, generates if not cached

**POST /api/recipe**
- Input: cacheKey, selectedTitle
- Output: Full recipe with ingredients and instructions
- Caching: Checks Firebase first, generates if not cached

### Cache Key Generation
Cache keys are deterministic Base64-encoded JSON of sorted form inputs. Same inputs always produce same cache key, enabling perfect caching.

### Zero-Cost Operation
1. First request for a set of preferences hits Gemini API
2. Result is cached in Firebase
3. Subsequent identical requests return from cache instantly
4. At 1,000 RPD (free tier), can cache thousands of recipes
5. Cost remains $0 as long as requests stay within cache hits

## Database Schema

### recipes Collection

```typescript
{
  cacheKey: string;           // Unique identifier
  suggestions: {
    suggestions: [
      { title: string; description: string; },
      // 3 total suggestions
    ];
  };
  fullRecipe?: {
    title: string;
    description: string;
    servings: number;
    prepTime: string;
    cookTime: string;
    ingredients: [
      { name: string; amount: string; unit: string; }
    ];
    instructions: string[];
    notes: string;
  };
  createdAt: number;
  updatedAt: number;
}
```

## Validation

All inputs are validated using Zod schemas:
- FormInputSchema: User form inputs
- SuggestionSchema: 3 recipe titles and descriptions
- FullRecipeSchema: Complete recipe with ingredients and instructions
- CachedRecipeSchema: Full cache entry structure

## Error Handling

- Form validation errors: 400 Bad Request
- Cache lookup failures: Silently proceed to generation
- Gemini API errors: 400 with error message
- Missing required fields: 400 Bad Request

## Scaling Considerations

1. **High Traffic**: Caching handles 10,000+ daily visitors
2. **Multiple Regions**: Deploy backend in multiple regions, share Firebase
3. **Rate Limiting**: Implement rate limiting on backend routes
4. **Monitoring**: Track cache hit rate and API usage
5. **Cost Control**: Monitor Gemini API usage, stay within free tier

## Troubleshooting

**"Firebase credentials missing"**
- Ensure all 4 Firebase environment variables are set
- Check that private_key newlines are preserved

**"Gemini API error"**
- Verify GEMINI_API_KEY is correct and not expired
- Check API quota hasn't been exceeded

**"Cache not working"**
- Verify Firebase project has Firestore database enabled
- Check network requests in browser DevTools
- Verify identical form inputs produce same cache key

**CORS errors**
- Backend already includes CORS headers for all methods
- If custom domain, update CORS origin in server.ts

## Production Checklist

- [ ] All environment variables set
- [ ] Firebase Firestore database created and security rules set
- [ ] Gemini API key verified and quota checked
- [ ] Backend deployed and accessible
- [ ] Frontend build tested locally
- [ ] Frontend deployed to production domain
- [ ] Update VITE_API_URL to production backend URL
- [ ] Test end-to-end flow in production
- [ ] Set up monitoring and error logging
- [ ] Document API rate limits and quotas
