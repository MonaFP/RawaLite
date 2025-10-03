// Echter Database-Hook mit SQLite-Verbindung
import { useState, useEffect } from 'react';
import { usePersistence } from '../contexts/PersistenceContext';
import { useUnifiedSettings } from './useUnifiedSettings';
import type { Offer } from '../persistence/adapter';

export const useOffers = () => {
  const { adapter, ready } = usePersistence();
  const { getNextNumber } = useUnifiedSettings();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  // Load offers from database
  useEffect(() => {
    if (!ready || !adapter) return;
    
    let active = true;
    const loadOffers = async () => {
      try {
        setLoading(true);
        const data = await adapter.listOffers();
        if (active) {
          setOffers(data);
          setError(undefined);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load offers');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadOffers();
    return () => { active = false; };
  }, [ready, adapter]);

  const createOffer = async (data: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!adapter) throw new Error('Database not ready');
    
    setLoading(true);
    try {
      // Generate offer number if not provided
      const offerNumber = data.offerNumber || await getNextNumber('offers');
      
      const newOffer = await adapter.createOffer({
        ...data,
        offerNumber
      });
      
      setOffers(prev => [...prev, newOffer]);
      setError(undefined);
      return newOffer;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create offer';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateOffer = async (id: number, data: Partial<Offer>) => {
    if (!adapter) throw new Error('Database not ready');
    
    setLoading(true);
    try {
      const updatedOffer = await adapter.updateOffer(id, data);
      
      setOffers(prev => prev.map(offer => 
        offer.id === id ? updatedOffer : offer
      ));
      
      setError(undefined);
      return updatedOffer;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update offer';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteOffer = async (id: number) => {
    if (!adapter) throw new Error('Database not ready');
    
    setLoading(true);
    try {
      await adapter.deleteOffer(id);
      setOffers(prev => prev.filter(offer => offer.id !== id));
      setError(undefined);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete offer';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return { 
    offers, 
    loading, 
    error, 
    createOffer, 
    updateOffer, 
    deleteOffer 
  };
};