import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  SafeAreaView,
  Alert
} from 'react-native';

// API Base URL - change this to your server URL
const API_BASE_URL = 'https://to-let-api.vercel.app/api';

const FilterScreen = ({ navigation, route }) => {
  // Filter state matching the API schema
  const [filters, setFilters] = useState({
    city: 'Khulna',
    area: '',
    minPrice: 1000,
    maxPrice: 100000,
    category: '',
    bedrooms: '',
    furnishing: '',
    availability: 'Available now',
    amenities: {
      lift: false,
      parking: false,
      gasLine: false,
      generator: false,
      water24_7: false,
      wifi: false
    }
  });

  // Filter options from API
  const [filterOptions, setFilterOptions] = useState({
    cities: [],
    areas: [],
    priceRange: { min: 0, max: 100000 },
    propertyTypes: [],
    bedrooms: [],
    furnishing: [],
    amenities: [],
    availability: []
  });

  const [loading, setLoading] = useState(false);
  const [showScreen, setShowScreen] = useState(1); // 1 or 2 for different screens

  // Fetch filter options on component mount
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/listings/filters/options`);
      const result = await response.json();
      
      if (response.ok) {
        setFilterOptions(result.data);
        // Set initial price range from API
        setFilters(prev => ({
          ...prev,
          minPrice: result.data.priceRange.min,
          maxPrice: result.data.priceRange.max
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load filter options');
      console.error('Filter options error:', error);
    }
  };

  const applyFilters = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (key === 'amenities') {
          Object.keys(filters.amenities).forEach(amenity => {
            if (filters.amenities[amenity]) {
              queryParams.append(`amenities.${amenity}`, 'true');
            }
          });
        } else if (filters[key] && filters[key] !== '') {
          queryParams.append(key, filters[key].toString());
        }
      });

      const response = await fetch(`${API_BASE_URL}/listings?${queryParams.toString()}`);
      const result = await response.json();
      
      if (response.ok) {
        // Navigate to results screen with filtered data
        navigation.navigate('ListingsResult', { 
          listings: result.data, 
          pagination: result.pagination,
          appliedFilters: filters 
        });
      } else {
        Alert.alert('Error', result.error || 'Failed to fetch listings');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
      console.error('Filter error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      city: 'Khulna',
      area: '',
      minPrice: filterOptions.priceRange.min,
      maxPrice: filterOptions.priceRange.max,
      category: '',
      bedrooms: '',
      furnishing: '',
      availability: 'Available now',
      amenities: {
        lift: false,
        parking: false,
        gasLine: false,
        generator: false,
        water24_7: false,
        wifi: false
      }
    });
  };

  // Screen 1 - Basic Filters
  const renderScreen1 = () => (
    <ScrollView style={styles.container}>
      <SafeAreaView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Filter - Bangladesh</Text>
        </View>

        {/* Location Filter */}
        <View style={styles.filterSection}>
          <TouchableOpacity style={styles.locationChip}>
            <Text style={styles.locationText}>📍 {filters.city}, Bangladesh</Text>
            <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, city: '' }))}>
              <Text style={styles.removeButton}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Price Range */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Price Range</Text>
          <View style={styles.priceRow}>
            <View style={styles.priceInput}>
              <Text style={styles.priceLabel}>MIN PRICE</Text>
              <TextInput
                style={styles.priceTextInput}
                value={filters.minPrice.toString()}
                onChangeText={(text) => setFilters(prev => ({ 
                  ...prev, 
                  minPrice: parseInt(text) || 0 
                }))}
                keyboardType="numeric"
                placeholder="10000"
              />
            </View>
            <Text style={styles.priceSeparator}>-</Text>
            <View style={styles.priceInput}>
              <Text style={styles.priceLabel}>MAX PRICE</Text>
              <TextInput
                style={styles.priceTextInput}
                value={filters.maxPrice.toString()}
                onChangeText={(text) => setFilters(prev => ({ 
                  ...prev, 
                  maxPrice: parseInt(text) || 100000 
                }))}
                keyboardType="numeric"
                placeholder="20000"
              />
            </View>
          </View>
          {/* Price Range Display */}
          <View style={styles.priceRangeDisplay}>
            <Text>৳{filters.minPrice.toLocaleString()}</Text>
            <Text>৳{filters.maxPrice.toLocaleString()}</Text>
          </View>
        </View>

        {/* Property Type */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Property Type</Text>
          <View style={styles.buttonRow}>
            {['Family', 'Bachelor'].map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.propertyButton,
                  filters.category === type && styles.selectedButton
                ]}
                onPress={() => setFilters(prev => ({ 
                  ...prev, 
                  category: prev.category === type ? '' : type 
                }))}
              >
                <Text style={[
                  styles.buttonText,
                  filters.category === type && styles.selectedButtonText
                ]}>
                  {type === 'Family' ? '👨‍👩‍👧‍👦' : '👤'} {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.buttonRow}>
            {['Sublet', 'Seat'].map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.propertyButton,
                  filters.category === type && styles.selectedButton
                ]}
                onPress={() => setFilters(prev => ({ 
                  ...prev, 
                  category: prev.category === type ? '' : type 
                }))}
              >
                <Text style={[
                  styles.buttonText,
                  filters.category === type && styles.selectedButtonText
                ]}>
                  📋 {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bedrooms */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Bedrooms</Text>
          <View style={styles.buttonRow}>
            {[1, 2, 3, '4+'].map(bedroom => (
              <TouchableOpacity
                key={bedroom}
                style={[
                  styles.bedroomButton,
                  filters.bedrooms === bedroom && styles.selectedButton
                ]}
                onPress={() => setFilters(prev => ({ 
                  ...prev, 
                  bedrooms: prev.bedrooms === bedroom ? '' : bedroom 
                }))}
              >
                <Text style={[
                  styles.buttonText,
                  filters.bedrooms === bedroom && styles.selectedButtonText
                ]}>
                  {bedroom}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.showResultsButton} onPress={() => setShowScreen(2)}>
            <Text style={styles.showResultsButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScrollView>
  );

  // Screen 2 - Advanced Filters
  const renderScreen2 = () => (
    <ScrollView style={styles.container}>
      <SafeAreaView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowScreen(1)}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Filter - Bangladesh</Text>
        </View>

        {/* Property Type (repeated for Screen 2) */}
        <View style={styles.filterSection}>
          <View style={styles.buttonRow}>
            {['Family', 'Bachelor'].map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.propertyButton,
                  filters.category === type && styles.selectedButton
                ]}
                onPress={() => setFilters(prev => ({ 
                  ...prev, 
                  category: prev.category === type ? '' : type 
                }))}
              >
                <Text style={[
                  styles.buttonText,
                  filters.category === type && styles.selectedButtonText
                ]}>
                  {type === 'Family' ? '👨‍👩‍👧‍👦' : '👤'} {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.buttonRow}>
            {['Sublet', 'Seat'].map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.propertyButton,
                  filters.category === type && styles.selectedButton
                ]}
                onPress={() => setFilters(prev => ({ 
                  ...prev, 
                  category: prev.category === type ? '' : type 
                }))}
              >
                <Text style={[
                  styles.buttonText,
                  filters.category === type && styles.selectedButtonText
                ]}>
                  📋 {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bedrooms (repeated) */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Bedrooms</Text>
          <View style={styles.buttonRow}>
            {[1, 2, 3, '4+'].map(bedroom => (
              <TouchableOpacity
                key={bedroom}
                style={[
                  styles.bedroomButton,
                  filters.bedrooms === bedroom && styles.selectedButton
                ]}
                onPress={() => setFilters(prev => ({ 
                  ...prev, 
                  bedrooms: prev.bedrooms === bedroom ? '' : bedroom 
                }))}
              >
                <Text style={[
                  styles.buttonText,
                  filters.bedrooms === bedroom && styles.selectedButtonText
                ]}>
                  {bedroom}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Furnishing */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Furnishing</Text>
          <View style={styles.buttonRow}>
            {['Furnished', 'Unfurnished', 'Semi'].map(furnish => (
              <TouchableOpacity
                key={furnish}
                style={[
                  styles.furnishButton,
                  filters.furnishing === furnish && styles.selectedButton
                ]}
                onPress={() => setFilters(prev => ({ 
                  ...prev, 
                  furnishing: prev.furnishing === furnish ? '' : furnish 
                }))}
              >
                <Text style={[
                  styles.buttonText,
                  filters.furnishing === furnish && styles.selectedButtonText
                ]}>
                  {furnish}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Amenities */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {[
              { key: 'generator', label: 'Generator', icon: '⚡' },
              { key: 'lift', label: 'Lift', icon: '🛗' },
              { key: 'parking', label: 'Parking', icon: '🅿️' },
              { key: 'gasLine', label: 'Gas', icon: '🔥' },
              { key: 'water24_7', label: 'Water 24/7', icon: '💧' }
            ].map(amenity => (
              <TouchableOpacity
                key={amenity.key}
                style={[
                  styles.amenityButton,
                  filters.amenities[amenity.key] && styles.selectedButton
                ]}
                onPress={() => setFilters(prev => ({
                  ...prev,
                  amenities: {
                    ...prev.amenities,
                    [amenity.key]: !prev.amenities[amenity.key]
                  }
                }))}
              >
                <Text style={[
                  styles.buttonText,
                  filters.amenities[amenity.key] && styles.selectedButtonText
                ]}>
                  {amenity.icon} {amenity.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Availability */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.buttonRow}>
            {['Available now', 'From next month'].map(avail => (
              <TouchableOpacity
                key={avail}
                style={[
                  styles.availabilityButton,
                  filters.availability === avail && styles.selectedButton
                ]}
                onPress={() => setFilters(prev => ({ 
                  ...prev, 
                  availability: prev.availability === avail ? '' : avail 
                }))}
              >
                <Text style={[
                  styles.buttonText,
                  filters.availability === avail && styles.selectedButtonText
                ]}>
                  {avail}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.showResultsButton} 
            onPress={applyFilters}
            disabled={loading}
          >
            <Text style={styles.showResultsButtonText}>
              {loading ? 'Loading...' : 'Show Results'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScrollView>
  );

  return showScreen === 1 ? renderScreen1() : renderScreen2();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    fontSize: 24,
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  locationText: {
    color: 'white',
    marginRight: 8,
  },
  removeButton: {
    color: 'white',
    fontSize: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceInput: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  priceTextInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  priceSeparator: {
    marginHorizontal: 16,
    fontSize: 16,
  },
  priceRangeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  propertyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  bedroomButton: {
    width: 50,
    height: 50,
    backgroundColor: 'white',
    borderRadius: 25,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  furnishButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  availabilityButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#E85A4F',
  },
  buttonText: {
    fontSize: 14,
    color: '#333',
  },
  selectedButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 20,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#333',
  },
  showResultsButton: {
    flex: 2,
    paddingVertical: 12,
    backgroundColor: '#E85A4F',
    borderRadius: 8,
    alignItems: 'center',
  },
  showResultsButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});

export default FilterScreen;