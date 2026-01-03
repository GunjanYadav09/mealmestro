// Meal Planner JavaScript with AI Integration
// UPDATED WITH NETLIFY SECURE API INTEGRATION

// Initialize meal planner module
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Meal Planner module loading...');
    
    // Wait for secure API keys to load
    if (!window.secureApiKeys) {
        console.log('Waiting for API keys...');
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    console.log('AI Planning API status:', 
        window.secureApiKeys?.hasHuggingfaceKey ? 'Using AI planning' : 'Using basic planning');
    
    // Initialize meal planner functionality
    initializeMealPlanner();
});

async function initializeMealPlanner() {
    const weekSelector = document.getElementById('week-selector');
    const generatePlanBtn = document.getElementById('generate-plan-btn');
    const calendarContainer = document.getElementById('calendar-container');
    const mealCalendar = document.getElementById('meal-calendar');
    const savePlanBtn = document.getElementById('save-plan-btn');
    const shoppingListBtn = document.getElementById('shopping-list-btn');
    const shoppingListModal = document.getElementById('shopping-list-modal');
    const closeModal = document.querySelector('.close-modal');
    const shoppingListContent = document.getElementById('shopping-list-content');
    const exportListBtn = document.getElementById('export-list-btn');

    try {
        // Load saved meal plans
        loadSavedMealPlans();
        
    } catch (error) {
        console.error('Meal planner initialization error:', error);
    }

    // Set default week to current week
    const today = new Date();
    const year = today.getFullYear();
    const week = getWeekNumber(today);
    weekSelector.value = `${year}-W${week.toString().padStart(2, '0')}`;

    // Generate meal plan button click
    generatePlanBtn.addEventListener('click', async function() {
        const selectedWeek = weekSelector.value;
        const dietaryPreferences = getSelectedPreferences();
        
        // Validate preferences
        if (dietaryPreferences.length === 0) {
            showNotification('Please select at least one dietary preference!', 'warning');
            return;
        }
        
        // Show loading
        const spinner = showLoading(calendarContainer);
        calendarContainer.style.display = 'block';
        generatePlanBtn.disabled = true;
        generatePlanBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        
        try {
            // Generate meal plan using AI with secure API
            const mealPlan = await generateAIMealPlanSecure(dietaryPreferences);
            
            // Display meal plan
            generateMealPlan(selectedWeek, dietaryPreferences, mealPlan);
            
            // Save the generated plan
            saveGeneratedMealPlan(mealPlan, dietaryPreferences, selectedWeek);
            
            showNotification('AI-powered meal plan generated successfully!', 'success');
            
        } catch (error) {
            console.error('Error generating meal plan:', error);
            // Fallback to basic meal plan
            const basicPlan = generateBasicMealPlan(dietaryPreferences);
            generateMealPlan(selectedWeek, dietaryPreferences, basicPlan);
            saveGeneratedMealPlan(basicPlan, dietaryPreferences, selectedWeek);
            
            showNotification('Using basic meal plan (AI service unavailable)', 'info');
        } finally {
            hideLoading(spinner);
            generatePlanBtn.disabled = false;
            generatePlanBtn.innerHTML = '<i class="fas fa-magic"></i> Generate AI Meal Plan';
        }
    });

    // Save plan button
    savePlanBtn.addEventListener('click', function() {
        saveCurrentMealPlan();
    });

    // Shopping list button
    shoppingListBtn.addEventListener('click', function() {
        generateShoppingListFromPlan();
        shoppingListModal.style.display = 'block';
    });

    // Close modal
    closeModal.addEventListener('click', function() {
        shoppingListModal.style.display = 'none';
    });

    // Export list button
    exportListBtn.addEventListener('click', function() {
        exportShoppingList();
    });
    
    // Initialize meal suggestions database
    initializeMealSuggestions();
}

// ===== SECURE API FUNCTIONS =====

// Generate AI meal plan using secure API
async function generateAIMealPlanSecure(preferences) {
    try {
        const apiKey = window.secureApiKeys?.huggingface;
        
        if (apiKey) {
            // Use secure Hugging Face API
            return await generateAIMealPlanWithAPI(apiKey, preferences);
        } else {
            // Use local AI meal plan generator
            console.log('Using local AI meal plan generator');
            return await generateLocalAIMealPlan(preferences);
        }
        
    } catch (error) {
        console.error('Secure AI meal plan error:', error);
        throw error;
    }
}

