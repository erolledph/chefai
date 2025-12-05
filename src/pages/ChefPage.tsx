import React, { useState } from 'react';
import { FormInput, Suggestion, FullRecipe } from '../lib/schemas';

interface ChefPageState {
  step: 'form' | 'suggestions' | 'recipe';
  loading: boolean;
  error: string | null;
  formData: Partial<FormInput>;
  suggestions: Suggestion['suggestions'] | null;
  recipe: FullRecipe | null;
  cacheKey: string | null;
  fromCache: boolean;
}

export function ChefPage() {
  const [state, setState] = useState<ChefPageState>({
    step: 'form',
    loading: false,
    error: null,
    formData: {
      ingredients: [],
      dishType: '',
      taste: '',
      cookingTime: '',
      dietaryRestrictions: '',
    },
    suggestions: null,
    recipe: null,
    cacheKey: null,
    fromCache: false,
  });

  const apiUrl =
    import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setState((prev) => ({
      ...prev,
      formData: { ...prev.formData, [name]: value },
    }));
  };

  const handleIngredientsChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    const ingredients = value.split(',').map((ing) => ing.trim());

    setState((prev) => ({
      ...prev,
      formData: { ...prev.formData, ingredients },
    }));
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`${apiUrl}/api/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.formData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data = await response.json();

      setState((prev) => ({
        ...prev,
        step: 'suggestions',
        suggestions: data.suggestions,
        cacheKey: data.cacheKey,
        fromCache: data.fromCache,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false,
      }));
    }
  };

  const handleSelectSuggestion = async (title: string) => {
    if (!state.cacheKey) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`${apiUrl}/api/recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cacheKey: state.cacheKey,
          selectedTitle: title,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate recipe');
      }

      const data = await response.json();

      setState((prev) => ({
        ...prev,
        step: 'recipe',
        recipe: data.recipe,
        fromCache: data.fromCache,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false,
      }));
    }
  };

  const handleReset = () => {
    setState({
      step: 'form',
      loading: false,
      error: null,
      formData: {
        ingredients: [],
        dishType: '',
        taste: '',
        cookingTime: '',
        dietaryRestrictions: '',
      },
      suggestions: null,
      recipe: null,
      cacheKey: null,
      fromCache: false,
    });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>AI Chef Assistant</h1>

      {state.error && (
        <div style={{ color: 'red', padding: '10px', marginBottom: '10px' }}>
          Error: {state.error}
        </div>
      )}

      {state.step === 'form' && (
        <form onSubmit={handleSubmitForm}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="ingredients">
              Ingredients (comma-separated):
            </label>
            <input
              id="ingredients"
              type="text"
              value={state.formData.ingredients?.join(', ') || ''}
              onChange={handleIngredientsChange}
              placeholder="e.g., chicken, rice, garlic"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="dishType">Dish Type:</label>
            <select
              id="dishType"
              name="dishType"
              value={state.formData.dishType || ''}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              required
            >
              <option value="">Select a dish type</option>
              <option value="appetizer">Appetizer</option>
              <option value="main-course">Main Course</option>
              <option value="side-dish">Side Dish</option>
              <option value="dessert">Dessert</option>
              <option value="soup">Soup</option>
              <option value="salad">Salad</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="taste">Taste Preference:</label>
            <select
              id="taste"
              name="taste"
              value={state.formData.taste || ''}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              required
            >
              <option value="">Select taste preference</option>
              <option value="spicy">Spicy</option>
              <option value="mild">Mild</option>
              <option value="sweet">Sweet</option>
              <option value="savory">Savory</option>
              <option value="umami">Umami</option>
              <option value="balanced">Balanced</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="cookingTime">Cooking Time:</label>
            <select
              id="cookingTime"
              name="cookingTime"
              value={state.formData.cookingTime || ''}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              required
            >
              <option value="">Select cooking time</option>
              <option value="15-minutes">15 Minutes</option>
              <option value="30-minutes">30 Minutes</option>
              <option value="1-hour">1 Hour</option>
              <option value="2-hours">2 Hours</option>
              <option value="3-plus-hours">3+ Hours</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="dietaryRestrictions">
              Dietary Restrictions (optional):
            </label>
            <input
              id="dietaryRestrictions"
              type="text"
              name="dietaryRestrictions"
              value={state.formData.dietaryRestrictions || ''}
              onChange={handleInputChange}
              placeholder="e.g., vegetarian, gluten-free"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <button
            type="submit"
            disabled={state.loading}
            style={{ padding: '10px 20px', cursor: state.loading ? 'not-allowed' : 'pointer' }}
          >
            {state.loading ? 'Generating...' : 'Get Recipe Suggestions'}
          </button>
        </form>
      )}

      {state.step === 'suggestions' && state.suggestions && (
        <div>
          <p>
            {state.fromCache ? '(From cache) ' : ''}
            Select a recipe:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            {state.suggestions.map((suggestion, index) => (
              <div key={index} style={{ border: '1px solid #ddd', padding: '15px' }}>
                <h3>{suggestion.title}</h3>
                <p>{suggestion.description}</p>
                <button
                  onClick={() => handleSelectSuggestion(suggestion.title)}
                  disabled={state.loading}
                  style={{
                    padding: '8px 16px',
                    cursor: state.loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {state.loading ? 'Generating...' : 'Generate Full Recipe'}
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleReset}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              cursor: 'pointer',
            }}
          >
            Start Over
          </button>
        </div>
      )}

      {state.step === 'recipe' && state.recipe && (
        <div>
          <p>
            {state.fromCache ? '(From cache) ' : ''}
          </p>
          <h2>{state.recipe.title}</h2>
          <p>{state.recipe.description}</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h3>Recipe Info</h3>
              <ul>
                <li>Servings: {state.recipe.servings}</li>
                <li>Prep Time: {state.recipe.prepTime}</li>
                <li>Cook Time: {state.recipe.cookTime}</li>
              </ul>

              <h3>Ingredients</h3>
              <ul>
                {state.recipe.ingredients.map((ing, index) => (
                  <li key={index}>
                    {ing.amount} {ing.unit} {ing.name}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3>Instructions</h3>
              <ol>
                {state.recipe.instructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>

              <h3>Notes</h3>
              <p>{state.recipe.notes}</p>
            </div>
          </div>

          <button
            onClick={handleReset}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              cursor: 'pointer',
            }}
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
}
