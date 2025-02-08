import { fetch } from 'node-fetch-native';
import { CookieJar } from 'tough-cookie';

import { CachedData } from './utils';

export type Fetch = typeof fetch;

export interface HelperConfig {
  fetch: Fetch;
  cookieJar: CookieJar;
  useCache<T>(
    fetchData: (() => Promise<T>) | (() => T),
    ttl: number,
  ): CachedData<T>;
  stationListUpdateInterval: number;
}

export const enum PurposeCodes {
  ADULT = 'ADULT',
  STUDENT = '0X00',
}

export type TrainNumberPrefix =
  | ''
  | 'C'
  | 'D'
  | 'G'
  | 'K'
  | 'L'
  | 'S'
  | 'T'
  | 'Y'
  | 'Z';
export type TrainNumberShort = `${TrainNumberPrefix}${number}`;

export interface Station {
  name: string;
  city: string;
  telecode: string;
  pinyinCode: string;
  pinyinAcronym: string;
  pinyinFull: string;
}

export type StationQuery = Partial<Omit<Station, 'city'>>;

export const enum Accomendation {
  BUSINESS_CLASS = '商务座',
  PREMIUM_CLASS = '特等座',
  PREFERRED_FIRST_CLASS = '优选一等座',
  FIRST_CLASS = '一等座',
  SECOND_CLASS = '二等座/二等包座',
  SOFT_SEAT = '软座',
  HARD_SEAT = '硬座',
  DELUXE_SOFT_SLEEPER = '高级软卧',
  SOFT_SLEEPER = '软卧/动卧/一等卧',
  HARD_SLEEPER = '硬卧/二等卧',
  STANDING = '无座',
  OTHER = '其他',
}

export type Available = '有';
export type Tickets = number | Available;
export type AllTickets = Partial<Record<Accomendation, Tickets>>;

export interface TrainInfo {
  number: string;
  numberShort: TrainNumberShort;
  startingStation: Station | string;
  endingStation: Station | string;
  departureStation: Station | string;
  arrivalStation: Station | string;
  departureTime: Date;
  arrivalTime: Date;
  bookable: boolean;
  allLeftTickets: AllTickets;
}

export interface TransferPlan {
  departureStation: string;
  arrivalStation: string;
  transferStation: string;
  departureTime: Date;
  arrivalTime: Date;
  totalDuration: number;
  totalDurationText: string;
  waitDuration: number;
  waitDurationText: string;
  firstTrain: TrainInfo;
  secondTrain: TrainInfo;
}

export class StationNotFoundError extends Error {
  constructor(query: StationQuery) {
    super(`Station not found with given query: ${JSON.stringify(query)}`);
  }
}
