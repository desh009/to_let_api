import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Switch
} from 'react-native';
import * as ImagePicker from 'expo-image-picker'; // Install: expo install expo-image-picker

const API_BASE_URL = 'http://localhost:3000/api';

const PostListingScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Form state matching the Post Listing screens
  const [formData, setFormData] = useState({
    images: [], // Array of image URIs or URLs
    title: '',
    location: '',
    category: 'Bachelor', // Bachelor, Family, Seat, Sublet
    price: '',
    bedrooms: 2,
    bathrooms: 2,
    description: '',
    amenities: {
      lift: false,
      parking: false,
      gasLine: false,
      wifi: false
    },
    isDirectOwner: true // "No brokerage • Direct owner" checkbox
  });

  // Image picker handler
  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: true, // We need base64 for API upload
      });

      if (!result.canceled) {
        const newImages = result.assets.map(asset => ({
          uri: asset.uri,
          base64: asset.base64
        }));

        const totalImages = formData.images.length + newImages.length;

        if (totalImages > 8) {
          Alert.alert('Limit Exceeded', 'Maximum 3 photos allowed (shown as 0/8 in design, but let\'s use 8 as max).');
          return;
        }

        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...newImages]
        }));
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick images.');
    }
  };

  // Remove image
  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Upload images to server
  const uploadImages = async () => {
    if (formData.images.length === 0) {
      return [];
    }

    setUploadingImages(true);
    try {
      const base64Images = formData.images.map(img => 
        `data:image/jpeg;base64,${img.base64}`
      );

      const response = await fetch(`${API_BASE_URL}/upload/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${route.params?.authToken}` // Pass from auth
        },
        body: JSON.stringify({ images: base64Images })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Image upload failed');
      }

      return result.data.urls;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setUploadingImages(false);
    }
  };

  // Submit listing
  const handleSubmit = async () => {
    // Validation
    if (formData.images.length === 0) {
      Alert.alert('Validation Error', 'Please add at least 1 photo (Min 3 shown in design).');
      return;
    }

    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for your property.');
      return;
    }

    if (!formData.location.trim()) {
      Alert.alert('Validation Error', 'Please enter the location.');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid monthly rent.');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Upload images
      const uploadedImageUrls = await uploadImages();

      // Step 2: Create listing with uploaded image URLs
      const listingData = {
        title: formData.title,
        location: formData.location,
        category: formData.category,
        price: parseFloat(formData.price),
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        description: formData.description,
        images: uploadedImageUrls,
        amenities: formData.amenities,
        isDirectOwner: formData.isDirectOwner,
        contactNumber: route.params?.userPhone || '+8801XXXXXXXXX' // From user profile
      };

      const response = await fetch(`${API_BASE_URL}/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${route.params?.authToken}`
        },
        body: JSON.stringify(listingData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create listing');
      }

      // Show success message
      Alert.alert(
        'Success!',
        'Listing will be reviewed and live within 2 hours',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );

    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', error.message || 'Failed to publish listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Post Listing</Text>
          <TouchableOpacity>
            <Text style={styles.menuButton}>⋯</Text>
          </TouchableOpacity>
        </View>

        {/* Property Photos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              PROPERTY PHOTOS • {formData.images.length}/8
            </Text>
            <Text style={styles.minPhotos}>Min 3 photos</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.imageContainer}>
              {/* Add Photo Button */}
              <TouchableOpacity 
                style={styles.addPhotoButton} 
                onPress={pickImages}
                disabled={formData.images.length >= 8}
              >
                <Text style={styles.addPhotoIcon}>+</Text>
                <Text style={styles.addPhotoText}>Add photo</Text>
              </TouchableOpacity>

              {/* Display selected images */}
              {formData.images.map((image, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri: image.uri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Text style={styles.removeImageText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>TITLE</Text>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(text) => updateFormData('title', text)}
            placeholder="e.g. Beautiful 2BHK Apartment"
            placeholderTextColor="#999"
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.label}>LOCATION</Text>
          <View style={styles.locationInput}>
            <Text style={styles.locationIcon}>📍</Text>
            <TextInput
              style={styles.locationTextInput}
              value={formData.location}
              onChangeText={(text) => updateFormData('location', text)}
              placeholder="Enter location"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Tenant Type */}
        <View style={styles.section}>
          <Text style={styles.label}>TENANT TYPE</Text>
          <View style={styles.buttonRow}>
            {['Bachelor', 'Family', 'Seat', 'Sublet'].map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.tenantButton,
                  formData.category === type && styles.selectedButton
                ]}
                onPress={() => updateFormData('category', type)}
              >
                <Text style={[
                  styles.buttonText,
                  formData.category === type && styles.selectedButtonText
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Monthly Rent */}
        <View style={styles.section}>
          <Text style={styles.label}>MONTHLY RENT</Text>
          <View style={styles.priceInput}>
            <Text style={styles.currencyIcon}>৳</Text>
            <TextInput
              style={styles.priceTextInput}
              value={formData.price}
              onChangeText={(text) => updateFormData('price', text)}
              placeholder="0"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            <Text style={styles.perMonth}>/month</Text>
          </View>
        </View>

        {/* Bedrooms & Bathrooms */}
        <View style={styles.row}>
          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>BEDROOMS</Text>
            <View style={styles.counter}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => updateFormData('bedrooms', Math.max(0, formData.bedrooms - 1))}
              >
                <Text style={styles.counterButtonText}>−</Text>
              </TouchableOpacity>
              <View style={styles.counterValue}>
                <Text style={styles.counterNumber}>{formData.bedrooms}</Text>
                <Text style={styles.counterLabel}>BHK</Text>
              </View>
              <TouchableOpacity
                style={styles.counterButtonDark}
                onPress={() => updateFormData('bedrooms', formData.bedrooms + 1)}
              >
                <Text style={styles.counterButtonTextWhite}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>BATHROOMS</Text>
            <View style={styles.counter}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => updateFormData('bathrooms', Math.max(0, formData.bathrooms - 1))}
              >
                <Text style={styles.counterButtonText}>−</Text>
              </TouchableOpacity>
              <View style={styles.counterValue}>
                <Text style={styles.counterNumber}>{formData.bathrooms}</Text>
                <Text style={styles.counterLabel}>Bath</Text>
              </View>
              <TouchableOpacity
                style={styles.counterButtonDark}
                onPress={() => updateFormData('bathrooms', formData.bathrooms + 1)}
              >
                <Text style={styles.counterButtonTextWhite}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Description (Screen 2) */}
        <View style={styles.section}>
          <Text style={styles.label}>DESCRIPTION</Text>
          <TextInput
            style={styles.textArea}
            value={formData.description}
            onChangeText={(text) => updateFormData('description', text)}
            placeholder="Describe your property in detail..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Amenities (Screen 2) */}
        <View style={styles.section}>
          <Text style={styles.label}>AMENITIES</Text>
          
          <View style={styles.amenityRow}>
            <Text style={styles.amenityLabel}>Lift</Text>
            <Switch
              value={formData.amenities.lift}
              onValueChange={(value) => 
                setFormData(prev => ({
                  ...prev,
                  amenities: { ...prev.amenities, lift: value }
                }))
              }
              trackColor={{ false: '#ddd', true: '#E85A4F' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.amenityRow}>
            <Text style={styles.amenityLabel}>Parking</Text>
            <Switch
              value={formData.amenities.parking}
              onValueChange={(value) => 
                setFormData(prev => ({
                  ...prev,
                  amenities: { ...prev.amenities, parking: value }
                }))
              }
              trackColor={{ false: '#ddd', true: '#E85A4F' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.amenityRow}>
            <Text style={styles.amenityLabel}>Gas Line</Text>
            <Switch
              value={formData.amenities.gasLine}
              onValueChange={(value) => 
                setFormData(prev => ({
                  ...prev,
                  amenities: { ...prev.amenities, gasLine: value }
                }))
              }
              trackColor={{ false: '#ddd', true: '#E85A4F' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.amenityRow}>
            <Text style={styles.amenityLabel}>Wi-Fi Included</Text>
            <Switch
              value={formData.amenities.wifi}
              onValueChange={(value) => 
                setFormData(prev => ({
                  ...prev,
                  amenities: { ...prev.amenities, wifi: value }
                }))
              }
              trackColor={{ false: '#ddd', true: '#E85A4F' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Direct Owner Checkbox */}
        <TouchableOpacity 
          style={styles.checkboxRow}
          onPress={() => updateFormData('isDirectOwner', !formData.isDirectOwner)}
        >
          <View style={[styles.checkbox, formData.isDirectOwner && styles.checkboxChecked]}>
            {formData.isDirectOwner && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>No brokerage • Direct owner</Text>
        </TouchableOpacity>

        {/* Publish Button */}
        <TouchableOpacity
          style={[styles.publishButton, loading && styles.publishButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading || uploadingImages}
        >
          {loading || uploadingImages ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.publishButtonText}>Publish Listing</Text>
              <Text style={styles.publishArrow}>→</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.reviewNote}>
          Listing will be reviewed and live within 2 hours
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  backButton: {
    fontSize: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  menuButton: {
    fontSize: 24,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  minPhotos: {
    fontSize: 12,
    color: '#999',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  imageContainer: {
    flexDirection: 'row',
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addPhotoIcon: {
    fontSize: 32,
    color: '#999',
  },
  addPhotoText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  locationIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  locationTextInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tenantButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  selectedButton: {
    backgroundColor: '#333',
  },
  buttonText: {
    fontSize: 14,
    color: '#333',
  },
  selectedButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencyIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  priceTextInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  perMonth: {
    fontSize: 14,
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    flex: 1,
    marginHorizontal: 6,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterButton: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonDark: {
    width: 40,
    height: 40,
    backgroundColor: '#333',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: {
    fontSize: 24,
    color: '#333',
  },
  counterButtonTextWhite: {
    fontSize: 24,
    color: '#fff',
  },
  counterValue: {
    alignItems: 'center',
  },
  counterNumber: {
    fontSize: 24,
    fontWeight: '600',
  },
  counterLabel: {
    fontSize: 12,
    color: '#666',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  amenityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  amenityLabel: {
    fontSize: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#333',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
  },
  publishButton: {
    backgroundColor: '#E85A4F',
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  publishButtonDisabled: {
    opacity: 0.6,
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  publishArrow: {
    color: '#fff',
    fontSize: 18,
  },
  reviewNote: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 12,
  },
});

export default PostListingScreen;
