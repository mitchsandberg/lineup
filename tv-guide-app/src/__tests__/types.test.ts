import {
  SportCategory,
  StreamingService,
  Channel,
  SportEvent,
  TimeGroup,
  GroupedEvents,
  UserPreferences,
  TeamInfo,
} from '@/lib/types';

describe('Type definitions', () => {
  describe('SportEvent', () => {
    it('can create a valid live event', () => {
      const event: SportEvent = {
        id: 'test-1',
        title: 'Lakers at Celtics',
        subtitle: 'NBA',
        sport: 'nba',
        league: 'NBA',
        channel: 'ESPN',
        startTime: '2026-04-18T22:00:00Z',
        status: 'live',
        homeTeam: 'Boston Celtics',
        awayTeam: 'Los Angeles Lakers',
        homeScore: '87',
        awayScore: '82',
        availableServices: ['youtube-tv', 'hulu-live', 'espn-plus'],
      };
      expect(event.id).toBe('test-1');
      expect(event.status).toBe('live');
    });

    it('can create an event without optional fields', () => {
      const event: SportEvent = {
        id: 'test-2',
        title: 'UFC 315',
        sport: 'mma',
        league: 'UFC',
        channel: 'ESPN+',
        startTime: '2026-04-19T22:00:00Z',
        status: 'upcoming',
        availableServices: ['espn-plus'],
      };
      expect(event.homeTeam).toBeUndefined();
      expect(event.awayTeam).toBeUndefined();
      expect(event.homeScore).toBeUndefined();
    });

    it('status is one of expected values', () => {
      const validStatuses: SportEvent['status'][] = ['upcoming', 'live', 'final'];
      for (const status of validStatuses) {
        const event: SportEvent = {
          id: 'test',
          title: 'Test',
          sport: 'nba',
          league: 'NBA',
          channel: 'ESPN',
          startTime: new Date().toISOString(),
          status,
          availableServices: [],
        };
        expect(validStatuses).toContain(event.status);
      }
    });
  });

  describe('StreamingService', () => {
    it('can create a valid service', () => {
      const service: StreamingService = {
        id: 'test-service',
        name: 'Test Service',
        color: '#FF0000',
        group: 'major',
        deepLinks: {
          tvos: 'test://',
          android: 'intent://test',
          web: 'https://test.com',
        },
      };
      expect(service.id).toBe('test-service');
      expect(service.deepLinks.tvos).toBe('test://');
    });
  });

  describe('Channel', () => {
    it('can create a valid channel', () => {
      const channel: Channel = {
        id: 'test-ch',
        name: 'Test Channel',
        serviceIds: ['youtube-tv', 'hulu-live'],
      };
      expect(channel.serviceIds).toHaveLength(2);
    });
  });

  describe('TimeGroup', () => {
    it('has all expected values', () => {
      const groups: TimeGroup[] = ['live', 'starting-soon', 'later-today', 'tomorrow'];
      expect(groups).toHaveLength(4);
    });
  });

  describe('GroupedEvents', () => {
    it('can create a valid group', () => {
      const group: GroupedEvents = {
        group: 'live',
        label: 'Live Now',
        events: [],
      };
      expect(group.group).toBe('live');
      expect(group.label).toBe('Live Now');
    });
  });

  describe('UserPreferences', () => {
    it('can create valid preferences', () => {
      const prefs: UserPreferences = {
        selectedServices: ['youtube-tv', 'espn-plus'],
        selectedSport: 'nba',
        favoriteTeams: ['2', '13'],
        favoriteSports: ['golf'],
        tvMarkets: ['new-york', 'boston'],
        onboardingComplete: true,
      };
      expect(prefs.selectedServices).toHaveLength(2);
      expect(prefs.selectedSport).toBe('nba');
      expect(prefs.favoriteTeams).toHaveLength(2);
      expect(prefs.favoriteSports).toEqual(['golf']);
      expect(prefs.tvMarkets).toEqual(['new-york', 'boston']);
    });

    it('supports "all" sport selection', () => {
      const prefs: UserPreferences = {
        selectedServices: [],
        selectedSport: 'all',
        favoriteTeams: [],
        favoriteSports: [],
        tvMarkets: [],
        onboardingComplete: false,
      };
      expect(prefs.selectedSport).toBe('all');
      expect(prefs.favoriteTeams).toEqual([]);
      expect(prefs.favoriteSports).toEqual([]);
      expect(prefs.tvMarkets).toEqual([]);
    });
  });

  describe('TeamInfo', () => {
    it('can create a valid team info object', () => {
      const team: TeamInfo = {
        sport: 'nba',
        league: 'NBA',
        teamId: 'nba:2',
        teamName: 'Boston Celtics',
      };
      expect(team.teamId).toBe('nba:2');
      expect(team.teamName).toBe('Boston Celtics');
    });
  });

  describe('SportEvent with team IDs', () => {
    it('can include homeTeamId and awayTeamId', () => {
      const event: SportEvent = {
        id: 'test-teams',
        title: 'Lakers at Celtics',
        sport: 'nba',
        league: 'NBA',
        channel: 'ESPN',
        startTime: new Date().toISOString(),
        status: 'live',
        homeTeam: 'Boston Celtics',
        awayTeam: 'Los Angeles Lakers',
        homeTeamId: '2',
        awayTeamId: '13',
        availableServices: ['youtube-tv'],
      };
      expect(event.homeTeamId).toBe('2');
      expect(event.awayTeamId).toBe('13');
    });
  });
});
