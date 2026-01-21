import { parseStringPromise, Builder } from 'xml2js';
import axios from 'axios';

/**
 * BMX Controller - Handles TuneIn and streaming service integration
 * BMX server (bmx.bose.com) provides metadata and stream URLs for internet radio
 */
export class BMXController {
  constructor(deviceManager, storage) {
    this.deviceManager = deviceManager;
    this.storage = storage;
    
    // TuneIn API configuration
    this.tuneinApiBase = 'https://opml.radiotime.com';
    this.tuneinPartnerId = 'Bose'; // Bose's partner ID
    this.tuneinUsername = process.env.TUNEIN_USERNAME || '';
    this.tuneinPassword = process.env.TUNEIN_PASSWORD || '';
  }

  /**
   * Search TuneIn for stations
   * GET /tunein/search?query=...
   */
  async searchTuneIn(req, res) {
    const query = req.query.query || req.query.q;
    
    if (!query) {
      return res.status(400).send('<error>Search query required</error>');
    }

    console.log(`TuneIn search: ${query}`);

    try {
      const searchUrl = `${this.tuneinApiBase}/Search.ashx`;
      const params = {
        query: query,
        partnerId: this.tuneinPartnerId,
        formats: 'mp3,aac,ogg,hls'
      };

      // Add authentication if configured
      if (this.tuneinUsername) {
        params.username = this.tuneinUsername;
      }

      const response = await axios.get(searchUrl, { params });

      // Return the OPML response
      res.set('Content-Type', 'text/xml');
      res.send(response.data);
    } catch (error) {
      console.error('TuneIn search error:', error.message);
      res.status(500).send('<error>TuneIn search failed</error>');
    }
  }

  /**
   * Get TuneIn station details and stream URL
   * GET /tunein/station/:stationId
   */
  async getTuneInStation(req, res) {
    const stationId = req.params.stationId;
    
    if (!stationId) {
      return res.status(400).send('<error>Station ID required</error>');
    }

    console.log(`TuneIn station request: ${stationId}`);

    try {
      const tuneUrl = `${this.tuneinApiBase}/Tune.ashx`;
      const params = {
        id: stationId,
        partnerId: this.tuneinPartnerId,
        formats: 'mp3,aac,ogg,hls'
      };

      // Add authentication if configured
      if (this.tuneinUsername) {
        params.username = this.tuneinUsername;
      }

      const response = await axios.get(tuneUrl, { params });

      // Parse OPML to extract stream URL
      const streamUrl = this.extractStreamUrl(response.data);

      if (streamUrl) {
        // Return as ContentItem XML
        const builder = new Builder({ rootName: 'ContentItem' });
        const data = {
          $: {
            source: 'INTERNET_RADIO',
            type: 'station',
            location: streamUrl,
            stationId: stationId
          },
          itemName: `TuneIn Station ${stationId}`,
          stationName: `TuneIn Station ${stationId}`
        };

        res.set('Content-Type', 'application/xml');
        res.send(builder.buildObject(data));
      } else {
        res.status(404).send('<error>Stream URL not found</error>');
      }
    } catch (error) {
      console.error('TuneIn station error:', error.message);
      res.status(500).send('<error>TuneIn station lookup failed</error>');
    }
  }

  /**
   * Get TuneIn browse categories
   * GET /tunein/browse
   */
  async browseTuneIn(req, res) {
    const category = req.query.c || 'local'; // local, music, talk, sports, etc.
    
    console.log(`TuneIn browse: ${category}`);

    try {
      const browseUrl = `${this.tuneinApiBase}/Browse.ashx`;
      const params = {
        c: category,
        partnerId: this.tuneinPartnerId
      };

      // Add authentication if configured
      if (this.tuneinUsername) {
        params.username = this.tuneinUsername;
      }

      const response = await axios.get(browseUrl, { params });

      // Return the OPML response
      res.set('Content-Type', 'text/xml');
      res.send(response.data);
    } catch (error) {
      console.error('TuneIn browse error:', error.message);
      res.status(500).send('<error>TuneIn browse failed</error>');
    }
  }

