"use client";
// src/hooks/useDebouncedSearch.js
import { useState, useEffect, useCallback } from "react";

export default function useDebouncedSearch(searchValue = "", delay = 300) {
  const [debouncedTerm, setDebouncedTerm] = useState(searchValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounce effect - tracks the searchValue prop
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedTerm(searchValue);
    }, delay);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchValue, delay]);

  const reset = useCallback(() => {
    setDebouncedTerm("");
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    debouncedTerm,
    isLoading,
    error,
    setIsLoading,
    setError,
    reset,
  };
}