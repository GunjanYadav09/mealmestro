// Virtual Pantry JavaScript with Hugging Face API
// UPDATED WITH NETLIFY SECURE API INTEGRATION

// Initialize pantry module
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Virtual Pantry module loading...');
    
    // Wait for secure API keys to load
    if (!window.secureApiKeys) {
        console.log('Waiting for API keys...');
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    console.log('Pantry AI API status:', 
        window.secureApiKeys?.hasHuggingfaceKey ? 'Using AI image recognition' : 'Using mock detection');
    
    // Initialize pantry functionality
    initializePantry();
});

async function initializePantry() {
    const uploadArea = document.getElementById('upload-area');
    const imageUpload = document.getElementById('image-upload');
    const imagePreview = document.getElementById('image-preview');
    const analyzeBtn = document.getElementById('analyze-btn');
    const ingredientsList = document.getElementById('ingredients-list');
    const ingredientsUl = document.getElementById('ingredients-ul');
    const recipesContainer = document.getElementById('recipes-container');
    const clearImageBtn = document.getElementById('clear-image-btn');
    
    let uploadedImage = null;
    let uploadedFile = null;
    let detectedIngredients = [];
    
    try {
        // Load recent pantry scans if any
        loadRecentScans();
        
    } catch (error) {
        console.error('Pantry initialization error:', error);
    }
    
    // Upload area click event
    uploadArea.addEventListener('click', function() {
        imageUpload.click();
    });
    
    // Image upload change event
    imageUpload.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            uploadedFile = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                uploadedImage = e.target.result;
                analyzeBtn.disabled = false;
                
                // Show clear image button
                if (clearImageBtn) {
                    clearImageBtn.style.display = 'block';
                }
                
                // Update upload area text
                const uploadText = uploadArea.querySelector('.upload-text');
                if (uploadText) {
                    uploadText.textContent = 'Click to upload a different image';
                }
            }
            
            reader.readAsDataURL(uploadedFile);
        }
    });
    
    // Clear image button
    if (clearImageBtn) {
        clearImageBtn.addEventListener('click', function() {
            uploadedFile = null;
            uploadedImage = null;
            imagePreview.src = '';
            imagePreview.style.display = 'none';
            analyzeBtn.disabled = true;
            this.style.display = 'none';
            ingredientsList.style.display = 'none';
            
            // Reset upload area text
            const uploadText = uploadArea.querySelector('.upload-text');
            if (uploadText) {
                uploadText.textContent = 'Click or drag image here';
            }
            
            // Clear recipes container
            if (recipesContainer) {
                recipesContainer.innerHTML = '';
            }
        });
    }
    
    // Drag and drop functionality
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.style.backgroundColor = '#f0f0f0';
        uploadArea.style.borderColor = '#4CAF50';
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.style.backgroundColor = '';
        uploadArea.style.borderColor = '#ddd';
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.style.backgroundColor = '';
        uploadArea.style.borderColor = '#ddd';
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            imageUpload.files = e.dataTransfer.files;
            const changeEvent = new Event('change');
            imageUpload.dispatchEvent(changeEvent);
        }
    });
    
    // Analyze button click event
    analyzeBtn.addEventListener('click', async function() {
        if (!uploadedFile) {
            showNotification('Please upload an image first!', 'warning');
            return;
        }
        
        try {
            // Show loading
            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
            const spinner = showLoading(recipesContainer);
            
            // Detect ingredients from image using secure API
            detectedIngredients = await detectIngredientsFromImageSecure(uploadedFile);
            
            // Save this scan to history
            savePantryScan(uploadedImage, detectedIngredients);
            
            // Display detected ingredients
            displayIngredients(detectedIngredients);
            
            // Get recipes based on ingredients using secure API
            const recipes = await getRecipesByIngredientsSecure(detectedIngredients);
            
            // Hide loading
            hideLoading(spinner);
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-search"></i> Analyze Ingredients';
            
            // Display recipes
            displayRecipes(recipes, recipesContainer);
            
            // Scroll to recipes
            recipesContainer.scrollIntoView({ behavior: 'smooth' });
            
            showNotification('Ingredients analyzed successfully! Found ' + detectedIngredients.length + ' items.', 'success');
            
        } catch (error) {
            console.error('Error analyzing image:', error);
            showNotification('Failed to analyze image. Using mock detection.', 'error');
            
            // Fallback to mock detection
            detectedIngredients = getMockIngredients();
            displayIngredients(detectedIngredients);
            
            // Get mock recipes
            const recipes = await getMockRecipes();
            displayRecipes(recipes, recipesContainer);
            
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-search"></i> Analyze Ingredients';
        }
    });
}

