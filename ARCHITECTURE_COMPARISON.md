# Architecture Comparison: Controller vs Cloud Replacement

## Mode 1: Controller Mode (Original Implementation)

```
┌─────────────────┐
│  Your Scripts   │
│  Automation     │
│  Home Assistant │
└────────┬────────┘
         │ HTTP Requests
         │ (We initiate)
         ▼
┌─────────────────────────┐
│   Our Server :8090      │
│  ┌──────────────────┐   │
│  │ Control API      │   │
│  │ - /info          │   │
│  │ - /volume        │   │
│  │ - /presets       │   │
│  │ - /setZone       │   │
│  └──────────────────┘   │
│  ┌──────────────────┐   │
│  │ In-Memory State  │   │
│  └──────────────────┘   │
└────────┬────────────────┘
         │ HTTP Requests
         │ (We send to devices)
         ▼
┌─────────────────────────┐
│  Bose Device :8090      │
│  ┌──────────────────┐   │
│  │ Device API       │   │
│  │ (responds)       │   │
│  └──────────────────┘   │
└─────────────────────────┘
         │
         │ (Device also connects to)
         ▼
┌─────────────────────────┐
│  Bose Cloud Servers     │
│  - marge.bose.com       │
│  - bmx.bose.com         │
└─────────────────────────┘
```

**Characteristics:**
- ✅ No device configuration needed
- ✅ Works alongside Bose cloud
- ✅ Perfect for automation
- ❌ State lost on restart
- ❌ Won't work after Bose shutdown

## Mode 2: Cloud Replacement Mode (Soundcork-Style)

```
┌─────────────────────────┐
│  Bose Device :8090      │
│  (Configured to use     │
│   our server)           │
└────────┬────────────────┘
         │ HTTP Requests
         │ (Device initiates)
         ▼
┌─────────────────────────────────┐
│   Our Server :8090              │
│  ┌──────────────────────────┐   │
│  │ Cloud Replacement API    │   │
│  │ - /device/register       │   │
│  │ - /device/:id/presets    │   │
│  │ - /device/:id/config     │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │ Persistent Storage       │   │
│  │ data/accounts/           │   │
│  │   └─ devices/            │   │
│  │      └─ DeviceInfo.xml   │   │
│  │         Presets.xml      │   │
│  │         Recents.xml      │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
         ▲
         │ (Replaces)
         │
┌─────────────────────────┐
│  Bose Cloud Servers     │
│  ❌ SHUT DOWN           │
│  (May 2026)             │
└─────────────────────────┘
```

**Characteristics:**
- ✅ Replaces Bose cloud
- ✅ Persistent state storage
- ✅ Auto-registration
- ✅ Works after Bose shutdown
- ⚠️ Requires device configuration

## Hybrid Mode (Both Enabled)

```
┌─────────────────┐
│  Your Scripts   │
│  Automation     │
└────────┬────────┘
         │ Control API
         ▼
┌─────────────────────────────────┐
│   Our Server :8090              │
│  ┌──────────────────────────┐   │
│  │ Control API (Mode 1)     │   │
│  │ - /info?deviceId=x       │   │
│  │ - /volume?deviceId=x     │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │ Cloud API (Mode 2)       │   │
│  │ - /device/register       │   │
│  │ - /device/:id/presets    │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │ Persistent Storage       │   │
│  └──────────────────────────┘   │
└────────┬────────────────────────┘
         ▲
         │ Device connects
         │ (Cloud replacement)
         │
┌─────────────────────────┐
│  Bose Device :8090      │
│  (Configured to use     │
│   our server)           │
└─────────────────────────┘
```

**Characteristics:**
- ✅ Best of both worlds
- ✅ Control API for automation
- ✅ Cloud replacement for devices
- ✅ Persistent storage
- ✅ Future-proof

## Device Configuration File

### Location on Device
`/opt/Bose/etc/SoundTouchSdkPrivateCfg.xml`

### Original (Points to Bose)
```xml
<server name="marge" url="https://marge.bose.com"/>
<server name="bmx" url="https://bmx.bose.com"/>
<server name="stats" url="https://stats.bose.com"/>
<server name="swUpdate" url="https://swupdate.bose.com"/>
```

### Modified (Points to Our Server)
```xml
<server name="marge" url="http://your-server.local:8090"/>
<server name="bmx" url="http://your-server.local:8090"/>
<server name="stats" url="http://your-server.local:8090"/>
<server name="swUpdate" url="http://your-server.local:8090"/>
```

