import { z } from 'zod';

export const FormInputSchema = z.object({
  ingredients: z.array(z.string()).min(1, 'At least one ingredient is required'),
  dishType: z.string().min(1, 'Dish type is required'),
  taste: z.string().min(1, 'Taste preference is required'),
  cookingTime: z.string().min(1, 'Cooking time is required'),
  dietaryRestrictions: z.string().optional(),
});

export type FormInput = z.infer<typeof FormInputSchema>;

export const IngredientSchema = z.object({
  name: z.string(),
  amount: z.string(),
  unit: z.string(),
});

export type Ingredient = z.infer<typeof IngredientSchema>;

export const SuggestionSchema = z.object({
  suggestions: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
    })
  ).length(3),
});

export type Suggestion = z.infer<typeof SuggestionSchema>;

export const FullRecipeSchema = z.object({
  title: z.string(),
  description: z.string(),
  servings: z.number(),
  prepTime: z.string(),
  cookTime: z.string(),
  ingredients: z.array(IngredientSchema),
  instructions: z.array(z.string()),
  notes: z.string(),
});

export type FullRecipe = z.infer<typeof FullRecipeSchema>;

export const CachedRecipeSchema = z.object({
  cacheKey: z.string(),
  suggestions: SuggestionSchema,
  fullRecipe: FullRecipeSchema.optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type CachedRecipe = z.infer<typeof CachedRecipeSchema>;