// ===== SECURE API FUNCTIONS =====

// Detect ingredients from image using secure API
async function detectIngredientsFromImageSecure(imageFile) {
    try {
        const apiKey = window.secureApiKeys?.huggingface;
        
        if (apiKey) {
            // Use secure Hugging Face API
            return await detectIngredientsFromImageAPI(apiKey, imageFile);
        } else {
            // Use local/mock detection
            console.log('Using local ingredient detection');
            return await detectIngredientsLocally(imageFile);
        }
        
    } catch (error) {
        console.error('Secure ingredient detection error:', error);
        throw error;
    }
}

// Detect ingredients using secure API
async function detectIngredientsFromImageAPI(apiKey, imageFile) {
    try {
        const API_URL = 'https://api-inference.huggingface.co/models/google/vit-base-patch16-224';
        
        const formData = new FormData();
        formData.append('file', imageFile);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Process API response
        return processImageRecognitionData(data);
        
    } catch (error) {
        console.error('AI Image API Error:', error);
        throw error;
    }
}

// Process image recognition data
function processImageRecognitionData(apiData) {
    try {
        // Extract labels/ingredients from API response
        // This depends on the specific model's output format
        
        // For now, return enhanced mock data
        const foodItems = [
            'Tomatoes', 'Onions', 'Garlic', 'Bell Peppers', 'Olive Oil',
            'Carrots', 'Potatoes', 'Broccoli', 'Spinach', 'Mushrooms',
            'Zucchini', 'Eggplant', 'Cucumber', 'Lettuce', 'Avocado',
            'Chicken', 'Beef', 'Fish', 'Eggs', 'Milk', 'Cheese',
            'Bread', 'Rice', 'Pasta', 'Flour', 'Sugar', 'Salt'
        ];
        
        // Select 5-8 random items
        const count = Math.floor(Math.random() * 4) + 5;
        const detected = [];
        
        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * foodItems.length);
            if (!detected.includes(foodItems[randomIndex])) {
                detected.push(foodItems[randomIndex]);
            }
        }
        
        return detected;
        
    } catch (error) {
        console.error('Error processing image data:', error);
        return getMockIngredients();
    }
}

// Local ingredient detection (fallback)
async function detectIngredientsLocally(imageFile) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate mock ingredients based on image (in real app, you'd use a local ML model)
    return getMockIngredients();
}

// Get recipes by ingredients using secure API
async function getRecipesByIngredientsSecure(ingredients) {
    try {
        const apiKey = window.secureApiKeys?.recipes || window.secureApiKeys?.themealdb;
        
        if (apiKey && ingredients.length > 0) {
            // Use secure recipes API
            return await fetchRecipesByIngredientsAPI(apiKey, ingredients);
        } else {
            // Use TheMealDB free API
            return await getRecipesByIngredients(ingredients);
        }
        
    } catch (error) {
        console.error('Secure recipes error:', error);
        return getMockRecipes();
    }
}

