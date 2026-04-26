import { StreamingService } from '@/lib/types';

export const STREAMING_SERVICES: StreamingService[] = [
  {
    id: 'youtube-tv',
    name: 'YouTube TV',
    color: '#FF0000',
    group: 'major',
    appStoreId: '1193350206',
    playStorePackage: 'com.google.android.apps.youtube.unplugged',
    deepLinks: {
      tvos: 'https://tv.youtube.com',
      ios: 'youtubetv://',
      android: 'intent://tv.youtube.com#Intent;package=com.google.android.apps.youtube.unplugged;scheme=https;end',
      web: 'https://tv.youtube.com/live',
    },
  },
  {
    id: 'espn-plus',
    name: 'ESPN+',
    color: '#D00',
    group: 'major',
    appStoreId: '317469184',
    playStorePackage: 'com.espn.score_center',
    deepLinks: {
      tvos: 'espn://',
      android: 'intent://espn.com#Intent;package=com.espn.score_center;scheme=https;end',
      web: 'https://www.espn.com/watch/',
    },
  },
  {
    id: 'peacock',
    name: 'Peacock',
    color: '#6B3FA0',
    group: 'major',
    appStoreId: '1508186374',
    playStorePackage: 'com.peacocktv.peacockandroid',
    deepLinks: {
      tvos: 'peacocktv://',
      android: 'intent://peacocktv.com#Intent;package=com.peacocktv.peacockandroid;scheme=https;end',
      web: 'https://www.peacocktv.com/watch/live-tv',
    },
  },
  {
    id: 'hulu-live',
    name: 'Hulu',
    color: '#1CE783',
    group: 'major',
    appStoreId: '376510438',
    playStorePackage: 'com.hulu.plus',
    deepLinks: {
      tvos: 'hulu://',
      android: 'intent://hulu.com#Intent;package=com.hulu.plus;scheme=https;end',
      web: 'https://www.hulu.com/live-tv',
    },
  },
  {
    id: 'prime-video',
    name: 'Prime Video',
    color: '#00A8E1',
    group: 'major',
    appStoreId: '545519333',
    playStorePackage: 'com.amazon.avod.thirdpartyclient',
    playStorePackageTv: 'com.amazon.amazonvideo.livingroom',
    deepLinks: {
      tvos: 'aiv://',
      android:
        'intent://watch.amazon.com#Intent;package=com.amazon.avod.thirdpartyclient;scheme=https;end',
      androidTv: 'intent:#Intent;package=com.amazon.amazonvideo.livingroom;end',
      web: 'https://www.amazon.com/gp/video/storefront',
    },
  },
  {
    id: 'paramount-plus',
    name: 'Paramount+',
    color: '#0064FF',
    group: 'major',
    appStoreId: '530168168',
    playStorePackage: 'com.cbs.ott',
    deepLinks: {
      tvos: 'paramountplus://',
      ios: 'https://www.paramountplus.com',
      android: 'intent://paramountplus.com#Intent;package=com.cbs.ott;scheme=https;end',
      web: 'https://www.paramountplus.com',
    },
  },
  {
    id: 'apple-tv',
    name: 'Apple TV+',
    color: '#555555',
    group: 'major',
    appStoreId: '1174078549',
    playStorePackage: 'com.apple.atve.androidtv.appletv',
    deepLinks: {
      tvos: 'videos://',
      android: 'intent://tv.apple.com#Intent;package=com.apple.atve.androidtv.appletv;scheme=https;end',
      web: 'https://tv.apple.com',
    },
  },
  {
    id: 'mlb-tv',
    name: 'MLB.TV',
    color: '#002D72',
    group: 'league',
    appStoreId: '1219890397',
    playStorePackage: 'com.bamnetworks.mobile.android.gameday.atbat',
    deepLinks: {
      tvos: 'mlbatbat://',
      android: 'intent://mlb.com#Intent;package=com.bamnetworks.mobile.android.gameday.atbat;scheme=https;end',
      web: 'https://www.mlb.com/tv',
    },
  },
  {
    id: 'nba-league-pass',
    name: 'NBA League Pass',
    color: '#1D428A',
    group: 'league',
    appStoreId: '484672289',
    playStorePackage: 'com.nbaimd.gametime.nba2011',
    deepLinks: {
      tvos: 'gametime-nba://',
      android: 'intent://nba.com#Intent;package=com.nbaimd.gametime.nba2011;scheme=https;end',
      web: 'https://www.nba.com/watch',
    },
  },
  {
    id: 'nfl-plus',
    name: 'NFL+',
    color: '#013369',
    group: 'league',
    appStoreId: '389781154',
    playStorePackage: 'com.gotv.nflgamecenter.us.lite',
    deepLinks: {
      tvos: 'nflgamecenter://',
      android: 'intent://nfl.com#Intent;package=com.gotv.nflgamecenter.us.lite;scheme=https;end',
      web: 'https://www.nfl.com/plus/',
    },
  },
  {
    id: 'nfl-sunday-ticket',
    name: 'Sunday Ticket',
    color: '#FFB612',
    group: 'league',
    appStoreId: '1193350206',
    playStorePackage: 'com.google.android.apps.youtube.unplugged',
    deepLinks: {
      tvos: 'https://tv.youtube.com',
      ios: 'youtubetv://',
      android: 'intent://tv.youtube.com#Intent;package=com.google.android.apps.youtube.unplugged;scheme=https;end',
      web: 'https://tv.youtube.com/live',
    },
  },
];

export const MAJOR_SERVICES = STREAMING_SERVICES.filter((s) => s.group === 'major');
export const LEAGUE_SERVICES = STREAMING_SERVICES.filter((s) => s.group === 'league');

export const SERVICE_MAP = Object.fromEntries(
  STREAMING_SERVICES.map((s) => [s.id, s]),
);
