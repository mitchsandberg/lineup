import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { TvosTabBar } from '@/constants/theme';
import { fetchTeams } from '@/lib/api';
import {
  normalizeLegacyFavoriteTeamIds,
  sameFavoriteIdSet,
} from '@/lib/favorite-team-ids';
import { TeamInfo } from '@/lib/types';
import { SPORT_FILTERS } from '@/lib/constants';

interface TeamPickerProps {
  selectedTeams: string[];
  onToggle: (teamId: string) => void;
  /** When server returns `sport:espnId` and storage still has raw ids, rewrites and persists */
  onFavoritesMigrated?: (teamIds: string[]) => void;
  selectedSports?: string[];
  onToggleSport?: (sport: string) => void;
  compact?: boolean;
  preferInitialFocus?: boolean;
}

const ALL_SPORTS = SPORT_FILTERS.filter((f) => f.id !== 'all');

export function TeamPicker({
  selectedTeams,
  onToggle,
  onFavoritesMigrated,
  selectedSports,
  onToggleSport,
  compact,
  preferInitialFocus,
}: TeamPickerProps) {
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLeague, setExpandedLeague] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { width, height } = useWindowDimensions();
  const isMobile = width < 600;
  const isLandscapeMobile = Platform.OS === 'web' && width > height && height < 500;
  const isCompact = isMobile || isLandscapeMobile || compact;
  /** iOS/phone: actual TextInput focus. */
  const [searchFocused, setSearchFocused] = useState(false);
  /**
   * tvOS: `TextInput.onFocus` fires on `textInputDidBeginEditing` (keyboard), not UIFocus.
   * Put UIFocus on the wrapper Pressable so the field recolors with the D-pad highlight.
   */
  const [searchShellTvFocused, setSearchShellTvFocused] = useState(false);
  const teamSearchInputRef = useRef<TextInput>(null);
  const isTv = Platform.isTV;
  const showFocus = isTv;
  const tvFieldActive = searchShellTvFocused || searchFocused;
  /** Same logic as `MarketPicker`: dim on the dark bar; white on the focused surface. */
  const tvTextColor = tvFieldActive
    ? TvosTabBar.labelOnBarSelected
    : TvosTabBar.labelDim;
  const tvInputColor = search.trim() === '' ? 'transparent' : tvTextColor;

  useEffect(() => {
    fetchTeams().then((t) => {
      setTeams(t);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (teams.length === 0 || !onFavoritesMigrated) return;
    const next = normalizeLegacyFavoriteTeamIds(teams, selectedTeams);
    if (sameFavoriteIdSet(next, selectedTeams)) return;
    onFavoritesMigrated(next);
  }, [teams, selectedTeams, onFavoritesMigrated]);

  const isSearching = search.trim().length > 0;

  const filteredTeams = useMemo(() => {
    if (!isSearching) return teams;
    const q = search.toLowerCase();
    return teams.filter((t) => t.teamName.toLowerCase().includes(q));
  }, [teams, search, isSearching]);

  const grouped = useMemo(() => {
    const map = new Map<string, TeamInfo[]>();
    for (const team of filteredTeams) {
      const list = map.get(team.league) ?? [];
      list.push(team);
      map.set(team.league, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredTeams]);

  /** Set lookup avoids subtle `includes` / duplicate-row issues and is O(1) per chip. */
  const selectedTeamIdSet = useMemo(() => new Set(selectedTeams), [selectedTeams]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading teams...</Text>
      </View>
    );
  }

  if (teams.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No teams available right now</Text>
      </View>
    );
  }

  const chipSize = isCompact
    ? { paddingHorizontal: 10, paddingVertical: 7 }
    : { paddingHorizontal: 14, paddingVertical: 9 };
  const inputH = isCompact ? 38 : 44;

  return (
    <View testID="team-picker" style={styles.wrapper}>
      {onToggleSport && (
        <View style={styles.sportsSection}>
          <Text style={[styles.sectionLabel, isCompact && { fontSize: 12 }]}>
            Sports
          </Text>
          <Text style={[styles.sportsHint, isCompact && { fontSize: 12 }]}>
            Follow an entire sport (e.g. all Golf or MMA). Or pick teams below.
          </Text>
          <View style={styles.chipRow}>
            {ALL_SPORTS.map((sport, index) => {
              const isSelected = (selectedSports ?? []).includes(sport.id);
              return (
                <Pressable
                  key={sport.id}
                  testID={`sport-fav-${sport.id}`}
                  hasTVPreferredFocus={Boolean(preferInitialFocus && isTv && index === 0)}
                  onPress={() => onToggleSport(sport.id)}
                  style={({ focused }) => [
                    styles.chip,
                    chipSize,
                    isSelected && styles.sportChipSelected,
                    showFocus && focused && styles.chipFocused,
                  ]}
                >
                  <Text style={{ fontSize: 14 }}>{sport.icon}</Text>
                  <Text style={[styles.chipText, isCompact && { fontSize: 13 }, isSelected && { fontWeight: '600' }]}>
                    {sport.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <Text style={[styles.sectionLabel, isCompact && { fontSize: 12 }]}>
        Teams
      </Text>

      {isTv ? (
        <Pressable
          onPress={() => {
            teamSearchInputRef.current?.focus();
          }}
          onFocus={() => setSearchShellTvFocused(true)}
          onBlur={() => setSearchShellTvFocused(false)}
          style={[
            styles.searchInput,
            { height: inputH },
            isCompact && { height: 38 },
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
                  { color: tvTextColor, fontSize: isCompact ? 14 : 15 },
                ]}
              >
                Search teams...
              </Text>
            </View>
          )}
          <TextInput
            ref={teamSearchInputRef}
            testID="team-search"
            focusable={false}
            style={[
              styles.searchFieldTv,
              {
                height: inputH,
                minHeight: inputH,
                color: tvInputColor,
              },
              isCompact && { fontSize: 14, height: 38, minHeight: 38 },
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
          testID="team-search"
          style={[
            styles.searchInput,
            isCompact && { fontSize: 14, height: 38 },
            searchFocused && styles.searchInputFocused,
            // Web: strip browser’s default `:focus` outline so only the RN border ring shows.
            Platform.OS === 'web' && ({ outlineStyle: 'none' } as object),
          ]}
          placeholder="Search teams..."
          placeholderTextColor="#8B95A5"
          value={search}
          onChangeText={setSearch}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      )}

      {grouped.map(([league, leagueTeams]) => {
        const isExpanded = isSearching || expandedLeague === league;

        return (
          <View key={league} style={styles.leagueSection}>
            <Pressable
              testID={`league-header-${league}`}
              onPress={() => setExpandedLeague(isExpanded && !isSearching ? null : league)}
              style={({ focused }) => [
                styles.leagueHeader,
                showFocus && focused && styles.leagueHeaderFocused,
              ]}
            >
              <Text style={[styles.leagueLabel, isCompact && { fontSize: 16 }]}>
                {league}
              </Text>
              <View style={styles.leagueHeaderRight}>
                <Text style={styles.chevron}>{isExpanded ? '▾' : '▸'}</Text>
              </View>
            </Pressable>

            {isExpanded && (
              <View style={styles.chipRow}>
                {leagueTeams.map((team) => {
                  const isSelected = selectedTeamIdSet.has(team.teamId);
                  return (
                    <Pressable
                      key={team.teamId}
                      testID={`team-chip-${team.teamId.replace(/:/g, '-')}`}
                      onPress={() => onToggle(team.teamId)}
                      style={({ focused }) => [
                        styles.chip,
                        chipSize,
                        isSelected && styles.teamChipSelected,
                        showFocus && focused && styles.chipFocused,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isCompact && { fontSize: 13 },
                          isSelected && { fontWeight: '600' },
                        ]}
                        numberOfLines={1}
                      >
                        {isSelected ? '✓ ' : ''}{team.teamName}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}

      {isSearching && filteredTeams.length === 0 && (
        <Text style={styles.emptyText}>No teams match "{search}"</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#8B95A5',
    fontSize: 16,
  },
  sportsSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sportsHint: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#1A1F2E',
    color: '#FFFFFF',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2D3548',
    overflow: 'hidden',
  },
  /** TV: TextInput above backing placeholder `Text` so UIFocus still targets it. */
  searchFieldTv: {
    width: '100%',
    zIndex: 1,
    paddingHorizontal: 14,
    borderWidth: 0,
    backgroundColor: 'transparent',
    fontSize: 15,
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
    /** Match focused chips: elevated navy fill with the same white focus ring. */
    backgroundColor: '#1A1F2E',
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  searchInputFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  leagueSection: {
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1F2E',
  },
  leagueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  leagueHeaderFocused: {
    borderColor: '#FFFFFF',
  },
  leagueLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  leagueHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chevron: {
    color: '#6B7280',
    fontSize: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 10,
    paddingBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#1A1F2E',
    borderWidth: 1.5,
    borderColor: '#2D3548',
    gap: 5,
  },
  teamChipSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  sportChipSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  chipFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
  },
  emptyText: {
    color: '#8B95A5',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 24,
  },
});
