import { Accomendation, AllTickets, Station, TrainInfo, TrainNumberShort } from '../types';
import { appendTickets } from './common';

function parseStation(rawStation: string): Station {
  const splitList = rawStation.split('|');
  return {
    name: splitList[1],
    city: splitList[7],
    telecode: splitList[2],
    pinyinCode: splitList[0],
    pinyinAcronym: splitList[4],
    pinyinFull: splitList[3],
  };
}

export function parseTrainInfo(rawTrainInfo: string, date: string): TrainInfo {
  const splitList = rawTrainInfo.split('|');

  const departureTime = new Date(`${date} ${splitList[8]} UTC+8`);
  const [durationHour, durationMinute] = splitList[10].split(':').map(Number);
  const arrivalTime: Date = new Date(
    departureTime.getTime() + (durationHour * 60 + durationMinute) * 60 * 1000
  );

  const allTickets: AllTickets = {};
  appendTickets(allTickets, Accomendation.BUSINESS_CLASS, splitList[32]); // 商务座
  appendTickets(allTickets, Accomendation.PREMIUM_CLASS, splitList[25]); // 特等座
  appendTickets(allTickets, Accomendation.PREFERRED_FIRST_CLASS, splitList[20]); // 优选一等座
  appendTickets(allTickets, Accomendation.FIRST_CLASS, splitList[31]); // 一等座
  appendTickets(allTickets, Accomendation.SECOND_CLASS, splitList[30]); // 二等座
  appendTickets(allTickets, Accomendation.DELUXE_SOFT_SLEEPER, splitList[21]); // 高级软卧
  appendTickets(allTickets, Accomendation.SOFT_SLEEPER, splitList[23]); // 软卧
  appendTickets(allTickets, Accomendation.HARD_SLEEPER, splitList[28]); // 硬卧
  appendTickets(allTickets, Accomendation.SOFT_SEAT, splitList[24]); // 软座
  appendTickets(allTickets, Accomendation.HARD_SEAT, splitList[29]); // 硬座
  appendTickets(allTickets, Accomendation.STANDING, splitList[26]); // 无座

  // 22、27、33 处几乎都是空字符串，具体代表什么未知
  return {
    number: splitList[2],
    numberShort: splitList[3] as TrainNumberShort,
    startingStation: splitList[4],
    endingStation: splitList[5],
    departureStation: splitList[6],
    arrivalStation: splitList[7],
    departureTime: departureTime,
    arrivalTime: arrivalTime,
    bookable: splitList[11] === 'Y',
    allLeftTickets: allTickets,
  };
}

export function parseStationList(rawStationList: string): Station[] {
  return rawStationList.split('@').slice(1).map(parseStation);
}
