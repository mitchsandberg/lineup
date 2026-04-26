import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { TvosTabBar } from '@/constants/theme';
import { MarketInfo } from '@/lib/types';
import { fetchMarkets } from '@/lib/api';

interface MarketPickerProps {
  selectedMarkets: string[];
  onToggle: (marketId: string) => void;
  onClear: () => void;
  compact?: boolean;
}

export function MarketPicker({ selectedMarkets, onToggle, onClear, compact }: MarketPickerProps) {
  const [markets, setMarkets] = useState<MarketInfo[]>([]);
  const [search, setSearch] = useState('');
  /** iOS/phone: actual TextInput focus. */
  const [searchFocused, setSearchFocused] = useState(false);
  /**
   * tvOS: D-pad *UIFocus* is on the wrapper Pressable; RN TextInput onFocus only fires on
   * `textInputDidBeginEditing` (editing/keyboard), so it never tracks the white TV highlight.
   */
  const [searchShellTvFocused, setSearchShellTvFocused] = useState(false);
  const marketSearchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    fetchMarkets().then(setMarkets);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return markets;
    const q = search.toLowerCase();
    return markets.filter((m) => m.label.toLowerCase().includes(q));
  }, [markets, search]);

  const chipSize = compact
    ? { paddingHorizontal: 14, paddingVertical: 8 }
    : { paddingHorizontal: 18, paddingVertical: 10 };
  const fontSize = compact ? 14 : 16;
  // tvOS/ATV: selection styling alone is invisible when moving focus; always show a clear focus ring.
  const isTv = Platform.isTV;
  const showFocus = isTv;
  const inputH = compact ? 38 : 44;
  const tvFieldActive = searchShellTvFocused || searchFocused;
  /**
   * Unfocused: dim on elevated dark (`#1A1F2E`), like tab labels on the bar.
   * Focused: app navy fill + **white** type (chips/None), *not* the system gray/white text field.
   */
  const tvTextColor = tvFieldActive
    ? TvosTabBar.labelOnBarSelected
    : TvosTabBar.labelDim;
  /** Empty: placeholder comes from backing `Text`; TextInput is transparent. */
  const tvInputColor = search.trim() === '' ? 'transparent' : tvTextColor;

  return (
    <View>
      {isTv ? (
        <Pressable
          onPress={() => {
            marketSearchInputRef.current?.focus();
          }}
          onFocus={() => setSearchShellTvFocused(true)}
          onBlur={() => setSearchShellTvFocused(false)}
          style={[
            styles.searchInput,
            { height: inputH, marginBottom: 12 },
            compact && { height: 38 },
            !tvFieldActive && styles.searchInputTvUnfocused,
            tvFieldActive && styles.searchInputTvFocused,
          ]}
        >
          {search.trim() === '' && (
            <View
              style={[styles.searchPlaceholderBack, { height: inputH }]}
              pointerEvents="none"
              collapsable={false}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.searchPlaceholderText,
                  { color: tvTextColor, fontSize: compact ? 14 : 16 },
                ]}
              >
                Search markets...
              </Text>
            </View>
          )}
          <TextInput
            ref={marketSearchInputRef}
            testID="market-search"
            focusable={false}
            style={[
              styles.searchFieldTv,
              {
                height: inputH,
                minHeight: inputH,
                color: tvInputColor,
              },
              compact && { fontSize: 14, height: 38, minHeight: 38 },
            ]}
            placeholder=""
            value={search}
            onChangeText={setSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            selectionColor={searchFocused ? TvosTabBar.labelOnBarSelected : undefined}
          />
        </Pressable>
      ) : (
        <TextInput
          testID="market-search"
          style={[
            styles.searchInput,
            { height: inputH, marginBottom: 12, paddingHorizontal: 14 },
            compact && { fontSize: 14, height: 38 },
            searchFocused && styles.searchInputFocused,
            // Web: the browser’s default `:focus` outline layers a blue ring *inside* our
            // 3px white border; kill it so only the RN border shows.
            Platform.OS === 'web' && ({ outlineStyle: 'none' } as object),
          ]}
          placeholder="Search markets..."
          placeholderTextColor="#6B7688"
          value={search}
          onChangeText={setSearch}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      )}

      <Pressable
        testID="market-none"
        onPress={onClear}
        style={({ focused }) => [
          styles.chip,
          chipSize,
          selectedMarkets.length === 0 && styles.chipSelected,
          showFocus && focused && styles.chipFocused,
        ]}
      >
        <Text style={[styles.chipText, { fontSize }]}>
          {selectedMarkets.length === 0 ? '✓ ' : ''}None
        </Text>
      </Pressable>

      <View style={styles.grid}>
        {filtered.map((market) => {
          const isSelected = selectedMarkets.includes(market.id);
          return (
            <Pressable
              key={market.id}
              testID={`market-${market.id}`}
              onPress={() => onToggle(market.id)}
              style={({ focused }) => [
                styles.chip,
                chipSize,
                isSelected && styles.chipSelected,
                showFocus && focused && styles.chipFocused,
              ]}
            >
              <Text style={[styles.chipText, { fontSize }]}>
                {isSelected ? '✓ ' : ''}{market.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    backgroundColor: '#1A1F2E',
    color: '#FFFFFF',
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#2D3548',
    overflow: 'hidden',
  },
  /** TV: always above backing placeholder so focus engine targets this view, not a sibling on top. */
  searchFieldTv: {
    width: '100%',
    zIndex: 1,
    paddingHorizontal: 14,
    borderWidth: 0,
    backgroundColor: 'transparent',
    fontSize: 16,
  },
  searchPlaceholderBack: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  searchPlaceholderText: {
    fontWeight: '500',
  },
  searchInputTvUnfocused: {
    borderWidth: 0,
    backgroundColor: '#1A1F2E',
  },
  searchInputTvFocused: {
    /** Match focused chips/None: elevated navy fill with the same white focus ring. */
    backgroundColor: '#1A1F2E',
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  searchInputFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    backgroundColor: '#1A1F2E',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2D3548',
    marginBottom: 4,
  },
  chipSelected: {
    backgroundColor: '#1A3A5C',
    borderColor: '#5CAAFF',
  },
  chipFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  chipText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
