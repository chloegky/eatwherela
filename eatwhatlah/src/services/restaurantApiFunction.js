export function getRestaurantDetails(restaurantName) {
    return new Promise((resolve, reject) => {
        // Create a map element (required but can be hidden)
        const map = new google.maps.Map(document.createElement('div'));
        
        // Create PlacesService instance
        const service = new google.maps.places.PlacesService(map);
        
        // Search for the restaurant using Text Search
        const request = {
            query: restaurantName,
            type: 'restaurant'
        };
        
        service.textSearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
                // Get the first result's place_id
                const placeId = results[0].place_id;
                
                // Request detailed information
                const detailsRequest = {
                    placeId: placeId,
                    fields: [
                        'name',
                        'formatted_address',
                        'formatted_phone_number',
                        'opening_hours',
                        'rating',
                        'user_ratings_total',
                        'price_level',
                        'photos',
                        'website',
                        'geometry',
                        'reviews'
                    ]
                };
                
                service.getDetails(detailsRequest, (place, detailStatus) => {
                    if (detailStatus === google.maps.places.PlacesServiceStatus.OK) {
                        resolve(place);
                    } else {
                        reject(new Error(`Failed to get details: ${detailStatus}`));
                    }
                });
            } else {
                reject(new Error(`No results found: ${status}`));
            }
        });
    });
}