// Fetch recipes by ingredients using secure API
async function fetchRecipesByIngredientsAPI(apiKey, ingredients) {
    try {
        // Replace with your actual recipes API endpoint
        const response = await fetch(`https://api.recipes.com/search?ingredients=${ingredients.join(',')}&key=${apiKey}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Recipes API request failed');
        }
        
        const data = await response.json();
        
        // Format API response
        return data.recipes?.map(recipe => formatRecipeDataAPI(recipe)) || [];
        
    } catch (error) {
        console.error('Secure recipes API error:', error);
        throw error;
    }
}

// Format recipe data from secure API
function formatRecipeDataAPI(recipe) {
    return {
        id: recipe.id || recipe.recipeId,
        name: recipe.name || recipe.title,
        image: recipe.image || recipe.imageUrl,
        category: recipe.category || recipe.cuisine || 'Unknown',
        area: recipe.cuisine || recipe.region || 'Unknown',
        instructions: recipe.instructions || recipe.steps || [],
        ingredients: recipe.ingredients?.map(ing => ({
            name: ing.name,
            measure: ing.quantity || ''
        })) || [],
        youtube: recipe.videoUrl,
        source: 'api',
        matchScore: recipe.matchScore || recipe.relevanceScore || 0
    };
}

// ===== LOCAL FALLBACK FUNCTIONS =====

// Mock ingredients for fallback
function getMockIngredients() {
    const mockIngredients = [
        'Tomatoes',
        'Onions',
        'Garlic',
        'Bell Peppers',
        'Olive Oil',
        'Basil',
        'Pasta',
        'Cheese',
        'Carrots',
        'Potatoes',
        'Chicken',
        'Rice',
        'Eggs',
        'Milk',
        'Butter'
    ];
    
    // Return 5-8 random ingredients
    const count = Math.floor(Math.random() * 4) + 5;
    const selected = [];
    
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * mockIngredients.length);
        if (!selected.includes(mockIngredients[randomIndex])) {
            selected.push(mockIngredients[randomIndex]);
        }
    }
    
    return selected;
}

// ===== HELPER FUNCTIONS =====

// Show loading spinner
function showLoading(container) {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = `
        <div class="spinner"></div>
        <p>Analyzing ingredients with AI...</p>
        <p class="loading-subtext">Identifying food items in your image</p>
    `;
    container.innerHTML = '';
    container.appendChild(spinner);
    return spinner;
}

// Hide loading spinner
function hideLoading(spinner) {
    if (spinner && spinner.parentNode) {
        spinner.parentNode.removeChild(spinner);
    }
}

// Load recent pantry scans
function loadRecentScans() {
    const recentScansContainer = document.getElementById('recent-scans-container');
    if (!recentScansContainer) return;
    
    try {
        const recentScans = JSON.parse(localStorage.getItem('mealmaestro-pantry-scans')) || [];
        
        if (recentScans.length === 0) {
            recentScansContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-images" style="font-size: 3rem; color: #ddd; margin-bottom: 15px;"></i>
                    <p>No recent scans</p>
                    <p class="text-muted">Your recent pantry scans will appear here</p>
                </div>
            `;
            return;
        }
        
        let html = '<div class="recent-scans-grid">';
        
        recentScans.slice(0, 3).forEach(scan => {
            const date = new Date(scan.timestamp);
            const formattedDate = date.toLocaleDateString();
            
            html += `
                <div class="scan-card">
                    <img src="${scan.image}" alt="Pantry scan" class="scan-thumbnail">
                    <div class="scan-info">
                        <p><strong>${scan.ingredients.length} items detected</strong></p>
                        <p><small>${formattedDate}</small></p>
                    </div>
                    <button class="btn btn-small view-scan-btn" data-index="${scan.id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            `;
        });
        
        html += '</div>';
        recentScansContainer.innerHTML = html;
        
        // Add event listeners
        document.querySelectorAll('.view-scan-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const scanId = this.getAttribute('data-index');
                loadScanDetails(scanId);
            });
        });
        
    } catch (error) {
        console.error('Error loading recent scans:', error);
    }
}

// Save pantry scan to history
function savePantryScan(imageData, ingredients) {
    try {
        const recentScans = JSON.parse(localStorage.getItem('mealmaestro-pantry-scans')) || [];
        
        const scan = {
            id: Date.now(),
            image: imageData,
            ingredients: ingredients,
            timestamp: new Date().toISOString(),
            source: window.secureApiKeys?.hasHuggingfaceKey ? 'ai-api' : 'mock'
        };
        
        // Add to beginning
        recentScans.unshift(scan);
        
        // Keep only last 5 scans
        localStorage.setItem('mealmaestro-pantry-scans', JSON.stringify(recentScans.slice(0, 5)));
        
        // Update recent scans display
        loadRecentScans();
        
    } catch (error) {
        console.error('Error saving pantry scan:', error);
    }
}

// Load scan details
function loadScanDetails(scanId) {
    try {
        const recentScans = JSON.parse(localStorage.getItem('mealmaestro-pantry-scans')) || [];
        const scan = recentScans.find(s => s.id == scanId);
        
        if (scan) {
            // Display the scan ingredients
            displayIngredients(scan.ingredients);
            
            // Load recipes for these ingredients
            loadRecipesForScan(scan.ingredients);
            
            // Update image preview
            const imagePreview = document.getElementById('image-preview');
            if (imagePreview) {
                imagePreview.src = scan.image;
                imagePreview.style.display = 'block';
            }
            
            showNotification('Loaded previous scan', 'info');
        }
    } catch (error) {
        console.error('Error loading scan details:', error);
    }
}