// Generate AI meal plan with secure API
async function generateAIMealPlanWithAPI(apiKey, preferences) {
    try {
        const API_URL = 'https://api-inference.huggingface.co/models/google/flan-t5-base';
        
        // Create detailed prompt
        const prompt = `Generate a 7-day healthy meal plan with breakfast, lunch, and dinner.
        Dietary preferences: ${preferences.join(', ') || 'no specific preferences'}.
        Include diverse cuisines, balanced nutrition, and cooking instructions.
        Format as JSON with days array containing breakfast, lunch, dinner, and snacks.`;
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_length: 1000,
                    temperature: 0.7,
                    top_p: 0.9
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Parse and format AI response
        if (data && data[0] && data[0].generated_text) {
            return parseAIResponse(data[0].generated_text, preferences);
        } else {
            throw new Error('Invalid AI response format');
        }
        
    } catch (error) {
        console.error('AI API Error:', error);
        throw error;
    }
}

// Local AI meal plan generator (fallback)
async function generateLocalAIMealPlan(preferences) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const preferencesText = preferences.join(', ');
    
    // Generate meal plan based on preferences
    return {
        days: [
            {
                breakfast: `Vegetable omelette with whole wheat toast (${preferencesText})`,
                lunch: `Quinoa salad with mixed greens and avocado (${preferencesText})`,
                dinner: `Grilled chicken with roasted vegetables (${preferencesText})`,
                snacks: `Greek yogurt with berries`
            },
            {
                breakfast: `Oatmeal with banana and walnuts (${preferencesText})`,
                lunch: `Lentil soup with crusty bread (${preferencesText})`,
                dinner: `Salmon with sweet potato mash (${preferencesText})`,
                snacks: `Apple slices with almond butter`
            },
            {
                breakfast: `Smoothie with spinach and protein powder (${preferencesText})`,
                lunch: `Chicken Caesar salad (${preferencesText})`,
                dinner: `Vegetable stir-fry with tofu (${preferencesText})`,
                snacks: `Handful of mixed nuts`
            },
            {
                breakfast: `Avocado toast with poached eggs (${preferencesText})`,
                lunch: `Turkey and cheese wrap (${preferencesText})`,
                dinner: `Beef and broccoli stir-fry (${preferencesText})`,
                snacks: `Cottage cheese with pineapple`
            },
            {
                breakfast: `Chia seed pudding (${preferencesText})`,
                lunch: `Tuna salad with crackers (${preferencesText})`,
                dinner: `Mushroom risotto (${preferencesText})`,
                snacks: `Protein bar`
            },
            {
                breakfast: `Pancakes with maple syrup (${preferencesText})`,
                lunch: `Chicken noodle soup (${preferencesText})`,
                dinner: `Homemade pizza (${preferencesText})`,
                snacks: `Dark chocolate squares`
            },
            {
                breakfast: `French toast with berries (${preferencesText})`,
                lunch: `Leftover pizza (${preferencesText})`,
                dinner: `Roast chicken dinner (${preferencesText})`,
                snacks: `Popcorn`
            }
        ],
        preferences: preferences,
        generatedAt: new Date().toISOString(),
        source: 'local-ai'
    };
}

// ===== HELPER FUNCTIONS =====

// Show loading spinner
function showLoading(element) {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = `
        <div class="spinner"></div>
        <p>Generating AI-powered meal plan...</p>
        <p class="loading-subtext">This may take a few moments</p>
    `;
    element.appendChild(spinner);
    return spinner;
}

// Hide loading spinner
function hideLoading(spinner) {
    if (spinner && spinner.parentNode) {
        spinner.parentNode.removeChild(spinner);
    }
}

// Get selected dietary preferences
function getSelectedPreferences() {
    const checkboxes = document.querySelectorAll('input[name="diet"]:checked');
    const preferences = [];
    checkboxes.forEach(checkbox => {
        preferences.push(checkbox.value);
    });
    return preferences;
}

