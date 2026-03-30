"use client";
// src/hooks/useDebouncedSearch.js
import { useState, useEffect, useCallback } from "react";

export default function useDebouncedSearch(initialValue = "", delay = 300) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [debouncedTerm, setDebouncedTerm] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounce effect
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm, delay]);

  // Reset error when search term changes
  useEffect(() => {
    if (error && searchTerm !== initialValue) {
      setError(null);
    }
  }, [searchTerm, error, initialValue]);

  const setSearch = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const reset = useCallback(() => {
    setSearchTerm(initialValue);
    setDebouncedTerm(initialValue);
    setIsLoading(false);
    setError(null);
  }, [initialValue]);

  return {
    searchTerm,
    debouncedTerm,
    isLoading,
    error,
    setSearch,
    setIsLoading,
    setError,
    reset,
  };
}