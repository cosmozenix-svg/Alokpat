import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';
import {
  Country,
  ALL_COUNTRIES,
  PRIORITY_COUNTRIES,
  OTHER_COUNTRIES,
  DEFAULT_COUNTRY,
} from '../data/countries';

export interface PhoneInputProps {
  value: string;
  onChange: (value: string, fullNumber: string, country: Country) => void;
  selectedCountry?: Country;
  onCountryChange?: (country: Country) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  helperText?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  selectedCountry: controlledCountry,
  onCountryChange,
  placeholder = 'Enter phone number',
  label,
  error,
  required = false,
  disabled = false,
  className = '',
  helperText,
}) => {
  const [internalCountry, setInternalCountry] = useState<Country>(DEFAULT_COUNTRY);
  const selectedCountry = controlledCountry || internalCountry;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or touch
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchQuery('');
        phoneInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Filter countries based on search query
  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null; // Use standard priority + alphabetical list

    return ALL_COUNTRIES.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.iso.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.code.replace('+', '').includes(q)
    );
  }, [searchQuery]);

  const handleSelectCountry = (country: Country) => {
    if (onCountryChange) {
      onCountryChange(country);
    } else {
      setInternalCountry(country);
    }
    setIsOpen(false);
    setSearchQuery('');

    // Trigger change with updated country code + existing phone digits
    const fullNumber = value.trim() ? `${country.code} ${value.trim()}` : country.code;
    onChange(value, fullNumber, country);

    // Focus phone input after selection
    phoneInputRef.current?.focus();
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Keep digits and standard phone formatting chars (spaces, hyphens)
    // Users can provide numbers consisting of any number of digits
    const sanitized = rawVal.replace(/[^\d\s-]/g, '');
    const fullNumber = sanitized.trim() ? `${selectedCountry.code} ${sanitized.trim()}` : '';
    onChange(sanitized, fullNumber, selectedCountry);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Main input wrapper */}
      <div
        className={`flex items-center rounded-lg border transition-all duration-150 bg-neutral-50 dark:bg-neutral-800 ${
          error
            ? 'border-red-500 ring-1 ring-red-500/20'
            : isOpen
            ? 'border-purple-600 ring-1 ring-purple-600/30'
            : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 focus-within:ring-1 focus-within:ring-purple-600 focus-within:border-purple-600'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {/* Country Selector Trigger */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(prev => !prev)}
          className="flex items-center gap-1.5 px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 bg-neutral-100/80 dark:bg-neutral-850 hover:bg-neutral-200/70 dark:hover:bg-neutral-750 transition-colors rounded-l-lg cursor-pointer flex-shrink-0 select-none group"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          title={`Selected: ${selectedCountry.name} (${selectedCountry.iso}) ${selectedCountry.code}`}
        >
          <span className="text-base leading-none" role="img" aria-label={selectedCountry.name}>
            {selectedCountry.flag}
          </span>
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 tracking-tight">
            {selectedCountry.iso}
          </span>
          <span className="text-xs font-mono font-medium text-neutral-600 dark:text-neutral-300">
            {selectedCountry.code}
          </span>
          <ChevronDown
            size={13}
            className={`text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Phone digits input - accepts any number of digits as requested */}
        <input
          ref={phoneInputRef}
          type="tel"
          inputMode="numeric"
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={handlePhoneInputChange}
          className="w-full px-3 py-2 bg-transparent text-xs text-neutral-900 dark:text-white font-mono placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none"
        />
      </div>

      {/* Helper text / error */}
      {error ? (
        <p className="text-[11px] text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">{helperText}</p>
      ) : null}

      {/* Custom Country Code Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 max-h-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {/* Search / Filter Input */}
          <div className="p-2 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/50">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search country, code, or ISO..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg border border-neutral-200 dark:border-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Countries List */}
          <div
            ref={listRef}
            className="overflow-y-auto max-h-64 divide-y divide-neutral-100/60 dark:divide-neutral-800/60 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700"
          >
            {filteredCountries !== null ? (
              // Search Results mode
              filteredCountries.length > 0 ? (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-850">
                    Results ({filteredCountries.length})
                  </div>
                  {filteredCountries.map(country => (
                    <CountryListItem
                      key={`${country.iso}-${country.code}`}
                      country={country}
                      isSelected={selectedCountry.iso === country.iso && selectedCountry.code === country.code}
                      onSelect={() => handleSelectCountry(country)}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
                  No countries matching "{searchQuery}"
                </div>
              )
            ) : (
              // Default View: 1. Bangladesh & India on Top Priority, 2. Alphabetical remaining countries below
              <>
                {/* 1. Top Priority Countries (Bangladesh & India) */}
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase text-purple-600 dark:text-purple-400 bg-purple-50/60 dark:bg-purple-950/30 flex items-center justify-between">
                    <span>Priority Countries</span>
                    <span className="text-[9px] font-normal opacity-75">Top of list</span>
                  </div>
                  {PRIORITY_COUNTRIES.map(country => (
                    <CountryListItem
                      key={`priority-${country.iso}`}
                      country={country}
                      isSelected={selectedCountry.iso === country.iso && selectedCountry.code === country.code}
                      onSelect={() => handleSelectCountry(country)}
                      isPriority
                    />
                  ))}
                </div>

                {/* 2. All Remaining Countries (Alphabetical A-Z) */}
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-850">
                    All Countries (A-Z)
                  </div>
                  {OTHER_COUNTRIES.map(country => (
                    <CountryListItem
                      key={`other-${country.iso}`}
                      country={country}
                      isSelected={selectedCountry.iso === country.iso && selectedCountry.code === country.code}
                      onSelect={() => handleSelectCountry(country)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface CountryListItemProps {
  country: Country;
  isSelected: boolean;
  onSelect: () => void;
  isPriority?: boolean;
}

const CountryListItem: React.FC<CountryListItemProps> = ({
  country,
  isSelected,
  onSelect,
  isPriority,
}) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors cursor-pointer group ${
        isSelected
          ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold'
          : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
      }`}
    >
      <div className="flex items-center gap-2.5 truncate">
        <span className="text-base flex-shrink-0" role="img" aria-label={country.name}>
          {country.flag}
        </span>
        <span className="truncate">
          {country.name} <span className="text-neutral-500 dark:text-neutral-400 font-normal">({country.iso})</span>
        </span>
        {isPriority && (
          <span className="text-[9px] px-1 py-0.2 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-medium">
            Top
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
        <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200">
          {country.code}
        </span>
        {isSelected && <Check size={13} className="text-purple-600 dark:text-purple-400 stroke-[2.5]" />}
      </div>
    </button>
  );
};

export default PhoneInput;
