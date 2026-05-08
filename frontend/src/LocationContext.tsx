import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/services/api';

interface Location {
  id: string;
  _id?: string;
  name: string;
  address: string;
  addressUrl?: string;
  phone?: string;
  hours?: string;
  image?: string;
  status: 'Active' | 'Inactive';
}

interface LocationContextType {
  locations: Location[];
  currentLocation: Location | null;
  setCurrentLocation: (location: Location | null) => void;
  isLoading: boolean;
  refreshLocations: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshLocations = async () => {
    try {
      const response = await api.get('/locations');
      setLocations(response.data);
      
      // If no location is selected, pick the first active one
      if (!currentLocation && response.data.length > 0) {
        const active = response.data.find((l: Location) => l.status === 'Active');
        if (active) {
          setCurrentLocation(active);
          localStorage.setItem('selectedLocationId', active.id || active._id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedLocationId = localStorage.getItem('selectedLocationId');
    
    const init = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/locations');
        setLocations(response.data);
        
        if (savedLocationId) {
          const saved = response.data.find((l: Location) => (l.id || l._id) === savedLocationId);
          if (saved) {
            setCurrentLocation(saved);
          } else if (response.data.length > 0) {
            const active = response.data.find((l: Location) => l.status === 'Active') || response.data[0];
            setCurrentLocation(active);
          }
        } else if (response.data.length > 0) {
          const active = response.data.find((l: Location) => l.status === 'Active') || response.data[0];
          setCurrentLocation(active);
        }
      } catch (error) {
        console.error('Failed to initialize locations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const handleSetCurrentLocation = (location: Location | null) => {
    setCurrentLocation(location);
    if (location) {
      localStorage.setItem('selectedLocationId', location.id || location._id!);
    } else {
      localStorage.removeItem('selectedLocationId');
    }
  };

  return (
    <LocationContext.Provider value={{ 
      locations, 
      currentLocation, 
      setCurrentLocation: handleSetCurrentLocation, 
      isLoading,
      refreshLocations 
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
