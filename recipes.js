// Recipes JavaScript with TheMealDB API
// UPDATED WITH NETLIFY SECURE API INTEGRATION

// Initialize recipes module
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Recipes module loading...');
    
    // Wait for secure API keys to load
    if (!window.secureApiKeys) {
        console.log('Waiting for API keys...');
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    console.log('Recipes API status:', 
        window.secureApiKeys?.hasRecipesKey ? 'Using secure API' : 'Using TheMealDB free API',
        window.secureApiKeys?.hasThemealdbKey ? ' (Premium)' : ' (Free)');
    
    // Initialize recipes functionality
    initializeRecipes();
});

async function initializeRecipes() {
    const recipeSearch = document.getElementById('recipe-search');
    const searchBtn = document.getElementById('search-btn');
    const cuisineFilter = document.getElementById('cuisine-filter');
    const dietFilter = document.getElementById('diet-filter');
    const timeFilter = document.getElementById('time-filter');
    const recipesGrid = document.getElementById('recipes-grid');
    const recipeModal = document.getElementById('recipe-modal');
    const closeModal = document.querySelector('.close-modal');
    const recipeDetails = document.getElementById('recipe-details');

    try {
        // Load popular recipes with API
        await loadPopularRecipes();
        
        // Load cuisine categories
        await loadCuisineCategories();
        
    } catch (error) {
        console.error('Recipes initialization error:', error);
        // Fallback to local data
        loadPopularRecipesLocal();
    }

    // Search button click
    searchBtn.addEventListener('click', performSearch);

    // Enter key in search field
    recipeSearch.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Filter changes
    cuisineFilter.addEventListener('change', performSearch);
    dietFilter.addEventListener('change', performSearch);
    timeFilter.addEventListener('change', performSearch);

    // Close modal
    closeModal.addEventListener('click', function() {
        recipeModal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === recipeModal) {
            recipeModal.style.display = 'none';
        }
    });
    
    // Initialize saved recipes display
    initializeSavedRecipes();
}

// ===== SECURE API FUNCTIONS =====

// Load popular recipes with secure API
async function loadPopularRecipes() {
    const recipesGrid = document.getElementById('recipes-grid');
    if (!recipesGrid) return;
    
    try {
        const apiKey = window.secureApiKeys?.recipes || window.secureApiKeys?.themealdb;
        
        if (apiKey) {
            // Use secure API for recipes
            const recipes = await fetchPopularRecipesAPI(apiKey);
            displayRecipes(recipes, recipesGrid);
        } else {
            // Use TheMealDB free API
            const recipes = await getPopularRecipes();
            displayRecipes(recipes, recipesGrid);
        }
        
    } catch (error) {
        console.error('Error loading popular recipes:', error);
        loadPopularRecipesLocal();
    }
}

// Fetch popular recipes using secure API
async function fetchPopularRecipesAPI(apiKey) {
    try {
        // Replace with your actual recipes API endpoint
        const response = await fetch(`https://api.recipes.com/popular?key=${apiKey}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Recipes API request failed');
        }
        
        const data = await response.json();
        
        // Format API response to match our structure
        return data.recipes?.map(recipe => formatRecipeCardDataAPI(recipe)) || [];
        
    } catch (error) {
        console.error('Secure recipes API error:', error);
        throw error;
    }
}

// Format API recipe data for cards
function formatRecipeCardDataAPI(recipe) {
    return {
        id: recipe.id || recipe.recipeId,
        title: recipe.name || recipe.title,
        image: recipe.image || recipe.imageUrl,
        category: recipe.category || recipe.cuisine || 'Unknown',
        area: recipe.cuisine || recipe.region || 'Unknown',
        tags: recipe.tags || recipe.keywords || [],
        rating: recipe.rating || recipe.avgRating,
        cookTime: recipe.cookTime || recipe.totalTime,
        difficulty: recipe.difficulty || 'Medium'
    };
}

// ===== THEMEALDB API FUNCTIONS (Free Tier) =====

// Get popular recipes from TheMealDB API
async function getPopularRecipes() {
    try {
        // Get 8 random recipes for popular section
        const promises = [];
        for (let i = 0; i < 8; i++) {
            promises.push(fetch('https://www.themealdb.com/api/json/v1/1/random.php'));
        }
        
        const responses = await Promise.all(promises);
        const data = await Promise.all(responses.map(r => r.json()));
        
        const recipes = data.map(item => {
            if (item.meals && item.meals[0]) {
                return formatRecipeCardData(item.meals[0]);
            }
            return null;
        }).filter(recipe => recipe !== null);
        
        return recipes;
        
    } catch (error) {
        console.error('Error fetching popular recipes:', error);
        return getMockRecipes();
    }
}

// Search recipes by name using TheMealDB API
async function searchRecipesByName(query) {
    try {
        // Check if we have a secure API key for premium search
        const apiKey = window.secureApiKeys?.recipes || window.secureApiKeys?.themealdb;
        let apiUrl = `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`;
        
        if (apiKey) {
            // If you have a premium API, use it here
            // apiUrl = `https://api.recipes.com/search?q=${query}&key=${apiKey}`;
        }
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error('Failed to search recipes');
        }
        
        const data = await response.json();
        
        if (!data.meals || data.meals.length === 0) {
            return [];
        }
        
        // Format recipes for display
        const recipes = data.meals.map(meal => formatRecipeCardData(meal));
        return recipes;
        
    } catch (error) {
        console.error('Error searching recipes:', error);
        throw error;
    }
}

