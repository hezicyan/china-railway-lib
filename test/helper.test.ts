import { RailwayHelper } from '../src/helper';
import { PurposeCodes, Station, StationNotFoundError } from '../src/types';

function checkValidStation(station: Station) {
  expect(station.name).not.toBe('');
  expect(station.city).not.toBe('');
  expect(station.telecode).toMatch(/[A-Z]{3}/);
  expect(station.pinyinCode).toMatch(/[a-z]{3}/);
  expect(station.pinyinAcronym).not.toBe('');
  expect(station.pinyinFull).not.toBe('');
}

describe(RailwayHelper, (): void => {
  const helper = new RailwayHelper();

  it('should get the standard train list.', async (): Promise<void> => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    const standardTrainList = await helper.getStandardTrainList(
      date.toISOString().slice(0, 10),
      'BJP',
      'QYS',
      PurposeCodes.STUDENT,
    );
    standardTrainList.forEach((trainInfo) => {
      expect(trainInfo.numberShort).toMatch(/[CDGKLSTYZ]?\d+/);
    });
    // console.log(standardTrainList);
  });

  it('should get the transfer plan list.', async (): Promise<void> => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    const transferPlanList = await helper.getTransferPlanList(
      date.toISOString().slice(0, 10),
      'IWP',
      'SJP',
    );
    transferPlanList.forEach((transferPlan) => {
      expect(transferPlan.firstTrain.numberShort).toMatch(/[CDGKLSTYZ]?\d+/);
      expect(transferPlan.secondTrain.numberShort).toMatch(/[CDGKLSTYZ]?\d+/);
    });
    // console.log(transferPlanList);
  });

  it('should get the station list.', async (): Promise<void> => {
    const stationList = await helper.getStationList();
    stationList.forEach(checkValidStation);
  });

  it('should be able to query the station.', async (): Promise<void> => {
    const stationByName = await helper.queryStation({ name: '北京北' });
    const stationByTelecode = await helper.queryStation({ telecode: 'VAP' });
    const stationByPinyin = await helper.queryStation({
      pinyinCode: 'bjb',
      pinyinFull: 'beijingbei',
    });
    checkValidStation(stationByName);
    checkValidStation(stationByTelecode);
    checkValidStation(stationByPinyin);
    expect(stationByName).toEqual(stationByTelecode);
    expect(stationByName).toEqual(stationByPinyin);
  });

  it('should fail to query the station.', async (): Promise<void> => {
    expect(
      helper.queryStation({ name: '北京', telecode: 'VAP' }),
    ).rejects.toThrow(StationNotFoundError);
    expect(
      helper.queryStation({ name: '一个不存在的城市名称' }),
    ).rejects.toThrow(StationNotFoundError);
  });

  it('should query stations in Quanzhou.', async (): Promise<void> => {
    const stations = await helper.queryStationsByCity('泉州');
    stations.forEach((station) => {
      checkValidStation(station);
      expect(station.city).toBe('泉州');
    });
    expect(stations).toHaveLength(10);
  });
});
