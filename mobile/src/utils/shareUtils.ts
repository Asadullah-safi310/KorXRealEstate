import { Share, Alert, Platform } from 'react-native';

/**
 * Reusable helper function to share a property to various apps via native share sheet
 * @param property The property object containing all necessary details
 */
export const shareProperty = async (property: any) => {
  try {
    if (!property) return;

    const propertyId = property.property_id || property.id;
    const title = property.title || property.property_type || 'Modern Property';
    
    // Format Price
    const isSale = property.is_available_for_sale || property.purpose === 'SALE' || property.purpose === 'BOTH';
    const rawPrice = isSale ? property.sale_price : property.rent_price;
    const formattedPrice = rawPrice 
      ? `Rs ${parseFloat(rawPrice).toLocaleString()}${!isSale ? ' / month' : ''}`
      : 'Price on Request';

    // Format Location
    const locationParts = [
      property.city,
      property.DistrictData?.name || property.district,
      property.AreaData?.name,
    ].filter(Boolean);
    
    // Remove duplicates from location parts
    const uniqueLocationParts = Array.from(new Set(locationParts));
    const locationDisplay = uniqueLocationParts.length > 0 
      ? uniqueLocationParts.join(', ') 
      : 'Location details available on link';

    // Share Link - Using project domain (production placeholder) or scheme
    // If you have a specific domain, replace 'korx.com' with it
    const webUrl = `https://korx.com/property/${propertyId}`;
    const deepLink = `korx://property/${propertyId}`;

    const message = `🏠 *${title}*\n💰 *Price:* ${formattedPrice}\n📍 *Location:* ${locationDisplay}\n\nCheck out this property on KorX:\n${webUrl}`;

    const result = await Share.share({
      message: Platform.OS === 'android' ? message : message, // On Android message includes the URL
      url: webUrl, // On iOS, URL is handled separately
      title: `Property: ${title}`,
    }, {
      // Android only:
      dialogTitle: `Share ${title}`,
      // iOS only:
      subject: `Property Listing: ${title}`,
    });

    if (result.action === Share.sharedAction) {
      // Successfully shared
    }
  } catch (error: any) {
    Alert.alert('Error', error.message || 'Failed to share property');
  }
};
