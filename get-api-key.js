// get-api-key.js - runs on Netlify server
exports.handler = async function(event, context) {
    // Get which API key is requested
    const { service } = event.queryStringParameters;
    
    // Map service names to environment variables
    const apiKeys = {
        'google': process.env.GOOGLE_API_KEY || '',
        'shopping': process.env.SHOPPING_API_KEY || '',
        'recipes': process.env.RECIPES_API_KEY || '',
        'planning': process.env.PLANNING_API_KEY || '',
        'pantry': process.env.PANTRY_API_KEY || ''
    };
    
    // Return the requested key
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*', // Allow frontend to call
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        body: JSON.stringify({
            key: apiKeys[service] || '',
            service: service,
            success: !!apiKeys[service]
        })
    };
};