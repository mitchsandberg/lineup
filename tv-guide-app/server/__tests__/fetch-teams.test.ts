const mockTeamResponses: Record<string, any> = {};

const originalFetch = global.fetch;

beforeAll(() => {
  global.fetch = jest.fn(async (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url.toString();

    for (const [pattern, response] of Object.entries(mockTeamResponses)) {
      if (urlStr.includes(pattern)) {
        return {
          ok: true,
          json: async () => response,
        } as Response;
      }
    }

    return { ok: false, json: async () => ({}) } as Response;
  });
});

afterAll(() => {
  global.fetch = originalFetch;
});

beforeEach(() => {
  for (const key of Object.keys(mockTeamResponses)) delete mockTeamResponses[key];
  jest.resetModules();
});

describe('fetchAllTeams', () => {
  it('fetches teams from ESPN teams API for team sports', async () => {
    mockTeamResponses['basketball/nba/teams'] = {
      sports: [{
        leagues: [{
          teams: [
            { team: { id: '2', displayName: 'Boston Celtics' } },
            { team: { id: '13', displayName: 'Los Angeles Lakers' } },
          ],
        }],
      }],
    };

    mockTeamResponses['baseball/mlb/teams'] = {
      sports: [{
        leagues: [{
          teams: [
            { team: { id: '7', displayName: 'Boston Red Sox' } },
          ],
        }],
      }],
    };

    const { fetchAllTeams } = require('../sports-api');
    const teams = await fetchAllTeams();

    expect(teams.length).toBeGreaterThanOrEqual(2);
    const celtics = teams.find((t: any) => t.teamId === '2');
    expect(celtics).toBeDefined();
    expect(celtics.teamName).toBe('Boston Celtics');
    expect(celtics.sport).toBe('nba');
    expect(celtics.league).toBe('NBA');
  });

  it('returns teams sorted by league then name', async () => {
    mockTeamResponses['basketball/nba/teams'] = {
      sports: [{
        leagues: [{
          teams: [
            { team: { id: '13', displayName: 'Los Angeles Lakers' } },
            { team: { id: '2', displayName: 'Boston Celtics' } },
          ],
        }],
      }],
    };

    mockTeamResponses['baseball/mlb/teams'] = {
      sports: [{
        leagues: [{
          teams: [
            { team: { id: '7', displayName: 'Boston Red Sox' } },
          ],
        }],
      }],
    };

    const { fetchAllTeams } = require('../sports-api');
    const teams = await fetchAllTeams();

    for (let i = 1; i < teams.length; i++) {
      const cmp = teams[i - 1].league.localeCompare(teams[i].league)
        || teams[i - 1].teamName.localeCompare(teams[i].teamName);
      expect(cmp).toBeLessThanOrEqual(0);
    }
  });

  it('excludes individual sports (MMA, golf)', async () => {
    mockTeamResponses['basketball/nba/teams'] = {
      sports: [{
        leagues: [{
          teams: [
            { team: { id: '2', displayName: 'Boston Celtics' } },
          ],
        }],
      }],
    };

    const { fetchAllTeams } = require('../sports-api');
    const teams = await fetchAllTeams();

    const sports = new Set(teams.map((t: any) => t.sport));
    expect(sports).not.toContain('mma');
    expect(sports).not.toContain('golf');
  });

  it('handles API failure gracefully and returns empty for that league', async () => {
    const { fetchAllTeams } = require('../sports-api');
    const teams = await fetchAllTeams();

    expect(Array.isArray(teams)).toBe(true);
  });
});
