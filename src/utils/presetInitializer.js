// Initialize default presets for devices
export function initializeDefaultPresets(device) {
  const defaultPresets = [
    {
      id: '1',
      name: 'BBC Radio 1',
      source: 'INTERNET_RADIO',
      type: 'station',
      location: 'http://stream.live.vc.bbcmedia.co.uk/bbc_radio_one',
      art: 'https://cdn-profiles.tunein.com/s24939/images/logog.png',
      createdOn: Date.now(),
      updatedOn: Date.now()
    },
    {
      id: '2',
      name: 'Chill Vibes',
      source: 'SPOTIFY',
      type: 'playlist',
      location: 'spotify:playlist:37i9dQZF1DX4WYpdgoIcn6',
      sourceAccount: 'spotify_user',
      art: 'https://i.scdn.co/image/ab67706f00000002724554ed6bed6f051d9b0bfc',
      createdOn: Date.now(),
      updatedOn: Date.now()
    },
    {
      id: '3',
      name: 'Jazz Radio',
      source: 'INTERNET_RADIO',
      type: 'station',
      location: 'http://jazz-wr01.ice.infomaniak.ch/jazz-wr01-128.mp3',
      art: 'https://cdn-profiles.tunein.com/s8379/images/logog.png',
      createdOn: Date.now(),
      updatedOn: Date.now()
    },
    {
      id: '4',
      name: 'Discover Weekly',
      source: 'SPOTIFY',
      type: 'playlist',
      location: 'spotify:user:spotify:playlist:37i9dQZEVXcQ9COmYvdajy',
      sourceAccount: 'spotify_user',
      art: 'https://i.scdn.co/image/ab67706f00000002724554ed6bed6f051d9b0bfc',
      createdOn: Date.now(),
      updatedOn: Date.now()
    },
    {
      id: '5',
      name: 'Classical Radio',
      source: 'INTERNET_RADIO',
      type: 'station',
      location: 'http://stream.live.vc.bbcmedia.co.uk/bbc_radio_three',
      art: 'https://cdn-profiles.tunein.com/s24941/images/logog.png',
      createdOn: Date.now(),
      updatedOn: Date.now()
    },
    {
      id: '6',
      name: 'Rock Classics',
      source: 'SPOTIFY',
      type: 'playlist',
      location: 'spotify:playlist:37i9dQZF1DWXRqgorJj26U',
      sourceAccount: 'spotify_user',
      art: 'https://i.scdn.co/image/ab67706f00000002724554ed6bed6f051d9b0bfc',
      createdOn: Date.now(),
      updatedOn: Date.now()
    }
  ];

  device.setPresets(defaultPresets);
  console.log(`Initialized ${defaultPresets.length} presets for ${device.name}`);
}