// Get recipe details by ID from TheMealDB API
async function getRecipeDetails(recipeId) {
    try {
        const apiKey = window.secureApiKeys?.recipes || window.secureApiKeys?.themealdb;
        let apiUrl = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeId}`;
        
        if (apiKey) {
            // If you have a premium API, use it here
            // apiUrl = `https://api.recipes.com/recipe/${recipeId}?key=${apiKey}`;
        }
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error('Failed to fetch recipe details');
        }
        
        const data = await response.json();
        
        if (!data.meals || !data.meals[0]) {
            throw new Error('Recipe not found');
        }
        
        return formatRecipeDetailsData(data.meals[0]);
        
    } catch (error) {
        console.error('Error fetching recipe details:', error);
        throw error;
    }
}

// ===== LOCAL FALLBACK FUNCTIONS =====

// Local fallback for popular recipes
function loadPopularRecipesLocal() {
    const recipesGrid = document.getElementById('recipes-grid');
    if (!recipesGrid) return;
    
    const recipes = getMockRecipes();
    displayRecipes(recipes, recipesGrid);
}

// ===== HELPER FUNCTIONS =====

// Show loading spinner
function showLoading(element) {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = `
        <div class="spinner"></div>
        <p>Loading recipes...</p>
    `;
    element.innerHTML = '';
    element.appendChild(spinner);
    return spinner;
}

// Hide loading spinner
function hideLoading(spinner) {
    if (spinner && spinner.parentNode) {
        spinner.parentNode.removeChild(spinner);
    }
}

