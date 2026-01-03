// Shopping JavaScript - Simplified version
document.addEventListener('DOMContentLoaded', function() {
    console.log('Shopping module loading...');
    
    initializeShopping();
});

function initializeShopping() {
    const recentOrders = document.getElementById('recent-orders');
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    // Mobile menu toggle
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }

    try {
        // Load recent orders
        loadRecentOrders();
        
    } catch (error) {
        console.error('Shopping initialization error:', error);
        // Fallback to local data
        loadRecentOrdersLocal();
    }

    // Initialize platform links
    initializePlatformLinks();
}

// Load recent orders from localStorage
function loadRecentOrders() {
    const recentOrdersContainer = document.getElementById('recent-orders');
    if (!recentOrdersContainer) return;
    
    const orders = JSON.parse(localStorage.getItem('mealmaestro-recent-orders')) || [];
    
    if (orders.length === 0) {
        recentOrdersContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history" style="font-size: 3rem; color: #ddd; margin-bottom: 15px;"></i>
                <p>No recent orders</p>
                <p class="text-muted">Your recent orders will appear here</p>
            </div>
        `;
        return;
    }
    
    displayRecentOrders(orders);
}

// Display recent orders
function displayRecentOrders(orders) {
    const recentOrdersContainer = document.getElementById('recent-orders');
    if (!recentOrdersContainer) return;
    
    let html = '<div class="recent-orders-grid">';
    
    orders.forEach(order => {
        const date = new Date(order.date || order.orderDate);
        const formattedDate = date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short'
        });
        
        const platform = order.platform || 'instamart';
        
        html += `
            <div class="recent-order-card">
                <div class="order-platform ${platform}" style="background-color: ${getPlatformColor(platform)}">
                    <i class="${getPlatformIcon(platform)}"></i>
                </div>
                <div class="order-details">
                    <div class="order-platform-name">${getPlatformName(platform)}</div>
                    <div class="order-meta">
                        <span>${formattedDate}</span>
                        <span>•</span>
                        <span>${order.totalItems || order.itemCount || 0} items</span>
                    </div>
                    ${order.totalAmount ? `<div style="margin-top: 5px; font-weight: 600; color: #2c3e50;">₹${order.totalAmount}</div>` : ''}
                </div>
                <a href="${getPlatformUrl(platform)}" target="_blank" class="btn btn-secondary reorder-btn">
                    <i class="fas fa-redo"></i> Reorder
                </a>
            </div>
        `;
    });
    
    html += '</div>';
    
    recentOrdersContainer.innerHTML = html;
}

// Local fallback for recent orders
function loadRecentOrdersLocal() {
    const recentOrdersContainer = document.getElementById('recent-orders');
    if (!recentOrdersContainer) return;
    
    // Mock recent orders for demo
    const mockOrders = [
        {
            platform: 'instamart',
            date: new Date().toISOString(),
            totalItems: 8,
            totalAmount: 1245
        },
        {
            platform: 'blinkit',
            date: new Date(Date.now() - 86400000).toISOString(),
            totalItems: 5,
            totalAmount: 850
        },
        {
            platform: 'zepto',
            date: new Date(Date.now() - 172800000).toISOString(),
            totalItems: 12,
            totalAmount: 2100
        }
    ];
    
    displayRecentOrders(mockOrders);
}

// Initialize platform links
function initializePlatformLinks() {
    const platformCards = document.querySelectorAll('.platform-card');
    platformCards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.classList.contains('btn')) {
                const platform = this.querySelector('.platform-name').textContent;
                const platformId = getPlatformId(platform);
                saveRecentOrder(platformId);
            }
        });
    });
}

// Save recent order when platform is clicked
function saveRecentOrder(platform) {
    const recentOrders = JSON.parse(localStorage.getItem('mealmaestro-recent-orders')) || [];
    
    const order = {
        platform: platform,
        date: new Date().toISOString(),
        totalItems: Math.floor(Math.random() * 15) + 1,
        totalAmount: Math.floor(Math.random() * 2000) + 100
    };
    
    // Add to beginning of array
    recentOrders.unshift(order);
    
    // Keep only last 5 orders
    if (recentOrders.length > 5) {
        recentOrders.pop();
    }
    
    localStorage.setItem('mealmaestro-recent-orders', JSON.stringify(recentOrders));
    
    // Update UI
    displayRecentOrders(recentOrders);
    
    // Show notification
    showNotification(`Redirecting to ${getPlatformName(platform)}...`, 'info');
}

// Helper functions
function getPlatformId(platformName) {
    const platforms = {
        'Swiggy Instamart': 'instamart',
        'Blinkit': 'blinkit',
        'Zepto': 'zepto',
        'BigBasket': 'bigbasket',
        'Amazon Fresh': 'amazon',
        'D-Mart Ready': 'dmart'
    };
    return platforms[platformName] || 'instamart';
}

function getPlatformUrl(platform) {
    const platforms = {
        instamart: 'https://www.swiggy.com/instamart',
        blinkit: 'https://blinkit.com',
        zepto: 'https://www.zepto.com',
        bigbasket: 'https://www.bigbasket.com',
        amazon: 'https://www.amazon.in/wholefoods',
        dmart: 'https://www.dmart.in'
    };
    return platforms[platform] || '#';
}

function getPlatformName(platform) {
    const platformNames = {
        instamart: 'Swiggy Instamart',
        blinkit: 'Blinkit',
        zepto: 'Zepto',
        bigbasket: 'BigBasket',
        amazon: 'Amazon Fresh',
        dmart: 'D-Mart Ready'
    };
    return platformNames[platform] || platform;
}

function getPlatformIcon(platform) {
    const platformIcons = {
        instamart: 'fas fa-shopping-basket',
        blinkit: 'fas fa-bolt',
        zepto: 'fas fa-z',
        bigbasket: 'fas fa-basket-shopping',
        amazon: 'fab fa-amazon',
        dmart: 'fas fa-store'
    };
    return platformIcons[platform] || 'fas fa-shopping-cart';
}

function getPlatformColor(platform) {
    const platformColors = {
        instamart: '#FF5A5F',
        blinkit: '#FF6B35',
        zepto: '#00B894',
        bigbasket: '#8BC34A',
        amazon: '#FF9900',
        dmart: '#E53935'
    };
    return platformColors[platform] || '#4CAF50';
}

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

// Export for use in other files
window.ShoppingModule = {
    initializeShopping,
    loadRecentOrders,
    saveRecentOrder,
    getPlatformUrl,
    getPlatformName
};