import express from 'express';
import path from 'path';
import { FormInputSchema } from './src/lib/schemas';
import { recipeCache, createCacheKey } from './src/lib/firebase';
import { generateSuggestions, generateFullRecipe } from './src/lib/gemini';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'dist')));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

app.post('/api/suggestions', async (req, res) => {
  try {
    const validatedInput = FormInputSchema.parse(req.body);
    const cacheKey = createCacheKey(validatedInput);

    let cached = await recipeCache.get(cacheKey);

    if (cached && cached.suggestions) {
      return res.json({
        suggestions: cached.suggestions.suggestions,
        cacheKey,
        fromCache: true,
      });
    }

    const suggestions = await generateSuggestions(validatedInput);

    await recipeCache.set(cacheKey, {
      suggestions,
      createdAt: Date.now(),
    });

    res.json({
      suggestions: suggestions.suggestions,
      cacheKey,
      fromCache: false,
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(400).json({
      error:
        error instanceof Error ? error.message : 'Failed to generate suggestions',
    });
  }
});

app.post('/api/recipe', async (req, res) => {
  try {
    const { cacheKey, selectedTitle } = req.body;

    if (!cacheKey || !selectedTitle) {
      return res.status(400).json({
        error: 'cacheKey and selectedTitle are required',
      });
    }

    let cached = await recipeCache.get(cacheKey);

    if (cached && cached.fullRecipe) {
      return res.json({
        recipe: cached.fullRecipe,
        fromCache: true,
      });
    }

    if (!cached || !cached.suggestions) {
      return res.status(404).json({
        error: 'Recipe suggestions not found. Please generate suggestions first.',
      });
    }

    const formInput = FormInputSchema.parse(JSON.parse(cached.cacheKey));
    const fullRecipe = await generateFullRecipe(formInput, selectedTitle);

    await recipeCache.set(cacheKey, {
      fullRecipe,
    });

    res.json({
      recipe: fullRecipe,
      fromCache: false,
    });
  } catch (error) {
    console.error('Error generating recipe:', error);
    res.status(400).json({
      error:
        error instanceof Error ? error.message : 'Failed to generate recipe',
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Chef API Server running on port ${PORT}`);
});
