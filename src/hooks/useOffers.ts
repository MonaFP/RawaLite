import { useState } from 'react';
import type { Offer } from '../persistence/adapter';

const initialOffer: Offer = {
  id: 1,
  offerNumber: 'A-2024-001',
  customerId: 1,
  title: 'Mock Offer',
  status: 'draft',
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  lineItems: [],
  subtotal: 1000,
  vatRate: 19,
  vatAmount: 190,
  total: 1190,
  notes: 'Mock offer notes',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const useOffers = () => {
  const [offers, setOffers] = useState<Offer[]>([initialOffer]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const createOffer = async (data: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    try {
      const newOffer: Offer = {
        ...data,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setOffers(prev => [...prev, newOffer]);
      setError(undefined);
      return newOffer;
    } catch (err) {
      setError('Failed to create offer');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateOffer = async (id: number, data: Partial<Offer>) => {
    setLoading(true);
    try {
      const updatedOffer = { ...data, id, updatedAt: new Date().toISOString() };
      
      setOffers(prev => prev.map(offer => 
        offer.id === id 
          ? { ...offer, ...updatedOffer }
          : offer
      ));
      
      const offer = offers.find(o => o.id === id);
      if (!offer) throw new Error('Offer not found');
      
      const result = { ...offer, ...updatedOffer };
      setError(undefined);
      return result;
    } catch (err) {
      setError('Failed to update offer');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteOffer = async (id: number) => {
    setLoading(true);
    try {
      setOffers(prev => prev.filter(offer => offer.id !== id));
      setError(undefined);
    } catch (err) {
      setError('Failed to delete offer');
      throw err;
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