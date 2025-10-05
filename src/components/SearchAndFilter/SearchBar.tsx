import React, { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  placeholder = "Suche...",
  debounceMs = 300,
  className = ""
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  // Theme colors - TODO: Integrate with theme system later
  const primaryColor = '#b87ba2'; // Rose theme primary
  const accentColor = '#735a65';  // Rose theme secondary

  // Debounced search effect
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onSearchChange(localSearchTerm);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [localSearchTerm, onSearchChange, debounceMs]);

  // Sync external changes
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value);
  };

  const handleClear = () => {
    setLocalSearchTerm('');
    onSearchChange('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className={`search-bar-container ${className}`}>
      <div 
        className="search-input-wrapper"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          border: `2px solid ${accentColor}20`,
          borderRadius: '8px',
          backgroundColor: 'white',
          transition: 'all 0.2s ease',
          minWidth: '280px',
          height: '42px'
        }}
      >
        {/* Search Icon */}
        <div 
          style={{
            padding: '0 12px',
            color: accentColor,
            display: 'flex',
            alignItems: 'center',
            fontSize: '16px'
          }}
        >
          🔍
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={localSearchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            backgroundColor: 'transparent',
            color: '#333',
            height: '100%'
          }}
          onFocus={(e) => {
            e.target.parentElement!.style.borderColor = `${primaryColor}60`;
            e.target.parentElement!.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
          }}
          onBlur={(e) => {
            e.target.parentElement!.style.borderColor = `${accentColor}20`;
            e.target.parentElement!.style.boxShadow = 'none';
          }}
        />

        {/* Clear Button */}
        {localSearchTerm && (
          <button
            onClick={handleClear}
            style={{
              padding: '0 12px',
              border: 'none',
              background: 'none',
              color: accentColor,
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              height: '100%',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = primaryColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = accentColor;
            }}
            title="Suche löschen (Esc)"
          >
            ✕
          </button>
        )}
      </div>

      {/* Search Results Counter */}
      {localSearchTerm && (
        <div 
          style={{
            fontSize: '12px',
            color: accentColor,
            marginTop: '4px',
            paddingLeft: '12px'
          }}
        >
          Suche nach: "{localSearchTerm}"
        </div>
      )}
    </div>
  );
};

export default SearchBar;