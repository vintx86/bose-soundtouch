import { Builder } from 'xml2js';

export class SourceController {
  constructor(deviceManager) {
    this.deviceManager = deviceManager;
  }

  async getSources(req, res) {
    const device = this.deviceManager.getDevice(req.query.deviceId);
    if (!device) {
      return res.status(404).send('<error>Device not found</error>');
    }

    const builder = new Builder({ rootName: 'sources' });

    const sourcesData = {
      sourceItem: [
        {
          $: { 
            source: 'INTERNET_RADIO',
            sourceAccount: '',
            status: 'READY',
            isLocal: 'false',
            multiroomallowed: 'true'
          },
          _: 'INTERNET_RADIO'
        },
        {
          $: { 
            source: 'SPOTIFY',
            sourceAccount: 'spotify_user',
            status: 'READY',
            isLocal: 'false',
            multiroomallowed: 'true'
          },
          _: 'SPOTIFY'
        },
        {
          $: { 
            source: 'STORED_MUSIC',
            sourceAccount: '',
            status: 'READY',
            isLocal: 'true',
            multiroomallowed: 'true'
          },
          _: 'STORED_MUSIC'
        },
        {
          $: { 
            source: 'BLUETOOTH',
            sourceAccount: '',
            status: 'READY',
            isLocal: 'true',
            multiroomallowed: 'false'
          },
          _: 'BLUETOOTH'
        },
        {
          $: { 
            source: 'AUX',
            sourceAccount: '',
            status: 'READY',
            isLocal: 'true',
            multiroomallowed: 'false'
          },
          _: 'AUX'
        }
      ]
    };

    res.set('Content-Type', 'application/xml');
    res.send(builder.buildObject(sourcesData));
  }
}
