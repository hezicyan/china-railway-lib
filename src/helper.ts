import makeFetchCookie from 'fetch-cookie';
import { fetch } from 'node-fetch-native';

import {
  Fetch,
  HelperConfig,
  PurposeCodes,
  Station,
  StationNotFoundError,
  StationQuery,
  TrainInfo,
  TransferPlan,
} from './types';
import * as URLS from './urls';
import { CachedData, MemoryCache, withInit } from './utils';
import { parseStationList, parseTrainInfo } from './parser/string-parser';
import { parseTransferPlan } from './parser/json-parser';

const DEFAULT_STATION_LIST_UPDATE_INTERVAL = 24 * 60 * 60 * 1000;

/**
 * 铁路 12306 助手。
 */
export class RailwayHelper {
  readonly #fetch: Fetch;
  readonly #stationList: CachedData<Station[]>;

  /**
   * @param config - Helper 配置
   */
  constructor(config?: HelperConfig) {
    this.#fetch = config?.fetch ?? makeFetchCookie(fetch, config?.cookieJar);
    this.#fetch = withInit(this.#fetch, async (): Promise<void> => {
      await this.#fetch(URLS.RAILWAY_PREFIX);
    });

    const useCache = config?.useCache ?? MemoryCache.create;
    this.#stationList = useCache(
      this.#fetchDataStationList.bind(this),
      config?.stationListUpdateInterval ?? DEFAULT_STATION_LIST_UPDATE_INTERVAL,
    );
  }

  async #getWithParams(
    baseUrl: string,
    params: Record<string, string>,
  ): Promise<Response> {
    const url = new URL(baseUrl);
    url.search = new URLSearchParams(params).toString();
    const response = await this.#fetch(url.toString());
    return response;
  }

  async #fetchDataStationList(): Promise<Station[]> {
    const response = await this.#fetch(URLS.STATION_LIST_QUERY);
    const rawText = await response.text();
    const rawStationList: string = rawText.match(/(?<=').*(?=')/)[0];
    return parseStationList(rawStationList);
  }

  /**
   * 获得某日从指定出发地到目的地的所有列车信息。
   * @param date - 要查询的日期，格式为 'yyyy-mm-dd'
   * @param fromStation - 出发地的车站代号
   * @param toStation - 目的地的车站代号
   * @param purposeCodes - 购票类型，普通票为 'ADULT'，学生票为 '0X00'，默认为普通票
   * @returns 返回符合条件的列车信息列表
   *
   * @example
   * ```typescript
   * import { RailwayHelper, PurposeCodes } from 'china-railway-lib';
   * const helper = new RailwayHelper();
   * const standardTrainList = helper.getStandardTrainList(
   *   '2025-02-05',
   *   'BJP',
   *   'QYS',
   * ); // 查询 2025 年 2 月 5 日从北京到泉州的所有成人票列车信息
   * ```
   */
  public async getStandardTrainList(
    date: string,
    fromStation: Station | string,
    toStation: Station | string,
    purposeCodes: PurposeCodes = PurposeCodes.ADULT,
  ): Promise<TrainInfo[]> {
    const fromStationTelecode =
      typeof fromStation === 'string' ? fromStation : fromStation.telecode;
    const toStationTelecode =
      typeof toStation === 'string' ? toStation : toStation.telecode;
    const response = await this.#getWithParams(URLS.STANDARD_TRAIN_QUERY, {
      'leftTicketDTO.train_date': date,
      'leftTicketDTO.from_station': fromStationTelecode,
      'leftTicketDTO.to_station': toStationTelecode,
      purpose_codes: purposeCodes,
    });
    const json = await response.json();
    const trainInfoList: TrainInfo[] = json.data.result.map(
      (rawTrainInfo: string): TrainInfo => parseTrainInfo(rawTrainInfo, date),
    );
    return trainInfoList;
  }

  /**
   * 获得某日从指定出发地到目的地的所有同车车次变更接续方案（无需下车换乘）。
   * @param date - 要查询的日期，格式为 'yyyy-mm-dd'
   * @param fromStation - 出发地的车站代号
   * @param toStation - 目的地的车站代号
   * @returns 返回符合条件的同车车次变更接续方案列表
   *
   * @example
   * ```typescript
   * import { RailwayHelper } from 'china-railway-lib';
   * const helper = new RailwayHelper();
   * const transferPlans = helper.getTransferPlanList(
   *   '2025-02-05',
   *   'IWP',
   *   'SJP',
   * ); // 查询 2025 年 2 月 5 日从大兴机场到石家庄的所有同车车次变更接续方案
   * ```
   */
  public async getTransferPlanList(
    date: string,
    fromStation: string,
    toStation: string,
  ): Promise<TransferPlan[]> {
    const response = await this.#getWithParams(URLS.THROUGH_TRAIN_QUERY, {
      train_date: date,
      from_station_telecode: fromStation,
      to_station_telecode: toStation,
      result_index: '0',
      can_query: 'Y',
      isShowWZ: 'Y',
      sort_type: '2',
      purpose_codes: '00',
      is_loop_transfer: 'S',
      channel: 'E',
      _json_att: '',
    });
    const json = await response.json();
    return json.data.middleList.map(
      (plan: any): TransferPlan => parseTransferPlan(plan, fromStation, toStation),
    );
  }

  /**
   * 获得所有车站信息。
   * @returns 车站列表
   */
  public async getStationList(): Promise<Station[]> {
    return this.#stationList.get();
  }

  /**
   * 查询符合条件的唯一车站。
   * @param query - 查询条件，可以指定车站名称、电报码、拼音码、拼音首字母、拼音全拼
   * @returns 符合条件的车站信息
   *
   * @throws {@link StationNotFoundError} 如果没有找到符合条件的车站
   */
  public async queryStation(query: StationQuery): Promise<Station> {
    const stationList = await this.getStationList();
    for (const station of stationList) {
      let satisfiable = true;
      for (const key in query) {
        if (station[key] !== query[key]) {
          satisfiable = false;
          break;
        }
      }
      if (satisfiable) return station;
    }
    throw new StationNotFoundError(query);
  }

  /**
   * 查询某个城市内的所有车站。
   * @param city - 城市名称
   * @returns 该城市内的所有车站
   */
  public async queryStationsByCity(city: string): Promise<Station[]> {
    const stationList = await this.getStationList();
    const stations: Station[] = [];
    for (const station of stationList) {
      if (station.city === city) {
        stations.push(station);
      }
    }
    return stations;
  }
}
