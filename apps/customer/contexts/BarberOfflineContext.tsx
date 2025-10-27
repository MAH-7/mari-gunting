import React, { createContext, useContext, useState, ReactNode } from 'react';

interface BarberOfflineContextType {
  isOfflineModalVisible: boolean;
  barberName: string | null;
  showBarberOfflineModal: (barberName: string) => void;
  hideBarberOfflineModal: () => void;
}

const BarberOfflineContext = createContext<BarberOfflineContextType | undefined>(undefined);

export function BarberOfflineProvider({ children }: { children: ReactNode }) {
  const [isOfflineModalVisible, setIsOfflineModalVisible] = useState(false);
  const [barberName, setBarberName] = useState<string | null>(null);

  const showBarberOfflineModal = (name: string) => {
    console.log('🚨 Global: Showing barber offline modal for:', name);
    setBarberName(name);
    setIsOfflineModalVisible(true);
  };

  const hideBarberOfflineModal = () => {
    console.log('✅ Global: Hiding barber offline modal');
    setIsOfflineModalVisible(false);
    setBarberName(null);
  };

  return (
    <BarberOfflineContext.Provider
      value={{
        isOfflineModalVisible,
        barberName,
        showBarberOfflineModal,
        hideBarberOfflineModal,
      }}
    >
      {children}
    </BarberOfflineContext.Provider>
  );
}

export function useBarberOffline() {
  const context = useContext(BarberOfflineContext);
  if (!context) {
    throw new Error('useBarberOffline must be used within BarberOfflineProvider');
  }
  return context;
}