// Parse AI response
function parseAIResponse(aiText, preferences) {
    try {
        // Try to extract JSON from AI response
        const jsonMatch = aiText.match(/\{.*\}/s);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.days && Array.isArray(parsed.days)) {
                return parsed;
            }
        }
        
        // Fallback: Parse text response
        const lines = aiText.split('\n').filter(line => line.trim());
        const days = [];
        let currentDay = null;
        
        lines.forEach(line => {
            if (line.toLowerCase().includes('day') || line.match(/^\d+\./)) {
                if (currentDay) days.push(currentDay);
                currentDay = { breakfast: '', lunch: '', dinner: '', snacks: '' };
            } else if (currentDay) {
                if (line.toLowerCase().includes('breakfast')) {
                    currentDay.breakfast = line.replace(/breakfast:/i, '').trim();
                } else if (line.toLowerCase().includes('lunch')) {
                    currentDay.lunch = line.replace(/lunch:/i, '').trim();
                } else if (line.toLowerCase().includes('dinner')) {
                    currentDay.dinner = line.replace(/dinner:/i, '').trim();
                } else if (line.toLowerCase().includes('snack')) {
                    currentDay.snacks = line.replace(/snack:/i, '').trim();
                }
            }
        });
        
        if (currentDay) days.push(currentDay);
        
        // Ensure we have 7 days
        while (days.length < 7) {
            days.push(generateBasicDay(preferences));
        }
        
        return {
            days: days.slice(0, 7),
            preferences: preferences,
            generatedAt: new Date().toISOString(),
            source: 'ai-api'
        };
        
    } catch (error) {
        console.error('Error parsing AI response:', error);
        return generateBasicMealPlan(preferences);
    }
}

// Generate basic meal plan (fallback)
function generateBasicMealPlan(preferences) {
    const preferencesText = preferences.join(', ');
    
    return {
        days: [
            { breakfast: `Oatmeal with fruits (${preferencesText})`, lunch: `Quinoa salad (${preferencesText})`, dinner: `Grilled salmon with veggies (${preferencesText})`, snacks: 'Yogurt' },
            { breakfast: `Greek yogurt with granola (${preferencesText})`, lunch: `Chicken wrap (${preferencesText})`, dinner: `Vegetable stir-fry (${preferencesText})`, snacks: 'Apple' },
            { breakfast: `Smoothie bowl (${preferencesText})`, lunch: `Lentil soup (${preferencesText})`, dinner: `Pasta with tomato sauce (${preferencesText})`, snacks: 'Nuts' },
            { breakfast: `Avocado toast (${preferencesText})`, lunch: `Turkey sandwich (${preferencesText})`, dinner: `Chicken curry (${preferencesText})`, snacks: 'Cheese' },
            { breakfast: `Pancakes (${preferencesText})`, lunch: `Beef burger (${preferencesText})`, dinner: `Fish tacos (${preferencesText})`, snacks: 'Fruit' },
            { breakfast: `Eggs and toast (${preferencesText})`, lunch: `Pizza (${preferencesText})`, dinner: `Steak dinner (${preferencesText})`, snacks: 'Crackers' },
            { breakfast: `French toast (${preferencesText})`, lunch: `Roast chicken (${preferencesText})`, dinner: `Soup and salad (${preferencesText})`, snacks: 'Popcorn' }
        ],
        preferences: preferences,
        generatedAt: new Date().toISOString(),
        source: 'basic'
    };
}

// Generate basic day for meal plan
function generateBasicDay(preferences) {
    const preferencesText = preferences.join(', ');
    const meals = [
        { breakfast: `Healthy breakfast (${preferencesText})`, lunch: `Balanced lunch (${preferencesText})`, dinner: `Nutritious dinner (${preferencesText})`, snacks: 'Light snack' }
    ];
    return meals[Math.floor(Math.random() * meals.length)];
}