// Load cuisine categories from TheMealDB API
async function loadCuisineCategories() {
    const cuisineFilter = document.getElementById('cuisine-filter');
    if (!cuisineFilter) return;

    try {
        const response = await fetch('https://www.themealdb.com/api/json/v1/1/categories.php');
        
        if (!response.ok) {
            throw new Error('Failed to load categories');
        }
        
        const data = await response.json();
        
        if (data.categories) {
            // Clear existing options except the first one
            while (cuisineFilter.options.length > 1) {
                cuisineFilter.remove(1);
            }
            
            // Add categories as options
            data.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.strCategory.toLowerCase();
                option.textContent = category.strCategory;
                cuisineFilter.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Perform recipe search
async function performSearch() {
    const searchQuery = document.getElementById('recipe-search').value.trim();
    const cuisine = document.getElementById('cuisine-filter').value;
    const diet = document.getElementById('diet-filter').value;
    const maxTime = document.getElementById('time-filter').value;

    const recipesGrid = document.getElementById('recipes-grid');
    
    // Show loading
    const spinner = showLoading(recipesGrid);
    
    try {
        let recipes;
        
        if (searchQuery === '') {
            // If no search query, show popular recipes
            recipes = await getPopularRecipes();
        } else {
            // Search for recipes by name
            recipes = await searchRecipesByName(searchQuery);
            
            // Apply filters
            if (cuisine || diet || maxTime) {
                recipes = filterRecipes(recipes, cuisine, diet, maxTime);
            }
        }
        
        // Hide loading
        hideLoading(spinner);
        
        // Display recipes
        displayRecipes(recipes, recipesGrid);
    } catch (error) {
        console.error('Error searching recipes:', error);
        hideLoading(spinner);
        recipesGrid.innerHTML = '<p class="error-message">Error loading recipes. Please try again.</p>';
    }
}

// Filter recipes based on criteria
function filterRecipes(recipes, cuisine, diet, maxTime) {
    let filtered = [...recipes];
    
    if (cuisine) {
        filtered = filtered.filter(recipe => 
            recipe.category.toLowerCase().includes(cuisine.toLowerCase())
        );
    }
    
    if (diet) {
        if (diet === 'vegetarian') {
            filtered = filtered.filter(recipe => 
                !recipe.tags?.includes('meat') && 
                !recipe.tags?.includes('chicken') && 
                !recipe.tags?.includes('beef') &&
                !recipe.tags?.includes('fish')
            );
        } else if (diet === 'vegan') {
            filtered = filtered.filter(recipe => 
                recipe.tags?.includes('vegan') || 
                (recipe.category.toLowerCase().includes('vegan'))
            );
        }
    }
    
    // Note: TheMealDB doesn't provide cooking time
    // This is a placeholder for future implementation
    
    return filtered;
}

// Format recipe data for cards
function formatRecipeCardData(mealData) {
    return {
        id: mealData.idMeal,
        title: mealData.strMeal,
        image: mealData.strMealThumb,
        category: mealData.strCategory || 'Unknown',
        area: mealData.strArea || 'Unknown',
        tags: mealData.strTags ? mealData.strTags.split(',') : []
    };
}

// Display recipes in grid
function displayRecipes(recipes, container) {
    container.innerHTML = '';
    
    if (recipes.length === 0) {
        container.innerHTML = '<p class="no-results">No recipes found. Try a different search.</p>';
        return;
    }
    
    recipes.forEach(recipe => {
        const recipeCard = document.createElement('div');
        recipeCard.className = 'recipe-card';
        
        // Add API source indicator
        const apiSource = window.secureApiKeys?.hasRecipesKey ? 'premium' : 'free';
        
        recipeCard.innerHTML = `
            <div class="recipe-image-container">
                <img src="${recipe.image}" alt="${recipe.title}" class="recipe-image">
                ${apiSource === 'premium' ? '<span class="api-badge">Premium</span>' : ''}
            </div>
            <div class="recipe-content">
                <h3 class="recipe-title">${recipe.title}</h3>
                <div class="recipe-meta">
                    <span><i class="fas fa-utensils"></i> ${recipe.category}</span>
                    <span><i class="fas fa-globe"></i> ${recipe.area}</span>
                </div>
                ${recipe.rating ? `<div class="recipe-rating">
                    <i class="fas fa-star"></i> ${recipe.rating.toFixed(1)}
                </div>` : ''}
                ${recipe.cookTime ? `<div class="recipe-time">
                    <i class="fas fa-clock"></i> ${recipe.cookTime} mins
                </div>` : ''}
                <button class="btn btn-primary view-recipe-btn" data-id="${recipe.id}">View Recipe</button>
                <button class="btn btn-secondary save-recipe-btn" data-id="${recipe.id}">
                    <i class="fas fa-bookmark"></i>
                </button>
            </div>
        `;
        
        container.appendChild(recipeCard);
    });
    
    // Add event listeners to view recipe buttons
    document.querySelectorAll('.view-recipe-btn').forEach(button => {
        button.addEventListener('click', function() {
            const recipeId = this.getAttribute('data-id');
            viewRecipeDetails(recipeId);
        });
    });
    
    // Add event listeners to save recipe buttons
    document.querySelectorAll('.save-recipe-btn').forEach(button => {
        button.addEventListener('click', function() {
            const recipeId = this.getAttribute('data-id');
            const recipe = recipes.find(r => r.id === recipeId);
            if (recipe) {
                saveRecipeToCollection(recipe);
            }
        });
    });
}

// View recipe details
async function viewRecipeDetails(recipeId) {
    const recipeModal = document.getElementById('recipe-modal');
    const recipeDetails = document.getElementById('recipe-details');
    
    // Show loading
    recipeDetails.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading recipe details...</p></div>';
    recipeModal.style.display = 'block';
    
    try {
        const recipe = await getRecipeDetails(recipeId);
        displayRecipeDetails(recipe);
    } catch (error) {
        console.error('Error loading recipe details:', error);
        recipeDetails.innerHTML = '<p class="error-message">Error loading recipe details. Please try again.</p>';
    }
}

// Format recipe details data
function formatRecipeDetailsData(mealData) {
    // Extract ingredients and measurements
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        const ingredient = mealData[`strIngredient${i}`];
        const measure = mealData[`strMeasure${i}`];
        
        if (ingredient && ingredient.trim() !== '') {
            ingredients.push({
                name: ingredient,
                measure: measure || ''
            });
        }
    }
    
    // Split instructions into steps
    const instructions = mealData.strInstructions 
        ? mealData.strInstructions.split('\r\n').filter(step => step.trim() !== '')
        : ['No detailed instructions available.'];
    
    return {
        id: mealData.idMeal,
        title: mealData.strMeal,
        image: mealData.strMealThumb,
        category: mealData.strCategory,
        area: mealData.strArea,
        instructions: instructions,
        ingredients: ingredients,
        youtube: mealData.strYoutube,
        source: mealData.strSource,
        tags: mealData.strTags ? mealData.strTags.split(',') : []
    };
}

// Display recipe details in modal
function displayRecipeDetails(recipe) {
    const recipeDetails = document.getElementById('recipe-details');
    
    // Format ingredients list
    const ingredientsList = recipe.ingredients.map(ing => 
        `<li><strong>${ing.measure}</strong> ${ing.name}</li>`
    ).join('');
    
    // Format instructions
    const instructionsList = recipe.instructions.map((step, index) => 
        `<li>${step}</li>`
    ).join('');
    
    recipeDetails.innerHTML = `
        <div class="recipe-header">
            <h2>${recipe.title}</h2>
            <div class="recipe-image-container">
                <img src="${recipe.image}" alt="${recipe.title}" class="recipe-detail-image">
                ${window.secureApiKeys?.hasRecipesKey ? '<span class="api-badge">Premium Recipe</span>' : ''}
            </div>
        </div>
        
        <div class="recipe-meta-details">
            <div class="meta-item">
                <i class="fas fa-utensils"></i>
                <span>${recipe.category}</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-globe"></i>
                <span>${recipe.area}</span>
            </div>
            ${recipe.tags.length > 0 ? `
            <div class="meta-item">
                <i class="fas fa-tags"></i>
                <span>${recipe.tags.join(', ')}</span>
            </div>
            ` : ''}
        </div>
        
        <div class="recipe-ingredients">
            <h3>Ingredients</h3>
            <ul>${ingredientsList}</ul>
        </div>
        
        <div class="recipe-instructions">
            <h3>Instructions</h3>
            <ol>${instructionsList}</ol>
        </div>
        
        ${recipe.youtube ? `
        <div class="recipe-video">
            <a href="${recipe.youtube}" target="_blank" class="btn btn-primary">
                <i class="fab fa-youtube"></i> Watch Video Tutorial
            </a>
        </div>
        ` : ''}
        
        <div class="recipe-actions">
            <button class="btn btn-primary" id="save-recipe-btn">
                <i class="fas fa-save"></i> Save Recipe
            </button>
            <button class="btn btn-secondary" id="shopping-list-btn">
                <i class="fas fa-shopping-cart"></i> Add to Shopping List
            </button>
            <button class="btn btn-tertiary" id="share-recipe-btn">
                <i class="fas fa-share"></i> Share
            </button>
        </div>
    `;
    
    // Add event listeners to action buttons
    document.getElementById('save-recipe-btn').addEventListener('click', function() {
        saveRecipeToCollection(recipe);
    });
    
    document.getElementById('shopping-list-btn').addEventListener('click', function() {
        addIngredientsToShoppingList(recipe.ingredients);
    });
    
    document.getElementById('share-recipe-btn').addEventListener('click', function() {
        shareRecipe(recipe);
    });
}

// Initialize saved recipes display
function initializeSavedRecipes() {
    const savedRecipesContainer = document.getElementById('saved-recipes-container');
    if (!savedRecipesContainer) return;
    
    const savedRecipes = JSON.parse(localStorage.getItem('mealmaestro-saved-recipes')) || [];
    
    if (savedRecipes.length === 0) {
        savedRecipesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bookmark" style="font-size: 3rem; color: #ddd; margin-bottom: 15px;"></i>
                <p>No saved recipes yet</p>
                <p class="text-muted">Save recipes to view them here</p>
            </div>
        `;
        return;
    }
    
    displayRecipes(savedRecipes, savedRecipesContainer);
}

// Save recipe to collection
function saveRecipeToCollection(recipe) {
    const savedRecipes = JSON.parse(localStorage.getItem('mealmaestro-saved-recipes')) || [];
    
    // Check if recipe is already saved
    if (!savedRecipes.find(r => r.id === recipe.id)) {
        savedRecipes.push({
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            category: recipe.category,
            savedAt: new Date().toISOString()
        });
        
        localStorage.setItem('mealmaestro-saved-recipes', JSON.stringify(savedRecipes));
        
        // Update UI
        initializeSavedRecipes();
        
        // Show notification
        showNotification('Recipe saved to your collection!', 'success');
    } else {
        showNotification('Recipe is already in your collection!', 'info');
    }
}

// Add ingredients to shopping list
function addIngredientsToShoppingList(ingredients) {
    const shoppingList = JSON.parse(localStorage.getItem('mealmaestro-shopping-list')) || [];
    
    ingredients.forEach(ingredient => {
        // Check if ingredient already exists
        if (!shoppingList.find(item => item.name.toLowerCase() === ingredient.name.toLowerCase())) {
            shoppingList.push({
                id: Date.now() + Math.random(),
                name: ingredient.name,
                quantity: ingredient.measure || '1',
                category: 'Pantry',
                checked: false
            });
        }
    });
    
    localStorage.setItem('mealmaestro-shopping-list', JSON.stringify(shoppingList));
    showNotification('Ingredients added to shopping list!', 'success');
}

// Share recipe
function shareRecipe(recipe) {
    if (navigator.share) {
        navigator.share({
            title: recipe.title,
            text: `Check out this recipe: ${recipe.title}`,
            url: window.location.href
        });
    } else {
        // Fallback for browsers without Web Share API
        const shareUrl = `${window.location.origin}/recipe/${recipe.id}`;
        navigator.clipboard.writeText(shareUrl);
        showNotification('Recipe link copied to clipboard!', 'success');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove any existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Add close button event
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Mock recipes fallback
function getMockRecipes() {
    return [
        {
            id: '52772',
            title: 'Teriyaki Chicken Casserole',
            image: 'https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg',
            category: 'Chicken',
            area: 'Japanese',
            tags: ['chicken', 'casserole', 'asian']
        },
        {
            id: '52773',
            title: 'Vegetable Pasta',
            image: 'https://www.themealdb.com/images/media/meals/wvqpwt1468339226.jpg',
            category: 'Vegetarian',
            area: 'Italian',
            tags: ['vegetarian', 'pasta', 'italian']
        },
        {
            id: '52774',
            title: 'Beef Wellington',
            image: 'https://www.themealdb.com/images/media/meals/vvpprx1487325699.jpg',
            category: 'Beef',
            area: 'British',
            tags: ['beef', 'british', 'classic']
        },
        {
            id: '52775',
            title: 'Spaghetti Carbonara',
            image: 'https://www.themealdb.com/images/media/meals/llcbn01574260722.jpg',
            category: 'Pasta',
            area: 'Italian',
            tags: ['pasta', 'italian', 'quick']
        },
        {
            id: '52776',
            title: 'Chicken Curry',
            image: 'https://www.themealdb.com/images/media/meals/wyxwsp1486979827.jpg',
            category: 'Chicken',
            area: 'Indian',
            tags: ['chicken', 'curry', 'indian']
        }
    ];
}

// ===== EXPORT FOR USE IN OTHER FILES =====
window.RecipesModule = {
    initializeRecipes,
    searchRecipesByName,
    getRecipeDetails,
    saveRecipeToCollection,
    addIngredientsToShoppingList,
    getMockRecipes
};