/**
 * 指标代理器
 */

import {MessengerClient} from 'pandora-messenger';
import {AbstractIndicator} from './AbstractIndicator';
import {IndicatorResult} from './IndicatorResult';
import {IndicatorBuilderResult} from '../domain';
import {MetricsConstants} from '../MetricsConstants';
const debug = require('debug')('pandora:metrics:IndicatorProxy');

export class IndicatorProxy extends AbstractIndicator {

  name: string;
  client: MessengerClient;
  group: string;
  clientId: string;
  appName: string;

  constructor(client) {
    super();
    this.client = client;
  }

  bindRemove(removeProcess) {
    this.client.on('close', () => {
      this.client = null;
      removeProcess(this);
    });
  }

  buildIndicator(data: any) {
    debug(`Binding: indicatorProxy(${data.indicatorName}) begin binding, appName = ${data.appName}, group = ${data.group}, clientId = ${data.clientId}`);
    this.name = data.indicatorName;
    this.appName = data.appName;
    this.group = data.group;
    this.clientId = data.clientId;
    this.type = data.type;
  }

  invoke(args?: any) {
    return new Promise((resolve) => {
      debug(`Invoke: eventKey(${this.getClientDownlinkKey()}), args = ${args}`);
      this.client.send(this.getClientDownlinkKey(), args, (err, results: Array<IndicatorBuilderResult>) => {
        let indicatorResult = new IndicatorResult(this);
        if(err) {
          indicatorResult.setErrorMessage(err);
        } else {
          indicatorResult.setResult(results);
        }
        resolve(indicatorResult);
      }, MetricsConstants.CLIENT_TIME_OUT);
    });
  }

  match(appName, name?) {
    if(name) {
      return appName === this.appName && name === this.name;
    } else {
      if(MetricsConstants.METRICS_DEFAULT_APP === appName) {
        return true;
      }
      return appName === this.appName;
    }
  }

  destory() {
    this.client && this.client.close();
  }

}
