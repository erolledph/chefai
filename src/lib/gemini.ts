import { GoogleGenerativeAI } from '@google/generative-ai';
import { SuggestionSchema, FullRecipeSchema, FormInput } from './schemas';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateSuggestions(inputs: FormInput): Promise<any> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are an expert chef. Based on the following preferences, generate 3 unique recipe suggestions.

Ingredients available: ${inputs.ingredients.join(', ')}
Dish type: ${inputs.dishType}
Taste preference: ${inputs.taste}
Cooking time: ${inputs.cookingTime}
Dietary restrictions: ${inputs.dietaryRestrictions || 'None'}

Generate 3 recipe suggestions with titles and brief descriptions (2-3 sentences each). Return a JSON object with a "suggestions" array containing exactly 3 objects with "title" and "description" fields.`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          suggestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
              },
              required: ['title', 'description'],
            },
            minItems: 3,
            maxItems: 3,
          },
        },
        required: ['suggestions'],
      },
    },
  });

  const responseText =
    result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const parsed = JSON.parse(responseText);
  return SuggestionSchema.parse(parsed);
}

export async function generateFullRecipe(
  inputs: FormInput,
  selectedTitle: string
): Promise<any> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are an expert chef. Create a detailed recipe for "${selectedTitle}".

Original preferences:
Ingredients available: ${inputs.ingredients.join(', ')}
Dish type: ${inputs.dishType}
Taste preference: ${inputs.taste}
Cooking time: ${inputs.cookingTime}
Dietary restrictions: ${inputs.dietaryRestrictions || 'None'}

Generate a complete recipe with:
- Recipe title
- Description
- Number of servings
- Prep time
- Cook time
- List of ingredients (with amounts and units)
- Step-by-step instructions
- Cooking notes and tips

Return a JSON object with fields: title, description, servings, prepTime, cookTime, ingredients (array with name, amount, unit), instructions (array of strings), notes.`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          servings: { type: 'number' },
          prepTime: { type: 'string' },
          cookTime: { type: 'string' },
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                amount: { type: 'string' },
                unit: { type: 'string' },
              },
              required: ['name', 'amount', 'unit'],
            },
          },
          instructions: {
            type: 'array',
            items: { type: 'string' },
          },
          notes: { type: 'string' },
        },
        required: [
          'title',
          'description',
          'servings',
          'prepTime',
          'cookTime',
          'ingredients',
          'instructions',
          'notes',
        ],
      },
    },
  });

  const responseText =
    result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const parsed = JSON.parse(responseText);
  return FullRecipeSchema.parse(parsed);
}
