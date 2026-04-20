import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { fetchTeams } from '@/lib/api';
import { TeamInfo } from '@/lib/types';
import { SPORT_FILTERS } from '@/lib/constants';

interface TeamPickerProps {
  selectedTeams: string[];
  onToggle: (teamId: string) => void;
  selectedSports?: string[];
  onToggleSport?: (sport: string) => void;
  compact?: boolean;
}

const ALL_SPORTS = SPORT_FILTERS.filter((f) => f.id !== 'all');

const LEAGUE_SPORT_MAP: Record<string, string> = {
  NFL: 'nfl',
  NBA: 'nba',
  MLB: 'mlb',
  NHL: 'nhl',
  MLS: 'soccer',
  EPL: 'soccer',
  NCAAF: 'college-football',
  NCAAM: 'college-basketball',
};

export function TeamPicker({ selectedTeams, onToggle, selectedSports, onToggleSport, compact }: TeamPickerProps) {
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLeague, setExpandedLeague] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { width, height } = useWindowDimensions();
  const isMobile = width < 600;
  const isLandscapeMobile = Platform.OS === 'web' && width > height && height < 500;
  const isCompact = isMobile || isLandscapeMobile || compact;

  useEffect(() => {
    fetchTeams().then((t) => {
      setTeams(t);
      setLoading(false);
    });
  }, []);

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

  const selectedCountByLeague = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const team of teams) {
      if (selectedTeams.includes(team.teamId)) {
        counts[team.league] = (counts[team.league] ?? 0) + 1;
      }
    }
    return counts;
  }, [teams, selectedTeams]);

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

  return (
    <View testID="team-picker" style={styles.wrapper}>
      {onToggleSport && (
        <View style={styles.sportsSection}>
          <Text style={[styles.sectionLabel, isCompact && { fontSize: 12 }]}>
            Sports
          </Text>
          <View style={styles.chipRow}>
            {ALL_SPORTS.map((sport) => {
              const isSelected = (selectedSports ?? []).includes(sport.id);
              return (
                <Pressable
                  key={sport.id}
                  testID={`sport-fav-${sport.id}`}
                  onPress={() => onToggleSport(sport.id)}
                  style={[
                    styles.chip,
                    chipSize,
                    isSelected && styles.sportChipSelected,
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

      <TextInput
        testID="team-search"
        style={[styles.searchInput, isCompact && { fontSize: 14, height: 38 }]}
        placeholder="Search teams..."
        placeholderTextColor="#8B95A5"
        value={search}
        onChangeText={setSearch}
      />

      {grouped.map(([league, leagueTeams]) => {
        const isExpanded = isSearching || expandedLeague === league;
        const count = selectedCountByLeague[league] ?? 0;

        return (
          <View key={league} style={styles.leagueSection}>
            <Pressable
              testID={`league-header-${league}`}
              onPress={() => setExpandedLeague(isExpanded && !isSearching ? null : league)}
              style={styles.leagueHeader}
            >
              <Text style={[styles.leagueLabel, isCompact && { fontSize: 16 }]}>
                {league}
              </Text>
              <View style={styles.leagueHeaderRight}>
                {count > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{count}</Text>
                  </View>
                )}
                <Text style={styles.chevron}>{isExpanded ? '▾' : '▸'}</Text>
              </View>
            </Pressable>

            {isExpanded && (
              <View style={styles.chipRow}>
                {leagueTeams.map((team) => {
                  const isSelected = selectedTeams.includes(team.teamId);
                  return (
                    <Pressable
                      key={team.teamId}
                      testID={`team-chip-${team.teamId}`}
                      onPress={() => onToggle(team.teamId)}
                      style={[
                        styles.chip,
                        chipSize,
                        isSelected && styles.teamChipSelected,
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
  searchInput: {
    backgroundColor: '#1A1F2E',
    color: '#FFFFFF',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2D3548',
  },
  leagueSection: {
    marginBottom: 4,
  },
  leagueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1F2E',
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
  countBadge: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
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
