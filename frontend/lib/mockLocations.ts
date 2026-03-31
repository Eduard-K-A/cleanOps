// Mock locations for development
export const MOCK_LOCATIONS = [
  {
    id: 'downtown-ny',
    name: 'Downtown Manhattan',
    address: '123 Broadway, New York, 10001',
    lat: 40.7128,
    lng: -74.0060,
    description: 'Busy commercial district'
  },
  {
    id: 'brooklyn-heights',
    name: 'Brooklyn Heights',
    address: '456 Montague St, Brooklyn, 11201',
    lat: 40.6950,
    lng: -73.9950,
    description: 'Residential area with great views'
  },
  {
    id: 'queens-center',
    name: 'Queens Center',
    address: '789 Queens Blvd, Queens, 11375',
    lat: 40.7282,
    lng: -73.7949,
    description: 'Suburban shopping district'
  },
  {
    id: 'bronx-park',
    name: 'Bronx Park Area',
    address: '321 Grand Concourse, Bronx, 10451',
    lat: 40.8448,
    lng: -73.8648,
    description: 'Quiet residential neighborhood'
  },
  {
    id: 'staten-island',
    name: 'Staten Island Mall',
    address: '1650 Richmond Ave, Staten Island, 10314',
    lat: 40.5795,
    lng: -74.1502,
    description: 'Shopping and residential area'
  }
];

export function getRandomLocation() {
  return MOCK_LOCATIONS[Math.floor(Math.random() * MOCK_LOCATIONS.length)];
}

export function getLocationById(id: string) {
  return MOCK_LOCATIONS.find(loc => loc.id === id);
}

export function getAllLocations() {
  return MOCK_LOCATIONS;
}

// Generate mock coordinates for any user address
export function generateMockCoordinates(address: string): { lat: number; lng: number } {
  // Create a simple hash from the address string
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    const char = address.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert hash to coordinates within NYC area bounds
  const baseLat = 40.7128; // NYC center latitude
  const baseLng = -74.0060; // NYC center longitude
  const latRange = 0.3; // ~33km range
  const lngRange = 0.4; // ~44km range
  
  // Use hash to generate consistent coordinates
  const latOffset = ((hash % 1000) / 1000) * latRange - latRange / 2;
  const lngOffset = (((hash / 1000) % 1000) / 1000) * lngRange - lngRange / 2;
  
  return {
    lat: baseLat + latOffset,
    lng: baseLng + lngOffset
  };
}

// Validate address format: "Street Address, City, ZIP" or "City, ZIP"
export function validateAddressFormat(address: string): { isValid: boolean; error?: string } {
  if (!address || address.trim().length === 0) {
    return { isValid: false, error: 'Address is required' };
  }
  
  return { isValid: true };
}