## Data Flow Comparison

### Controller Mode: Set Volume

```
Script                Server              Device
  │                     │                   │
  │ POST /volume       │                   │
  │ deviceId=device1   │                   │
  ├───────────────────>│                   │
  │                     │ POST /volume     │
  │                     ├──────────────────>│
  │                     │                   │
  │                     │ <status>OK       │
  │                     │<──────────────────┤
  │ <status>OK         │                   │
  │<────────────────────┤                   │
```

### Cloud Replacement Mode: Device Boot

```
Device              Server              Storage
  │                   │                   │
  │ Boot & Read Config                   │
  │ (points to server)                   │
  │                   │                   │
  │ POST /device/register                │
  ├──────────────────>│                   │
  │                   │ Save DeviceInfo  │
  │                   ├──────────────────>│
  │                   │                   │
  │ <status>OK        │                   │
  │<──────────────────┤                   │
  │                   │                   │
  │ GET /device/x/presets                │
  ├──────────────────>│                   │
  │                   │ Load Presets.xml │
  │                   ├──────────────────>│
  │                   │ Presets.xml      │
  │                   │<──────────────────┤
  │ <presets>...      │                   │
  │<──────────────────┤                   │
```

## Storage Comparison

### Controller Mode
```
Server Memory (Volatile)
├── Device Objects
│   ├── device1
│   │   ├── volume: 50
│   │   ├── presets: [...]
│   │   └── nowPlaying: {...}
│   └── device2
│       └── ...
└── Zone Objects
    └── zone1: {master, slaves}

❌ Lost on restart
```

### Cloud Replacement Mode
```
data/ (Persistent)
└── accounts/
    └── default/
        └── devices/
            ├── device1/
            │   ├── DeviceInfo.xml
            │   ├── Presets.xml
            │   ├── Recents.xml
            │   └── Sources.xml
            └── device2/
                └── ...

✅ Survives restart
✅ Can be backed up
✅ Can be migrated
```

## Endpoint Comparison

### Controller Mode Endpoints (31)
```
GET  /info?deviceId=x
GET  /name?deviceId=x
POST /name?deviceId=x
GET  /volume?deviceId=x
POST /volume?deviceId=x
GET  /presets?deviceId=x
POST /select?deviceId=x
POST /storePreset?deviceId=x
GET  /now_playing?deviceId=x
POST /key?deviceId=x
GET  /getZone?deviceId=x
POST /setZone?deviceId=x
... (31 total)
```

### Cloud Replacement Endpoints (9)
```
POST /device/register
GET  /device/:deviceId/config
GET  /device/:deviceId/presets
POST /device/:deviceId/presets
GET  /device/:deviceId/recents
POST /device/:deviceId/recents
GET  /device/:deviceId/sources
POST /device/:deviceId/sources
GET  /account/:accountId/devices
```

### Total: 40 Endpoints

## When to Use Each Mode

### Use Controller Mode When:
- ✅ You want to control devices from scripts
- ✅ Building home automation integration
- ✅ Devices still work with Bose cloud
- ✅ No device modification desired
- ✅ Testing and development

### Use Cloud Replacement Mode When:
- ✅ Bose cloud has shut down (after May 2026)
- ✅ You want local-only operation
- ✅ You need persistent state storage
- ✅ You want device auto-registration
- ✅ Privacy is a concern

### Use Hybrid Mode When:
- ✅ You want both control and cloud replacement
- ✅ Transitioning from controller to cloud mode
- ✅ Supporting multiple use cases
- ✅ Maximum flexibility needed

## Migration Timeline

### Phase 1: Now - May 2026
```
Use Controller Mode
├── Devices work with Bose cloud
├── Use our server for automation
└── Test cloud replacement (optional)
```

### Phase 2: May 2026 Onwards
```
Switch to Cloud Replacement Mode
├── Configure devices to use our server
├── Devices no longer need Bose cloud
└── Full functionality maintained
```

## Summary

| Aspect | Controller | Cloud Replacement | Hybrid |
|--------|-----------|-------------------|--------|
| Device Config | None | Required | Required |
| Connection | Server→Device | Device→Server | Both |
| Storage | Memory | Persistent | Persistent |
| After Bose Shutdown | Limited | Full | Full |
| Automation | Excellent | Good | Excellent |
| Complexity | Low | Medium | Medium |
| Recommended | Now | After May 2026 | Best overall |
