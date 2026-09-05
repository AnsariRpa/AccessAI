/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AccessiblePlace } from '../../types';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { api } from '../../services/api';
import {
  Building,
  Search,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface PlaceDiscoveryViewProps {
  onSelectPlaceForNavigation: (placeName: string) => void;
}

export const PlaceDiscoveryView: React.FC<PlaceDiscoveryViewProps> = ({
  onSelectPlaceForNavigation,
}) => {
  const [places, setPlaces] = useState<AccessiblePlace[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlaces();
  }, []);

  const loadPlaces = async (query?: string, category?: string) => {
    setIsLoading(true);
    try {
      const data = await api.searchPlaces(query, category);
      setPlaces(data);
    } catch (e) {
      console.error('Failed to load places', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = (cat: string) => {
    setSelectedCategory(cat);
    loadPlaces(searchQuery, cat === 'all' ? undefined : cat);
  };

  const getEntranceBadge = (status: AccessiblePlace['entranceStatus']) => {
    switch (status) {
      case 'verified_accessible':
        return { label: 'Zero-Step Entry', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' };
      case 'ramp_available':
        return { label: 'Ramp Available', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' };
      case 'step_access_only':
        return { label: 'Steps at Entry', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' };
      default:
        return { label: 'Unverified Entry', color: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300' };
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPlaces(searchQuery, selectedCategory === 'all' ? undefined : selectedCategory);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    loadPlaces('', selectedCategory === 'all' ? undefined : selectedCategory);
  };

  return (
    <div id="place-discovery-container" className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Building className="w-6 h-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span>Accessible Places Ranked by Mobility Match</span>
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Ranked by entrance grade, door clearance, and accessible restroom facilities rather than generic popularity.
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value === '') {
                loadPlaces('', selectedCategory === 'all' ? undefined : selectedCategory);
              }
            }}
            placeholder="Search verified venues (e.g. library, cafe, clinic, elevator)..."
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors shrink-0"
        >
          Search
        </button>
      </form>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
        {[
          { id: 'all', label: 'All Destinations' },
          { id: 'restaurant', label: 'Restaurants & Cafés' },
          { id: 'hospital', label: 'Healthcare & Clinics' },
          { id: 'library', label: 'Public Buildings' },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleFilter(cat.id)}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Places List */}
      {isLoading ? (
        <div className="p-12 text-center text-stone-500 flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span>Matching venues against your accessibility profile...</span>
        </div>
      ) : places.length === 0 ? (
        <div className="p-10 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-center space-y-3">
          <Building className="w-8 h-8 text-stone-400 mx-auto" />
          <h3 className="font-bold text-stone-800 dark:text-stone-200">No verified accessible venues found</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            No venues matched "{searchQuery || selectedCategory}". Try searching for another keyword like "library", "clinic", or "bistro", or reset the filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              handleFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {places.map((place) => {
            const entrance = getEntranceBadge(place.entranceStatus);

            return (
              <div
                key={place.id}
                className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                        {place.name}
                      </h3>
                      <span className="text-xs text-stone-500 dark:text-stone-400">
                        {place.category} • {place.distanceKm} km away
                      </span>
                    </div>

                    {/* Match Score Badge */}
                    <div
                      className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 ${
                        place.matchScore >= 85
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                      }`}
                    >
                      {place.matchScore}% Match
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${entrance.color}`}
                    >
                      {entrance.label}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        place.restroomStatus === 'accessible'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      {place.restroomStatus === 'accessible'
                        ? 'Accessible Restroom'
                        : 'Restroom Unverified'}
                    </span>
                    <ProvenanceBadge provenance={place.provenance} size="sm" />
                  </div>

                  {/* Positive Points */}
                  <div className="space-y-1 text-xs pt-2">
                    {place.positivePoints.map((pt, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-1.5 text-stone-600 dark:text-stone-400"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </div>
                    ))}
                    {place.cautionPoints.map((cp, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-1.5 text-rose-600 dark:text-rose-400 font-medium"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{cp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectPlaceForNavigation(place.name)}
                  className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-emerald-600 hover:text-white dark:bg-stone-800 dark:hover:bg-emerald-600 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors focus-visible:ring-2 ring-emerald-500 focus-visible:outline-none"
                >
                  <span>Navigate Accessible Route</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