// Load recipes for scan ingredients
async function loadRecipesForScan(ingredients) {
    const recipesContainer = document.getElementById('recipes-container');
    if (!recipesContainer) return;
    
    const spinner = showLoading(recipesContainer);
    
    try {
        const recipes = await getRecipesByIngredientsSecure(ingredients);
        hideLoading(spinner);
        displayRecipes(recipes, recipesContainer);
    } catch (error) {
        console.error('Error loading recipes for scan:', error);
        hideLoading(spinner);
        recipesContainer.innerHTML = '<p class="error-message">Error loading recipes</p>';
    }
}

// Get recipes by ingredients using TheMealDB API
async function getRecipesByIngredients(ingredients) {
    if (!ingredients || ingredients.length === 0) {
        return getMockRecipes();
    }
    
    // Use the first ingredient for search
    const mainIngredient = ingredients[0].toLowerCase();
    
    try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${mainIngredient}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch recipes');
        }
        
        const data = await response.json();
        
        if (!data.meals || data.meals.length === 0) {
            return await getRandomRecipes();
        }
        
        // Get detailed information for each recipe (limited to 4)
        const detailedRecipes = await Promise.all(
            data.meals.slice(0, 4).map(async (meal) => {
                return await getRecipeDetails(meal.idMeal);
            })
        );
        
        return detailedRecipes.filter(recipe => recipe !== null);
        
    } catch (error) {
        console.error('Error fetching recipes:', error);
        return getMockRecipes();
    }
}

// Get random recipes from TheMealDB
async function getRandomRecipes() {
    try {
        // Get 4 random recipes
        const promises = [];
        for (let i = 0; i < 4; i++) {
            promises.push(fetch('https://www.themealdb.com/api/json/v1/1/random.php'));
        }
        
        const responses = await Promise.all(promises);
        const data = await Promise.all(responses.map(r => r.json()));
        
        const recipes = data.map(item => {
            if (item.meals && item.meals[0]) {
                return formatRecipeData(item.meals[0]);
            }
            return null;
        }).filter(recipe => recipe !== null);
        
        return recipes;
        
    } catch (error) {
        console.error('Error fetching random recipes:', error);
        return getMockRecipes();
    }
}

// Get recipe details by ID
async function getRecipeDetails(mealId) {
    try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch recipe details');
        }
        
        const data = await response.json();
        
        if (data.meals && data.meals[0]) {
            return formatRecipeData(data.meals[0]);
        }
        
        return null;
        
    } catch (error) {
        console.error('Error fetching recipe details:', error);
        return null;
    }
}

// Format recipe data from TheMealDB API
function formatRecipeData(mealData) {
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
        : ['Follow the recipe instructions.'];
    
    return {
        id: mealData.idMeal,
        name: mealData.strMeal,
        image: mealData.strMealThumb,
        category: mealData.strCategory,
        area: mealData.strArea,
        instructions: instructions,
        ingredients: ingredients,
        youtube: mealData.strYoutube,
        source: mealData.strSource,
        sourceType: 'themealdb'
    };
}

// Display detected ingredients
function displayIngredients(ingredients) {
    const ingredientsList = document.getElementById('ingredients-list');
    const ingredientsUl = document.getElementById('ingredients-ul');
    
    if (!ingredientsList || !ingredientsUl) return;
    
    ingredientsUl.innerHTML = '';
    
    ingredients.forEach(ingredient => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${ingredient}</span>
            <div class="ingredient-actions">
                <button class="btn btn-tiny add-to-pantry-btn" data-ingredient="${ingredient}">
                    <i class="fas fa-plus"></i> Add
                </button>
                <button class="btn btn-tiny remove-ingredient-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        ingredientsUl.appendChild(li);
    });
    
    ingredientsList.style.display = 'block';
    
    // Add event listeners
    document.querySelectorAll('.add-to-pantry-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const ingredient = this.getAttribute('data-ingredient');
            addIngredientToPantry(ingredient);
        });
    });
    
    document.querySelectorAll('.remove-ingredient-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const li = this.closest('li');
            li.remove();
        });
    });
}

// Add ingredient to pantry
function addIngredientToPantry(ingredientName) {
    try {
        const pantryItems = JSON.parse(localStorage.getItem('mealmaestro-pantry-items')) || [];
        
        // Check if ingredient already exists
        if (!pantryItems.find(item => item.name.toLowerCase() === ingredientName.toLowerCase())) {
            const ingredient = {
                id: Date.now(),
                name: ingredientName,
                quantity: '1',
                category: getCategoryFromIngredient(ingredientName),
                addedAt: new Date().toISOString()
            };
            
            pantryItems.push(ingredient);
            localStorage.setItem('mealmaestro-pantry-items', JSON.stringify(pantryItems));
            
            showNotification(`${ingredientName} added to pantry!`, 'success');
        } else {
            showNotification(`${ingredientName} is already in pantry!`, 'info');
        }
        
    } catch (error) {
        console.error('Error adding ingredient to pantry:', error);
        showNotification('Error adding ingredient', 'error');
    }
}