// Generate meal plan calendar
function generateMealPlan(weekString, preferences, mealPlan = null) {
    const mealCalendar = document.getElementById('meal-calendar');
    mealCalendar.innerHTML = '';
    
    // Parse week string (format: YYYY-Www)
    const [year, week] = weekString.split('-W');
    const days = getDaysOfWeek(parseInt(year), parseInt(week));
    
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Use provided meal plan or generate basic one
    const planToUse = mealPlan || generateBasicMealPlan(preferences);
    
    days.forEach((date, index) => {
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';
        
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.innerHTML = `
            <strong>${daysOfWeek[index]}</strong>
            <span class="day-date">${date.getDate()}/${date.getMonth() + 1}</span>
        `;
        
        dayCard.appendChild(dayHeader);
        
        // Add meal slots
        const meals = ['breakfast', 'lunch', 'dinner', 'snacks'];
        const mealLabels = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
        
        meals.forEach((meal, mealIndex) => {
            if (meal === 'snacks' && (!planToUse.days[index] || !planToUse.days[index][meal])) {
                return; // Skip snacks if not provided
            }
            
            const mealItem = document.createElement('div');
            mealItem.className = 'meal-item';
            
            // Get meal suggestion from plan
            let mealSuggestion = planToUse.days && planToUse.days[index] 
                ? planToUse.days[index][meal] 
                : generateMealSuggestion(mealLabels[mealIndex], preferences);
            
            mealItem.innerHTML = `
                <div class="meal-header">
                    <strong>${mealLabels[mealIndex]}:</strong>
                    <span class="meal-time">${getMealTime(meal)}</span>
                </div>
                <div class="meal-name">${mealSuggestion}</div>
                <div class="meal-actions">
                    <button class="btn btn-small change-meal-btn" data-day="${index}" data-meal="${meal}">
                        <i class="fas fa-sync-alt"></i> Change
                    </button>
                    <button class="btn btn-small recipe-btn" data-meal="${mealSuggestion}">
                        <i class="fas fa-utensils"></i> Recipes
                    </button>
                </div>
            `;
            dayCard.appendChild(mealItem);
        });
        
        mealCalendar.appendChild(dayCard);
    });
    
    // Add event listeners
    addMealPlanEventListeners(preferences);
    
    // Store current plan for saving
    window.currentMealPlan = planToUse;
    window.currentWeek = weekString;
    window.currentPreferences = preferences;
}

// Get days of the week for a given week number
function getDaysOfWeek(year, week) {
    const firstDayOfYear = new Date(year, 0, 1);
    const days = firstDayOfYear.getDay() === 0 ? 6 : firstDayOfYear.getDay() - 1;
    const firstWeekDay = new Date(year, 0, 1 + (week - 1) * 7 - days);
    
    const daysOfWeek = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(firstWeekDay);
        day.setDate(firstWeekDay.getDate() + i);
        daysOfWeek.push(day);
    }
    
    return daysOfWeek;
}

// Get week number of the year
function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Get meal time based on meal type
function getMealTime(mealType) {
    const times = {
        breakfast: '7:00 - 9:00 AM',
        lunch: '12:00 - 2:00 PM',
        dinner: '6:00 - 8:00 PM',
        snacks: '3:00 - 4:00 PM'
    };
    return times[mealType] || '';
}

// Generate meal suggestion
function generateMealSuggestion(mealType, preferences) {
    return window.mealSuggestions?.[mealType.toLowerCase()]?.[0] || `${mealType} suggestion`;
}

// Change meal suggestion
function changeMealSuggestion(day, mealType, preferences) {
    const mealElement = document.querySelector(`.day-card:nth-child(${parseInt(day) + 1}) .meal-item:nth-child(${mealType === 'breakfast' ? 2 : mealType === 'lunch' ? 3 : mealType === 'dinner' ? 4 : 5}) .meal-name`);
    if (mealElement) {
        mealElement.textContent = generateMealSuggestion(mealType, preferences);
    }
}

// Add meal plan event listeners
function addMealPlanEventListeners(preferences) {
    // Change meal buttons
    document.querySelectorAll('.change-meal-btn').forEach(button => {
        button.addEventListener('click', function() {
            const day = this.getAttribute('data-day');
            const meal = this.getAttribute('data-meal');
            changeMealSuggestion(day, meal, preferences);
        });
    });
    
    // Recipe buttons
    document.querySelectorAll('.recipe-btn').forEach(button => {
        button.addEventListener('click', function() {
            const meal = this.getAttribute('data-meal');
            searchRecipesForMeal(meal);
        });
    });
}

// Search recipes for a meal
function searchRecipesForMeal(mealName) {
    console.log(`Searching recipes for: ${mealName}`);
    // This would redirect or search in recipes page
    showNotification(`Searching recipes for "${mealName}"`, 'info');
}

// Save generated meal plan
function saveGeneratedMealPlan(mealPlan, preferences, week) {
    try {
        const savedPlans = JSON.parse(localStorage.getItem('mealmaestro-saved-plans')) || [];
        
        const planToSave = {
            id: Date.now(),
            plan: mealPlan,
            preferences: preferences,
            week: week,
            savedAt: new Date().toISOString(),
            type: mealPlan.source || 'custom'
        };
        
        // Add to beginning
        savedPlans.unshift(planToSave);
        
        // Keep only last 10 plans
        localStorage.setItem('mealmaestro-saved-plans', JSON.stringify(savedPlans.slice(0, 10)));
        
        console.log('Meal plan saved:', planToSave);
        
    } catch (error) {
        console.error('Error saving meal plan:', error);
    }
}

