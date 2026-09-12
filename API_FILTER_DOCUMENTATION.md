# To-Let API Filter Documentation

## Overview
This API supports comprehensive filtering for property listings based on the mobile app filter screens. The API includes location filtering, price ranges, property types, amenities, and availability options.

## Base URL
```
/api/listings
```

## Endpoints

### 1. Get Filtered Listings
```
GET /api/listings
```

#### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `city` | string | Filter by city name | `Khulna` |
| `area` | string | Filter by area/locality | `Khulna Sadar` |
| `minPrice` | number | Minimum price filter | `10000` |
| `maxPrice` | number | Maximum price filter | `25000` |
| `category` | string | Property type | `Family`, `Bachelor`, `Seat`, `Sublet`, `Office` |
| `bedrooms` | number | Number of bedrooms | `1`, `2`, `3`, `4` (4+ means >=4) |
| `furnishing` | string | Furnishing status | `Furnished`, `Unfurnished`, `Semi` |
| `availability` | string | Availability status | `Available now`, `From next month` |
| `amenities.lift` | boolean | Has lift | `true`, `false` |
| `amenities.parking` | boolean | Has parking | `true`, `false` |
| `amenities.gasLine` | boolean | Has gas line | `true`, `false` |
| `amenities.generator` | boolean | Has generator | `true`, `false` |
| `amenities.water24_7` | boolean | 24/7 water supply | `true`, `false` |
| `amenities.wifi` | boolean | Has WiFi | `true`, `false` |
| `limit` | number | Number of results per page (1-50) | `20` |
| `offset` | number | Pagination offset | `0` |

#### Example Requests

**Basic Filter (Screen 1)**
```
GET /api/listings?city=Khulna&minPrice=10000&maxPrice=20000&category=Family&bedrooms=2
```

**Advanced Filter (Screen 2)**
```
GET /api/listings?category=Family&bedrooms=2&furnishing=Semi&amenities.generator=true&amenities.lift=true&amenities.parking=true&availability=Available%20now
```

**Combined Filters**
```
GET /api/listings?city=Khulna&minPrice=15000&maxPrice=25000&category=Bachelor&bedrooms=1&furnishing=Furnished&amenities.lift=true&amenities.parking=true&amenities.water24_7=true&availability=Available%20now&limit=10&offset=0
```

#### Response Format
```json
{
  "data": [
    {
      "id": 1,
      "title": "Beautiful 2BHK Family Apartment",
      "location": "Khulna Sadar, Khulna",
      "city": "Khulna",
      "area": "Khulna Sadar",
      "price": 18000,
      "bedrooms": 2,
      "bathrooms": 2,
      "category": "Family",
      "furnishing": "Semi",
      "availability": "Available now",
      "amenities": {
        "lift": true,
        "parking": true,
        "gasLine": true,
        "generator": false,
        "water24_7": true,
        "wifi": false
      },
      "images": ["https://example.com/image1.jpg"],
      "description": "Spacious apartment with modern amenities",
      "contact_number": "+8801234567890",
      "square_feet": 1200,
      "is_direct_owner": true,
      "owner_name": "John Doe",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "offset": 0,
    "limit": 20,
    "hasMore": true
  }
}
```

### 2. Get Filter Options
```
GET /api/listings/filters/options
```

Returns available filter options for building dynamic filter UI.

#### Response Format
```json
{
  "data": {
    "cities": ["Khulna", "Dhaka", "Chittagong"],
    "areas": ["Khulna Sadar", "Daulatpur", "Khan Jahan Ali"],
    "priceRange": {
      "min": 5000,
      "max": 50000
    },
    "propertyTypes": ["Bachelor", "Family", "Seat", "Sublet", "Office"],
    "bedrooms": [1, 2, 3, "4+"],
    "furnishing": ["Furnished", "Unfurnished", "Semi"],
    "amenities": ["generator", "lift", "parking", "gasLine", "water24_7", "wifi"],
    "availability": ["Available now", "From next month"]
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid filter parameters",
  "details": [
    {
      "field": "minPrice",
      "message": "Expected number, received string"
    }
  ]
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Frontend Integration Examples

### React/React Native Example
```javascript
// Filter state management
const [filters, setFilters] = useState({
  city: 'Khulna',
  minPrice: 10000,
  maxPrice: 25000,
  category: 'Family',
  bedrooms: 2,
  furnishing: 'Semi',
  amenities: {
    lift: true,
    parking: true,
    generator: false
  },
  availability: 'Available now'
});

// API call function
const fetchFilteredListings = async () => {
  const queryParams = new URLSearchParams();
  
  Object.keys(filters).forEach(key => {
    if (key === 'amenities') {
      Object.keys(filters.amenities).forEach(amenity => {
        if (filters.amenities[amenity]) {
          queryParams.append(`amenities.${amenity}`, 'true');
        }
      });
    } else if (filters[key]) {
      queryParams.append(key, filters[key]);
    }
  });
  
  const response = await fetch(`/api/listings?${queryParams.toString()}`);
  const data = await response.json();
  return data;
};
```

### Flutter/Dart Example
```dart
class FilterService {
  static Future<Map<String, dynamic>> getFilteredListings(Map<String, dynamic> filters) async {
    var queryParams = <String, String>{};
    
    filters.forEach((key, value) {
      if (key == 'amenities' && value is Map) {
        value.forEach((amenityKey, amenityValue) {
          if (amenityValue == true) {
            queryParams['amenities.$amenityKey'] = 'true';
          }
        });
      } else if (value != null) {
        queryParams[key] = value.toString();
      }
    });
    
    final uri = Uri.parse('/api/listings').replace(queryParameters: queryParams);
    final response = await http.get(uri);
    return json.decode(response.body);
  }
}
```

## Notes

1. **Price Range**: The price slider in the mobile app should use the `/filters/options` endpoint to get dynamic min/max values.

2. **Bedrooms 4+**: When bedrooms filter is set to 4 or more, the API will return all properties with 4+ bedrooms.

3. **Amenities**: Only set amenities parameters to `true` when the user explicitly selects them. Missing amenities parameters are ignored.

4. **Pagination**: Use `offset` and `limit` for pagination. The `hasMore` field indicates if there are more results available.

5. **Location**: The `area` parameter supports partial matching (case-insensitive), while `city` requires exact match.

6. **Performance**: Consider implementing caching on the frontend for filter options as they don't change frequently.