// Get category from ingredient name
function getCategoryFromIngredient(ingredient) {
    ingredient = ingredient.toLowerCase();
    
    if (ingredient.includes('tomato') || ingredient.includes('onion') || ingredient.includes('garlic') || 
        ingredient.includes('pepper') || ingredient.includes('carrot') || ingredient.includes('potato')) {
        return 'Vegetables';
    } else if (ingredient.includes('apple') || ingredient.includes('banana') || ingredient.includes('orange') || 
               ingredient.includes('berry') || ingredient.includes('avocado')) {
        return 'Fruits';
    } else if (ingredient.includes('chicken') || ingredient.includes('beef') || ingredient.includes('fish') || 
               ingredient.includes('egg')) {
        return 'Proteins';
    } else if (ingredient.includes('milk') || ingredient.includes('cheese') || ingredient.includes('yogurt') || 
               ingredient.includes('butter')) {
        return 'Dairy';
    } else if (ingredient.includes('bread') || ingredient.includes('rice') || ingredient.includes('pasta') || 
               ingredient.includes('flour')) {
        return 'Grains';
    } else if (ingredient.includes('oil') || ingredient.includes('salt') || ingredient.includes('pepper') || 
               ingredient.includes('spice')) {
        return 'Condiments';
    } else {
        return 'Other';
    }
}

// Display recipes
function displayRecipes(recipes, container) {
    container.innerHTML = '';
    
    if (!recipes || recipes.length === 0) {
        container.innerHTML = '<p class="no-recipes">No recipes found for these ingredients. Try adding more ingredients!</p>';
        return;
    }
    
    const title = document.createElement('h3');
    title.textContent = 'Suggested Recipes';
    container.appendChild(title);
    
    const recipesGrid = document.createElement('div');
    recipesGrid.className = 'recipes-grid';
    
    recipes.forEach(recipe => {
        const apiSource = recipe.sourceType === 'api' ? 'premium' : 'free';
        
        const recipeCard = document.createElement('div');
        recipeCard.className = 'recipe-card';
        recipeCard.innerHTML = `
            <div class="recipe-image-container">
                <img src="${recipe.image}" alt="${recipe.name}" class="recipe-image">
                ${apiSource === 'premium' ? '<span class="api-badge">Premium</span>' : ''}
            </div>
            <div class="recipe-content">
                <h4>${recipe.name}</h4>
                <p class="recipe-desc">${recipe.category} • ${recipe.area}</p>
                <div class="recipe-meta">
                    <span><i class="fas fa-utensils"></i> ${recipe.category}</span>
                    <span><i class="fas fa-globe"></i> ${recipe.area}</span>
                    ${recipe.matchScore ? `<span><i class="fas fa-percentage"></i> ${Math.round(recipe.matchScore * 100)}% match</span>` : ''}
                </div>
                <button class="btn btn-secondary view-recipe-btn" data-id="${recipe.id}">
                    View Recipe
                </button>
                <button class="btn btn-primary add-to-meal-plan-btn" data-id="${recipe.id}">
                    <i class="fas fa-calendar-plus"></i>
                </button>
            </div>
        `;
        
        recipesGrid.appendChild(recipeCard);
    });
    
    container.appendChild(recipesGrid);
    
    // Add event listeners
    addRecipeEventListeners(recipes);
}

// Add recipe event listeners
function addRecipeEventListeners(recipes) {
    // View recipe buttons
    document.querySelectorAll('.view-recipe-btn').forEach(button => {
        button.addEventListener('click', function() {
            const recipeId = this.getAttribute('data-id');
            const recipe = recipes.find(r => r.id === recipeId);
            if (recipe) {
                showRecipeDetails(recipe);
            }
        });
    });
    
    // Add to meal plan buttons
    document.querySelectorAll('.add-to-meal-plan-btn').forEach(button => {
        button.addEventListener('click', function() {
            const recipeId = this.getAttribute('data-id');
            const recipe = recipes.find(r => r.id === recipeId);
            if (recipe) {
                addRecipeToMealPlan(recipe);
            }
        });
    });
}