  /**
   * Resolve preset to playable content
   * This is called when a device tries to play any preset
   * POST /bmx/resolve
   * 
   * Handles:
   * - TuneIn stations (resolve station ID to stream URL)
   * - Direct stream URLs (pass through)
   * - Spotify URIs (pass through)
   * - Other sources (pass through)
   */
  async resolveStream(req, res) {
    try {
      const xml = await parseStringPromise(req.body);
      const contentItem = xml.ContentItem;
      
      const source = contentItem.$?.source;
      const location = contentItem.$?.location;
      let stationId = contentItem.$?.stationId;

      console.log(`BMX resolve: source=${source}, location=${location}, stationId=${stationId}`);

      // Handle Spotify - pass through as-is
      if (source === 'SPOTIFY') {
        console.log('Spotify preset - passing through');
        res.set('Content-Type', 'application/xml');
        res.send(req.body);
        return;
      }

      // Handle TUNEIN source (legacy format from Bose cloud)
      // Extract station ID from location path like "/v1/playback/station/s47530"
      if (source === 'TUNEIN' || source === 'INTERNET_RADIO') {
        if (!stationId && location) {
          // Extract station ID from location path
          const stationMatch = location.match(/\/station\/(s\d+)/);
          if (stationMatch) {
            stationId = stationMatch[1];
            console.log(`Extracted station ID from location: ${stationId}`);
          }
        }

        // If we have a station ID, resolve it to a stream URL
        if (stationId && stationId.startsWith('s')) {
          try {
            console.log(`Resolving TuneIn station: ${stationId}`);
            const tuneUrl = `${this.tuneinApiBase}/Tune.ashx`;
            const params = {
              id: stationId,
              partnerId: this.tuneinPartnerId,
              formats: 'mp3,aac,ogg,hls'
            };

            if (this.tuneinUsername) {
              params.username = this.tuneinUsername;
            }

            const response = await axios.get(tuneUrl, { params });
            const streamUrl = this.extractStreamUrl(response.data);

            if (streamUrl) {
              console.log(`Resolved stream URL: ${streamUrl}`);
              // Return resolved stream URL
              const builder = new Builder({ rootName: 'ContentItem' });
              const data = {
                $: {
                  source: 'INTERNET_RADIO',
                  type: 'station',
                  location: streamUrl,
                  stationId: stationId
                },
                itemName: contentItem.itemName?.[0] || 'TuneIn Station',
                stationName: contentItem.stationName?.[0] || contentItem.itemName?.[0] || 'TuneIn Station',
                containerArt: contentItem.containerArt?.[0] || ''
              };

              res.set('Content-Type', 'application/xml');
              res.send(builder.buildObject(data));
              return;
            } else {
              console.error('Failed to extract stream URL from TuneIn response');
            }
          } catch (error) {
            console.error('TuneIn resolution error:', error.message);
          }
        }

        // If location is already a direct stream URL, pass through
        if (location && (location.startsWith('http://') || location.startsWith('https://'))) {
          console.log('Direct stream URL - passing through');
          res.set('Content-Type', 'application/xml');
          res.send(req.body);
          return;
        }
      }

      // Handle other non-internet-radio sources - pass through
      if (source && source !== 'INTERNET_RADIO' && source !== 'TUNEIN') {
        console.log(`${source} preset - passing through`);
        res.set('Content-Type', 'application/xml');
        res.send(req.body);
        return;
      }

      // Handle direct stream URLs - pass through
      if (location && (location.startsWith('http://') || location.startsWith('https://') || location.startsWith('spotify:'))) {
        console.log('Direct URL/URI preset - passing through');
        res.set('Content-Type', 'application/xml');
        res.send(req.body);
        return;
      }

      console.error('Unable to resolve stream - no valid source or location');
      res.status(400).send('<error>Unable to resolve stream</error>');
    } catch (error) {
      console.error('BMX resolve error:', error);
      res.status(500).send('<error>Resolution failed</error>');
    }
  }

