// script for MealMaestro

// Load all API keys when page starts
document.addEventListener('DOMContentLoaded', async function() {
    // Mobile menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (window.innerWidth <= 768) {
            if (!event.target.closest('.nav-menu') && !event.target.closest('.menu-toggle') && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
            }
        }
    });
});

// Mobile menu fix for all pages
function initializeMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking a link
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeMobileMenu);

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

// TheMealDB API Functions
async function searchRecipesByName(query) {
    try {
        let apiUrl = `https://yourapikeyhere?s=${query}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error('Failed to search recipes');
        }
        
        const data = await response.json();
        return data.meals || [];
        
    } catch (error) {
        console.error('Error searching recipes:', error);
        showNotification('Error searching recipes. Please try again.', 'error');
        return [];
    }
}

// Get recipe details by ID
async function getRecipeDetails(recipeId) {
    try {
        const apiUrl = `https://your api key?i=${recipeId}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error('Failed to fetch recipe details');
        }
        
        const data = await response.json();
        return data.meals ? data.meals[0] : null;
        
    } catch (error) {
        console.error('Error fetching recipe details:', error);
        showNotification('Error loading recipe details.', 'error');
        return null;
    }
}

// Get random recipes
async function getRandomRecipes(count = 6) {
    try {
        const promises = [];
        
        for (let i = 0; i < count; i++) {
            promises.push(fetch('https://api key'));
        }
        
        const responses = await Promise.all(promises);
        const data = await Promise.all(responses.map(r => r.json()));
        
        return data.map(item => item.meals ? item.meals[0] : null).filter(meal => meal !== null);
        
    } catch (error) {
        console.error('Error fetching random recipes:', error);
        return [];
    }
}

// Show loading spinner
function showLoading(container) {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = `
        <div class="spinner"></div>
        <p>Loading...</p>
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

// Export functions for use in other files
window.MealMaestro = {
    searchRecipesByName,
    getRecipeDetails,
    getRandomRecipes,
    showLoading,
    hideLoading,
    showNotification

};