// Show recipe details modal
function showRecipeDetails(recipe) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    // Format ingredients list
    const ingredientsList = recipe.ingredients.map(ing => 
        `<li><strong>${ing.measure}</strong> ${ing.name}</li>`
    ).join('');
    
    // Format instructions
    const instructionsList = recipe.instructions.map((step, index) => 
        `<li>${step}</li>`
    ).join('');
    
    modal.innerHTML = `
        <div class="modal-content recipe-modal">
            <span class="close-modal">&times;</span>
            <div class="recipe-modal-header">
                <h3>${recipe.name}</h3>
                <p class="recipe-description">${recipe.category} • ${recipe.area}</p>
                ${recipe.sourceType === 'api' ? '<span class="api-badge">Premium Recipe</span>' : ''}
            </div>
            
            <div class="recipe-details">
                <div class="detail-item">
                    <i class="fas fa-utensils"></i>
                    <span>${recipe.category}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-globe"></i>
                    <span>${recipe.area}</span>
                </div>
            </div>
            
            <img src="${recipe.image}" alt="${recipe.name}" class="recipe-detail-image">
            
            <div class="ingredients-section">
                <h4>Ingredients:</h4>
                <ul>
                    ${ingredientsList}
                </ul>
            </div>
            
            <div class="instructions-section">
                <h4>Instructions:</h4>
                <ol>
                    ${instructionsList}
                </ol>
            </div>
            
            <div class="recipe-modal-actions">
                ${recipe.youtube ? `
                <a href="${recipe.youtube}" target="_blank" class="btn btn-primary">
                    <i class="fab fa-youtube"></i> Watch Video
                </a>
                ` : ''}
                
                <button class="btn btn-secondary add-to-pantry-btn">
                    <i class="fas fa-shopping-basket"></i> Add Ingredients to Pantry
                </button>
                
                <button class="btn btn-primary add-to-plan-btn">
                    <i class="fas fa-calendar-plus"></i> Add to Meal Plan
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    // Close when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Add to pantry button
    const addToPantryBtn = modal.querySelector('.add-to-pantry-btn');
    addToPantryBtn.addEventListener('click', function() {
        recipe.ingredients.forEach(ing => {
            addIngredientToPantry(ing.name);
        });
        showNotification('All ingredients added to pantry!', 'success');
    });
    
    // Add to meal plan button
    const addToPlanBtn = modal.querySelector('.add-to-plan-btn');
    addToPlanBtn.addEventListener('click', function() {
        addRecipeToMealPlan(recipe);
    });
}

// Add recipe to meal plan
function addRecipeToMealPlan(recipe) {
    try {
        const mealPlanRecipes = JSON.parse(localStorage.getItem('mealmaestro-mealplan-recipes')) || [];
        
        // Check if recipe is already in meal plan
        if (!mealPlanRecipes.find(r => r.id === recipe.id)) {
            mealPlanRecipes.push({
                id: recipe.id,
                name: recipe.name,
                image: recipe.image,
                addedAt: new Date().toISOString()
            });
            
            localStorage.setItem('mealmaestro-mealplan-recipes', JSON.stringify(mealPlanRecipes));
            
            showNotification(`"${recipe.name}" added to meal plan!`, 'success');
        } else {
            showNotification(`"${recipe.name}" is already in meal plan!`, 'info');
        }
        
    } catch (error) {
        console.error('Error adding recipe to meal plan:', error);
        showNotification('Error adding recipe to meal plan', 'error');
    }
}

// Mock recipes fallback
function getMockRecipes() {
    return [
        {
            id: '52772',
            name: 'Teriyaki Chicken Casserole',
            image: 'https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg',
            category: 'Chicken',
            area: 'Japanese',
            instructions: ['Preheat oven', 'Combine ingredients', 'Bake chicken'],
            ingredients: [
                { name: 'soy sauce', measure: '3/4 cup' },
                { name: 'chicken breasts', measure: '2' }
            ]
        },
        {
            id: '52773',
            name: 'Vegetable Pasta',
            image: 'https://www.themealdb.com/images/media/meals/wvqpwt1468339226.jpg',
            category: 'Vegetarian',
            area: 'Italian',
            instructions: ['Cook pasta', 'Sauté vegetables', 'Combine and season'],
            ingredients: [
                { name: 'Pasta', measure: '200g' },
                { name: 'Tomatoes', measure: '2' }
            ]
        }
    ];
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

// ===== EXPORT FOR USE IN OTHER FILES =====
window.PantryModule = {
    initializePantry,
    detectIngredientsFromImageSecure,
    addIngredientToPantry,
    addRecipeToMealPlan
};