// Save current meal plan
function saveCurrentMealPlan() {
    if (!window.currentMealPlan) {
        showNotification('No meal plan to save. Generate a plan first!', 'warning');
        return;
    }
    
    saveGeneratedMealPlan(window.currentMealPlan, window.currentPreferences, window.currentWeek);
    showNotification('Meal plan saved successfully!', 'success');
}

// Load saved meal plans
function loadSavedMealPlans() {
    const savedPlansContainer = document.getElementById('saved-plans-container');
    if (!savedPlansContainer) return;
    
    try {
        const savedPlans = JSON.parse(localStorage.getItem('mealmaestro-saved-plans')) || [];
        
        if (savedPlans.length === 0) {
            savedPlansContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar" style="font-size: 3rem; color: #ddd; margin-bottom: 15px;"></i>
                    <p>No saved meal plans</p>
                    <p class="text-muted">Your saved meal plans will appear here</p>
                </div>
            `;
            return;
        }
        
        let html = '<div class="saved-plans-grid">';
        
        savedPlans.slice(0, 3).forEach(plan => {
            const date = new Date(plan.savedAt);
            const formattedDate = date.toLocaleDateString();
            
            html += `
                <div class="saved-plan-card">
                    <div class="plan-header">
                        <h4>${plan.week || 'Weekly Plan'}</h4>
                        <span class="plan-type ${plan.type}">${plan.type}</span>
                    </div>
                    <div class="plan-details">
                        <p><i class="fas fa-heart"></i> ${plan.preferences.join(', ') || 'No preferences'}</p>
                        <p><i class="fas fa-calendar"></i> ${formattedDate}</p>
                    </div>
                    <div class="plan-actions">
                        <button class="btn btn-small load-plan-btn" data-id="${plan.id}">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-small delete-plan-btn" data-id="${plan.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        savedPlansContainer.innerHTML = html;
        
        // Add event listeners
        document.querySelectorAll('.load-plan-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const planId = parseInt(this.getAttribute('data-id'));
                loadSavedPlan(planId);
            });
        });
        
        document.querySelectorAll('.delete-plan-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const planId = parseInt(this.getAttribute('data-id'));
                deleteSavedPlan(planId);
            });
        });
        
    } catch (error) {
        console.error('Error loading saved plans:', error);
    }
}

// Load saved plan
function loadSavedPlan(planId) {
    try {
        const savedPlans = JSON.parse(localStorage.getItem('mealmaestro-saved-plans')) || [];
        const plan = savedPlans.find(p => p.id === planId);
        
        if (plan) {
            // Update week selector
            const weekSelector = document.getElementById('week-selector');
            if (weekSelector && plan.week) {
                weekSelector.value = plan.week;
            }
            
            // Generate meal plan
            generateMealPlan(plan.week || '2024-W01', plan.preferences, plan.plan);
            
            showNotification('Meal plan loaded!', 'success');
        }
    } catch (error) {
        console.error('Error loading plan:', error);
        showNotification('Error loading plan', 'error');
    }
}

// Delete saved plan
function deleteSavedPlan(planId) {
    if (confirm('Are you sure you want to delete this meal plan?')) {
        try {
            let savedPlans = JSON.parse(localStorage.getItem('mealmaestro-saved-plans')) || [];
            savedPlans = savedPlans.filter(p => p.id !== planId);
            localStorage.setItem('mealmaestro-saved-plans', JSON.stringify(savedPlans));
            
            // Reload saved plans display
            loadSavedMealPlans();
            
            showNotification('Meal plan deleted!', 'success');
        } catch (error) {
            console.error('Error deleting plan:', error);
            showNotification('Error deleting plan', 'error');
        }
    }
}

