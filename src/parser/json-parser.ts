import { TrainInfo, TransferPlan, AllTickets, Accomendation } from '../types';
import { appendTickets } from './common';

function parseTrainInfo(trainInfo: any): TrainInfo {
  const departureTime = new Date(`${trainInfo.start_train_date} ${trainInfo.start_time} UTC+8`);
  const arrivalTime = new Date(`${trainInfo.start_train_date + parseInt(trainInfo.day_difference)} ${trainInfo.arrive_time} UTC+8`);

  const allTickets: AllTickets = {};
  appendTickets(allTickets, Accomendation.BUSINESS_CLASS, trainInfo.swz_num); // 商务座
  appendTickets(allTickets, Accomendation.PREMIUM_CLASS, trainInfo.tz_num); // 特等座
  appendTickets(allTickets, Accomendation.FIRST_CLASS, trainInfo.zy_num); // 一等座
  appendTickets(allTickets, Accomendation.SECOND_CLASS, trainInfo.ze_num); // 二等座
  appendTickets(allTickets, Accomendation.DELUXE_SOFT_SLEEPER, trainInfo.gr_num); // 高级软卧
  appendTickets(allTickets, Accomendation.SOFT_SLEEPER, trainInfo.rw_num); // 软卧
  appendTickets(allTickets, Accomendation.HARD_SLEEPER, trainInfo.yw_num); // 硬卧
  appendTickets(allTickets, Accomendation.SOFT_SEAT, trainInfo.rz_num); // 软座
  appendTickets(allTickets, Accomendation.HARD_SEAT, trainInfo.yz_num); // 硬座
  appendTickets(allTickets, Accomendation.STANDING, trainInfo.wz_num); // 无座
  appendTickets(allTickets, Accomendation.OTHER, trainInfo.qt_num); // 其他
  // gg_num、srrb_num、yb_num 字段几乎都是 "--"，具体代表什么未知

  let bookable = false;
  for (const key in allTickets) {
    if (allTickets[key] === 0) {
      bookable = true;
      break;
    }
  }

  return {
    number: trainInfo.train_no,
    numberShort: trainInfo.station_train_code,
    startingStation: trainInfo.start_station_telecode,
    endingStation: trainInfo.end_station_telecode,
    departureStation: trainInfo.from_station_telecode,
    arrivalStation: trainInfo.to_station_telecode,
    departureTime: departureTime,
    arrivalTime: arrivalTime,
    bookable: bookable,
    allLeftTickets: allTickets,
  };
}

export function parseTransferPlan(plan: any, fromStation: string, toStation: string): TransferPlan {
  return {
    departureStation: fromStation,
    transferStation: plan.middle_station_name,
    arrivalStation: toStation,
    departureTime: new Date(plan.from_time),
    arrivalTime: new Date(plan.to_time),
    totalDuration: plan.all_lishi_minutes,
    totalDurationText: plan.all_lishi,
    waitDuration: plan.wait_time_minutes,
    waitDurationText: plan.wait_time,
    firstTrain: parseTrainInfo(plan.fullList[0]),
    secondTrain: parseTrainInfo(plan.fullList[1]),
  };
}
