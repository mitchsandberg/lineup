import { RegionalBroadcast, SportEvent } from './types';
import { findChannelByName } from '@/data/channels';

interface RSNChannelDef {
  name: string;
  serviceIds: string[];
}

interface MarketDef {
  id: string;
  channels: RSNChannelDef[];
}

const MARKET_CHANNELS: MarketDef[] = [
  { id: 'new-york', channels: [{ name: 'YES', serviceIds: ['youtube-tv', 'hulu-live'] }, { name: 'YES Network', serviceIds: ['youtube-tv', 'hulu-live'] }, { name: 'SNY', serviceIds: ['youtube-tv', 'hulu-live'] }, { name: 'MSG', serviceIds: ['youtube-tv', 'hulu-live'] }, { name: 'MSG+', serviceIds: ['youtube-tv', 'hulu-live'] }] },
  { id: 'boston', channels: [{ name: 'NESN', serviceIds: ['youtube-tv', 'hulu-live'] }, { name: 'NESN+', serviceIds: ['youtube-tv', 'hulu-live'] }, { name: 'NBC Sports Boston', serviceIds: ['youtube-tv', 'hulu-live'] }] },
  { id: 'chicago', channels: [{ name: 'NBC Sports Chicago', serviceIds: ['youtube-tv', 'hulu-live'] }, { name: 'Marquee', serviceIds: ['youtube-tv', 'hulu-live'] }, { name: 'Marquee Sports Network', serviceIds: ['youtube-tv', 'hulu-live'] }] },
  { id: 'los-angeles', channels: [{ name: 'SportsNet LA', serviceIds: ['youtube-tv', 'hulu-live'] }, { name: 'Spectrum SportsNet', serviceIds: [] }, { name: 'Bally Sports West', serviceIds: [] }, { name: 'BSW', serviceIds: [] }] },
  { id: 'philadelphia', channels: [{ name: 'NBC Sports Philadelphia', serviceIds: ['youtube-tv', 'hulu-live'] }, { name: 'NBCS Philadelphia', serviceIds: ['youtube-tv', 'hulu-live'] }] },
  { id: 'san-francisco', channels: [{ name: 'NBC Sports Bay Area', serviceIds: ['youtube-tv', 'hulu-live'] }, { name: 'NBCS Bay Area', serviceIds: ['youtube-tv', 'hulu-live'] }, { name: 'NBC Sports California', serviceIds: ['youtube-tv', 'hulu-live'] }] },
  { id: 'dallas', channels: [{ name: 'Bally Sports Southwest', serviceIds: [] }, { name: 'BSSW', serviceIds: [] }] },
  { id: 'houston', channels: [{ name: 'Space City Home Network', serviceIds: ['youtube-tv', 'hulu-live'] }, { name: 'SCHN', serviceIds: ['youtube-tv', 'hulu-live'] }] },
  { id: 'washington-dc', channels: [{ name: 'MASN', serviceIds: ['youtube-tv', 'hulu-live'] }, { name: 'MASN2', serviceIds: ['youtube-tv', 'hulu-live'] }, { name: 'Monumental Sports Network', serviceIds: [] }, { name: 'NBC Sports Washington', serviceIds: ['youtube-tv', 'hulu-live'] }] },
  { id: 'atlanta', channels: [{ name: 'Bally Sports Southeast', serviceIds: [] }, { name: 'BSSE', serviceIds: [] }, { name: 'Bally Sports South', serviceIds: [] }] },
  { id: 'detroit', channels: [{ name: 'Bally Sports Detroit', serviceIds: [] }, { name: 'BSD', serviceIds: [] }] },
  { id: 'minneapolis', channels: [{ name: 'Bally Sports North', serviceIds: [] }, { name: 'BSN', serviceIds: [] }] },
  { id: 'denver', channels: [{ name: 'Altitude', serviceIds: [] }, { name: 'Altitude Sports', serviceIds: [] }] },
  { id: 'phoenix', channels: [{ name: 'Arizona Sports', serviceIds: [] }, { name: 'Bally Sports Arizona', serviceIds: [] }, { name: 'BSAZ', serviceIds: [] }] },
  { id: 'miami', channels: [{ name: 'Bally Sports Sun', serviceIds: [] }, { name: 'Bally Sports Florida', serviceIds: [] }, { name: 'BSFL', serviceIds: [] }] },
  { id: 'seattle', channels: [{ name: 'ROOT Sports', serviceIds: ['youtube-tv', 'hulu-live'] }, { name: 'ROOT Sports NW', serviceIds: ['youtube-tv', 'hulu-live'] }] },
  { id: 'cleveland', channels: [{ name: 'Bally Sports Great Lakes', serviceIds: [] }, { name: 'BSGL', serviceIds: [] }] },
  { id: 'pittsburgh', channels: [{ name: 'SportsNet Pittsburgh', serviceIds: ['youtube-tv', 'hulu-live'] }, { name: 'SNP', serviceIds: ['youtube-tv', 'hulu-live'] }, { name: 'AT&T SportsNet Pittsburgh', serviceIds: ['youtube-tv', 'hulu-live'] }] },
  { id: 'san-diego', channels: [{ name: 'Padres.TV', serviceIds: ['mlb-tv'] }, { name: 'San Diego Padres', serviceIds: ['mlb-tv'] }] },
  { id: 'st-louis', channels: [{ name: 'Bally Sports Midwest', serviceIds: [] }, { name: 'BSMW', serviceIds: [] }] },
  { id: 'milwaukee', channels: [{ name: 'Bally Sports Wisconsin', serviceIds: [] }, { name: 'BSWI', serviceIds: [] }] },
  { id: 'tampa-bay', channels: [{ name: 'Bally Sports Sun', serviceIds: [] }, { name: 'BSSUN', serviceIds: [] }] },
  { id: 'portland', channels: [{ name: 'ROOT Sports', serviceIds: ['youtube-tv', 'hulu-live'] }, { name: 'ROOT Sports NW', serviceIds: ['youtube-tv', 'hulu-live'] }] },
  { id: 'cincinnati', channels: [{ name: 'Bally Sports Ohio', serviceIds: [] }, { name: 'BSOH', serviceIds: [] }] },
  { id: 'kansas-city', channels: [{ name: 'Bally Sports Kansas City', serviceIds: [] }, { name: 'BSKC', serviceIds: [] }] },
  { id: 'toronto', channels: [{ name: 'Sportsnet', serviceIds: [] }, { name: 'TSN', serviceIds: [] }] },
];