  /**
   * Extract stream URL from TuneIn OPML response
   */
  extractStreamUrl(opmlData) {
    try {
      // TuneIn can return different formats:
      // 1. Plain text URLs (one per line)
      // 2. OPML XML with <outline> elements
      
      // Check if response is plain text URLs
      if (typeof opmlData === 'string') {
        // Split by newlines and find first valid URL
        const lines = opmlData.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        for (const line of lines) {
          if (line.startsWith('http://') || line.startsWith('https://')) {
            console.log(`Extracted stream URL from plain text: ${line}`);
            return line;
          }
        }
        
        // Try OPML XML format
        // Look for URL attribute in outline elements
        const urlMatch = opmlData.match(/url="([^"]+)"/);
        if (urlMatch && urlMatch[1]) {
          console.log(`Extracted stream URL from OPML: ${urlMatch[1]}`);
          return urlMatch[1];
        }

        // Alternative: look for guide_id which can be used to get stream
        const guideMatch = opmlData.match(/guide_id="([^"]+)"/);
        if (guideMatch && guideMatch[1]) {
          console.log(`Found guide_id, need another request: ${guideMatch[1]}`);
          // This is a guide ID, need another request to get actual stream
          return null;
        }
      }

      return null;
    } catch (error) {
      console.error('Error extracting stream URL:', error);
      return null;
    }
  }

  /**
   * Get TuneIn presets for a device
   * This integrates with the preset system
   * GET /bmx/presets/:deviceId
   */
  async getTuneInPresets(req, res) {
    const deviceId = req.params.deviceId;
    const accountId = req.headers['x-account-id'] || req.query.accountId || 'default';

    console.log(`TuneIn presets request for device: ${deviceId}`);

    // Load presets from storage
    const presetsXml = this.storage.loadPresets(accountId, deviceId);
    
    if (presetsXml) {
      try {
        const parsed = await parseStringPromise(presetsXml);
        
        if (parsed.presets?.preset) {
          const presetArray = Array.isArray(parsed.presets.preset) 
            ? parsed.presets.preset 
            : [parsed.presets.preset];
          
          // Filter for TuneIn/Internet Radio presets
          const tuneinPresets = presetArray.filter(p => 
            p.ContentItem?.$?.source === 'INTERNET_RADIO'
          );

          const builder = new Builder({ rootName: 'presets' });
          const data = {
            preset: tuneinPresets
          };

          res.set('Content-Type', 'application/xml');
          res.send(builder.buildObject(data));
          return;
        }
      } catch (error) {
        console.error('Error parsing presets:', error);
      }
    }

    // Return empty presets
    res.set('Content-Type', 'application/xml');
    res.send('<presets/>');
  }

  /**
   * Authenticate with TuneIn (if required)
   * POST /bmx/auth
   */
  async authenticateTuneIn(req, res) {
    try {
      const xml = await parseStringPromise(req.body);
      const username = xml.auth?.username?.[0];
      const password = xml.auth?.password?.[0];

      if (!username || !password) {
        return res.status(400).send('<error>Username and password required</error>');
      }

      console.log(`TuneIn authentication attempt for user: ${username}`);

      // Store credentials (in production, encrypt these!)
      this.tuneinUsername = username;
      this.tuneinPassword = password;

      // Test authentication with TuneIn
      try {
        const testUrl = `${this.tuneinApiBase}/Browse.ashx`;
        const params = {
          c: 'local',
          partnerId: this.tuneinPartnerId,
          username: username
        };

        await axios.get(testUrl, { params });

        // Authentication successful
        res.set('Content-Type', 'application/xml');
        res.send('<status>OK</status>');
      } catch (error) {
        console.error('TuneIn auth failed:', error.message);
        res.status(401).send('<error>Authentication failed</error>');
      }
    } catch (error) {
      console.error('Auth error:', error);
      res.status(400).send('<error>Invalid request</error>');
    }
  }
}
