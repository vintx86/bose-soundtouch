import { Builder } from 'xml2js';

export class TrackInfoController {
  constructor(deviceManager) {
    this.deviceManager = deviceManager;
  }

  async getTrackInfo(req, res) {
    const device = this.deviceManager.getDevice(req.query.deviceId);
    if (!device) {
      return res.status(404).send('<error>Device not found</error>');
    }

    const nowPlaying = device.getNowPlaying();
    const builder = new Builder({ rootName: 'trackInfo' });

    if (!nowPlaying) {
      res.set('Content-Type', 'application/xml');
      return res.send('<trackInfo/>');
    }

    const data = {
      track: nowPlaying.track || '',
      artist: nowPlaying.artist || '',
      album: nowPlaying.album || '',
      stationName: nowPlaying.stationName || '',
      art: nowPlaying.art || '',
      duration: nowPlaying.duration || 0,
      position: nowPlaying.position || 0,
      playStatus: nowPlaying.playStatus || 'PLAY_STATE',
      streamType: nowPlaying.streamType || 'TRACK_ONDEMAND',
      trackID: nowPlaying.trackID || '',
      artistID: nowPlaying.artistID || '',
      albumID: nowPlaying.albumID || ''
    };

    res.set('Content-Type', 'application/xml');
    res.send(builder.buildObject(data));
  }
}