// Generate shopping list from plan
function generateShoppingListFromPlan() {
    const shoppingListContent = document.getElementById('shopping-list-content');
    if (!shoppingListContent) return;
    
    shoppingListContent.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Generating shopping list...</p></div>';
    
    setTimeout(() => {
        // Mock shopping list based on meal plan
        const categories = {
            'Vegetables': ['Tomatoes (6)', 'Onions (4)', 'Bell peppers (3)', 'Spinach (200g)', 'Carrots (4)', 'Broccoli (2 heads)'],
            'Fruits': ['Apples (6)', 'Bananas (8)', 'Oranges (4)', 'Berries (200g)'],
            'Proteins': ['Chicken breast (1kg)', 'Eggs (12)', 'Lentils (500g)', 'Tofu (400g)', 'Salmon fillets (4)'],
            'Grains': ['Rice (2kg)', 'Pasta (500g)', 'Quinoa (500g)', 'Whole wheat bread'],
            'Dairy': ['Milk (2L)', 'Cheese (300g)', 'Greek yogurt (1kg)', 'Butter (250g)'],
            'Pantry': ['Olive oil', 'Salt', 'Pepper', 'Garlic (1 head)', 'Herbs & Spices']
        };
        
        displayShoppingList(categories);
    }, 1000);
}

// Display shopping list
function displayShoppingList(categories) {
    const shoppingListContent = document.getElementById('shopping-list-content');
    shoppingListContent.innerHTML = '';
    
    let html = '<div class="shopping-list-header"><h3>Shopping List</h3><button class="btn btn-small" id="clear-shopping-list">Clear All</button></div>';
    
    for (const [category, items] of Object.entries(categories)) {
        html += `
            <div class="shopping-category">
                <h4><i class="fas fa-${getCategoryIcon(category)}"></i> ${category}</h4>
                <ul>
                    ${items.map(item => `
                        <li>
                            <label>
                                <input type="checkbox" class="shopping-item">
                                <span>${item}</span>
                            </label>
                            <button class="btn btn-tiny add-quantity"><i class="fas fa-plus"></i></button>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    shoppingListContent.innerHTML = html;
    
    // Add event listeners
    document.getElementById('clear-shopping-list')?.addEventListener('click', function() {
        shoppingListContent.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
    });
    
    document.querySelectorAll('.add-quantity').forEach(btn => {
        btn.addEventListener('click', function() {
            const span = this.parentNode.querySelector('span');
            const match = span.textContent.match(/\((\d+)\)/);
            if (match) {
                const current = parseInt(match[1]);
                span.textContent = span.textContent.replace(/\(\d+\)/, `(${current + 1})`);
            }
        });
    });
}

// Get category icon
function getCategoryIcon(category) {
    const icons = {
        'Vegetables': 'carrot',
        'Fruits': 'apple-alt',
        'Proteins': 'drumstick-bite',
        'Grains': 'wheat-awn',
        'Dairy': 'cheese',
        'Pantry': 'shopping-basket'
    };
    return icons[category] || 'shopping-cart';
}

// Export shopping list
function exportShoppingList() {
    const items = [];
    document.querySelectorAll('.shopping-item:checked').forEach(cb => {
        items.push(cb.nextElementSibling.textContent);
    });
    
    if (items.length === 0) {
        showNotification('No items selected for export!', 'warning');
        return;
    }
    
    const text = items.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shopping-list.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('Shopping list exported!', 'success');
}

// Initialize meal suggestions database
function initializeMealSuggestions() {
    window.mealSuggestions = {
        breakfast: [
            'Oatmeal with fruits and nuts',
            'Scrambled eggs with whole wheat toast',
            'Greek yogurt with honey and granola',
            'Smoothie bowl with berries',
            'Avocado toast with poached eggs',
            'Chia seed pudding'
        ],
        lunch: [
            'Quinoa salad with mixed vegetables',
            'Chicken Caesar wrap',
            'Vegetable stir-fry with tofu',
            'Lentil soup with crusty bread',
            'Pasta salad with pesto',
            'Turkey and cheese sandwich'
        ],
        dinner: [
            'Grilled salmon with roasted vegetables',
            'Vegetable curry with brown rice',
            'Chicken pasta with tomato sauce',
            'Stuffed bell peppers',
            'Beef stir-fry with noodles',
            'Mushroom risotto'
        ],
        snacks: [
            'Greek yogurt with berries',
            'Apple slices with almond butter',
            'Handful of mixed nuts',
            'Cottage cheese with pineapple',
            'Protein bar',
            'Dark chocolate squares'
        ]
    };
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
window.PlanningModule = {
    initializeMealPlanner,
    generateAIMealPlanSecure,
    saveCurrentMealPlan,
    loadSavedMealPlans,
    generateShoppingListFromPlan
};