const MARKET_INDEX = new Map<string, Map<string, RSNChannelDef>>();
for (const market of MARKET_CHANNELS) {
  const channelMap = new Map<string, RSNChannelDef>();
  for (const ch of market.channels) {
    channelMap.set(ch.name.toLowerCase(), ch);
  }
  MARKET_INDEX.set(market.id, channelMap);
}

export function resolveRSN(
  event: SportEvent,
  marketIds: string[],
): { channel: string; extraServices: string[] } | null {
  if (marketIds.length === 0 || !event.regionalChannels?.length) return null;

  for (const rb of event.regionalChannels) {
    if (rb.type === 'national') continue;
    const channelName = rb.channel.toLowerCase();
    for (const marketId of marketIds) {
      const marketChannels = MARKET_INDEX.get(marketId);
      const match = marketChannels?.get(channelName);
      if (match) {
        return { channel: rb.channel, extraServices: match.serviceIds };
      }
    }
  }

  return null;
}

export function enrichEventWithRSN(
  event: SportEvent,
  marketIds: string[],
): SportEvent {
  const rsn = resolveRSN(event, marketIds);
  if (!rsn) return event;

  const mergedServices = [...event.availableServices];
  for (const svc of rsn.extraServices) {
    if (!mergedServices.includes(svc)) mergedServices.push(svc);
  }

  const channelEntry = findChannelByName(rsn.channel);
  if (channelEntry) {
    for (const svc of channelEntry.serviceIds) {
      if (!mergedServices.includes(svc)) mergedServices.push(svc);
    }
  }

  return {
    ...event,
    channel: rsn.channel,
    availableServices: mergedServices,
  };
}
