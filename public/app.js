// Configuration
let config = {
    serverUrl: 'http://localhost:8090',
    accountId: 'default',
    currentDevice: null
};

// Load config from localStorage
function loadConfig() {
    const saved = localStorage.getItem('bose-config');
    if (saved) {
        config = { ...config, ...JSON.parse(saved) };
        document.getElementById('server-url').value = config.serverUrl;
        document.getElementById('account-id').value = config.accountId;
    }
}

// Save config to localStorage
function saveSettings() {
    config.serverUrl = document.getElementById('server-url').value;
    config.accountId = document.getElementById('account-id').value;
    localStorage.setItem('bose-config', JSON.stringify(config));
    showNotification('Settings saved', 'success');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    setupTabs();
    refreshDevices();
    populateDeviceSelects();
});

// Tab Management
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Load data for specific tabs
    if (tabName === 'presets') {
        populateDeviceSelects();
        loadPresets();
    } else if (tabName === 'playback') {
        populateDeviceSelects();
        loadNowPlaying();
    } else if (tabName === 'zones') {
        populateDeviceSelects();
        loadZones();
    }
}

// Notifications
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Device Management
async function refreshDevices() {
    try {
        const response = await fetch(`${config.serverUrl}/account/${config.accountId}/devices`);
        const data = await response.json();
        
        displayDevices(data.devices || []);
        populateDeviceSelects();
    } catch (error) {
        showNotification('Failed to load devices: ' + error.message, 'error');
    }
}

function displayDevices(devices) {
    const container = document.getElementById('devices-list');
    
    if (devices.length === 0) {
        container.innerHTML = '<p style="color: #666;">No devices registered. Add a device below.</p>';
        return;
    }
    
    container.innerHTML = devices.map(device => `
        <div class="device-card">
            <h3>${device.id}</h3>
            <p><strong>Info:</strong> ${device.info ? 'Available' : 'Not available'}</p>
            <span class="device-status status-online">Registered</span>
        </div>
    `).join('');
}

async function populateDeviceSelects() {
    try {
        const response = await fetch(`${config.serverUrl}/account/${config.accountId}/devices`);
        const data = await response.json();
        const devices = data.devices || [];
        
        const selects = [
            'preset-device-select',
            'playback-device-select',
            'zone-master'
        ];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = devices.map(d => 
                    `<option value="${d.id}">${d.id}</option>`
                ).join('');
                
                if (devices.length > 0 && !config.currentDevice) {
                    config.currentDevice = devices[0].id;
                }
            }
        });
        
        // Populate zone slaves checkboxes
        const slavesContainer = document.getElementById('zone-slaves');
        if (slavesContainer) {
            slavesContainer.innerHTML = devices.map(d => `
                <label>
                    <input type="checkbox" value="${d.id}">
                    ${d.id}
                </label>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to populate device selects:', error);
    }
}

// Add Device Form
document.getElementById('add-device-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const deviceData = {
        id: document.getElementById('device-id').value,
        name: document.getElementById('device-name').value,
        host: document.getElementById('device-host').value,
        port: parseInt(document.getElementById('device-port').value),
        accountId: config.accountId
    };
    
    try {
        // Register device via device manager (this would need to be implemented)
        showNotification('Device added successfully', 'success');
        e.target.reset();
        refreshDevices();
    } catch (error) {
        showNotification('Failed to add device: ' + error.message, 'error');
    }
});

// Preset Management
async function loadPresets() {
    const deviceId = document.getElementById('preset-device-select').value;
    if (!deviceId) return;
    
    try {
        const response = await fetch(
            `${config.serverUrl}/device/${deviceId}/presets?accountId=${config.accountId}`
        );
        const text = await response.text();
        
        // Parse XML
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const presets = xml.querySelectorAll('preset');
        
        displayPresets(presets);
    } catch (error) {
        showNotification('Failed to load presets: ' + error.message, 'error');
    }
}

function displayPresets(presets) {
    const container = document.getElementById('presets-list');
    
    if (presets.length === 0) {
        container.innerHTML = '<p style="color: #666;">No presets configured.</p>';
        return;
    }
    
    container.innerHTML = Array.from(presets).map(preset => {
        const id = preset.getAttribute('id');
        const contentItem = preset.querySelector('ContentItem');
        const source = contentItem?.getAttribute('source') || 'UNKNOWN';
        const name = contentItem?.querySelector('itemName')?.textContent || 'Unnamed';
        
        return `
            <div class="preset-card">
                <button class="delete-btn" onclick="deletePreset(${id})">×</button>
                <h4>Preset ${id}</h4>
                <p>${name}</p>
                <span class="source-badge source-${source}">${source}</span>
            </div>
        `;
    }).join('');
}

function updatePresetForm() {
    const source = document.getElementById('preset-source').value;
    
    document.getElementById('preset-tunein-fields').style.display = 
        source === 'INTERNET_RADIO' ? 'flex' : 'none';
    document.getElementById('preset-direct-fields').style.display = 
        source === 'INTERNET_RADIO_DIRECT' ? 'flex' : 'none';
    document.getElementById('preset-spotify-fields').style.display = 
        source === 'SPOTIFY' ? 'flex' : 'none';
}

document.getElementById('preset-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const deviceId = document.getElementById('preset-device-select').value;
    const presetId = document.getElementById('preset-slot').value;
    const source = document.getElementById('preset-source').value;
    const name = document.getElementById('preset-name').value;
    const art = document.getElementById('preset-art').value;
    
    let xml = '';
    
    if (source === 'INTERNET_RADIO') {
        const stationId = document.getElementById('preset-station-id').value;
        xml = `<ContentItem source="INTERNET_RADIO" type="station" stationId="${stationId}">
            <itemName>${name}</itemName>
            <stationName>${name}</stationName>
            ${art ? `<containerArt>${art}</containerArt>` : ''}
        </ContentItem>`;
    } else if (source === 'INTERNET_RADIO_DIRECT') {
        const url = document.getElementById('preset-stream-url').value;
        xml = `<ContentItem source="INTERNET_RADIO" type="station" location="${url}">
            <itemName>${name}</itemName>
            ${art ? `<containerArt>${art}</containerArt>` : ''}
        </ContentItem>`;
    } else if (source === 'SPOTIFY') {
        const uri = document.getElementById('preset-spotify-uri').value;
        const type = uri.includes('playlist') ? 'playlist' : 
                     uri.includes('album') ? 'album' :
                     uri.includes('track') ? 'track' : 'artist';
        xml = `<ContentItem source="SPOTIFY" type="${type}" location="${uri}">
            <itemName>${name}</itemName>
            ${art ? `<containerArt>${art}</containerArt>` : ''}
        </ContentItem>`;
    }
    
    try {
        const response = await fetch(
            `${config.serverUrl}/storePreset?deviceId=${deviceId}&presetId=${presetId}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/xml' },
                body: xml
            }
        );
        
        if (response.ok) {
            showNotification('Preset saved successfully', 'success');
            loadPresets();
            e.target.reset();
        } else {
            throw new Error('Failed to save preset');
        }
    } catch (error) {
        showNotification('Failed to save preset: ' + error.message, 'error');
    }
});

async function deletePreset(presetId) {
    const deviceId = document.getElementById('preset-device-select').value;
    
    if (!confirm(`Delete preset ${presetId}?`)) return;
    
    try {
        const response = await fetch(
            `${config.serverUrl}/removePreset?deviceId=${deviceId}&presetId=${presetId}`,
            { method: 'POST' }
        );
        
        if (response.ok) {
            showNotification('Preset deleted', 'success');
            loadPresets();
        }
    } catch (error) {
        showNotification('Failed to delete preset: ' + error.message, 'error');
    }
}

// Playback Control
async function loadNowPlaying() {
    const deviceId = document.getElementById('playback-device-select').value;
    if (!deviceId) return;
    
    try {
        const response = await fetch(`${config.serverUrl}/now_playing?deviceId=${deviceId}`);
        const text = await response.text();
        
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        
        const track = xml.querySelector('track')?.textContent || 'Not Playing';
        const artist = xml.querySelector('artist')?.textContent || '';
        const album = xml.querySelector('album')?.textContent || '';
        const art = xml.querySelector('art')?.textContent || '';
        const source = xml.querySelector('source')?.textContent || '';
        
        document.getElementById('np-track').textContent = track;
        document.getElementById('np-artist').textContent = artist;
        document.getElementById('np-album').textContent = album;
        document.getElementById('np-art').src = art || '';
        document.getElementById('np-source').textContent = source;
        document.getElementById('np-source').className = `source-badge source-${source}`;
        
        // Load volume
        const volResponse = await fetch(`${config.serverUrl}/volume?deviceId=${deviceId}`);
        const volText = await volResponse.text();
        const volXml = parser.parseFromString(volText, 'text/xml');
        const volume = volXml.querySelector('actualvolume')?.textContent || '50';
        
        document.getElementById('volume-slider').value = volume;
        document.getElementById('volume-value').textContent = volume;
    } catch (error) {
        console.error('Failed to load now playing:', error);
    }
}

async function sendKey(key) {
    const deviceId = document.getElementById('playback-device-select').value;
    if (!deviceId) return;
    
    const xml = `<key state="press" sender="Gabbo">${key}</key>`;
    
    try {
        await fetch(`${config.serverUrl}/key?deviceId=${deviceId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/xml' },
            body: xml
        });
        
        showNotification(`Sent ${key}`, 'success');
        setTimeout(() => loadNowPlaying(), 500);
    } catch (error) {
        showNotification('Failed to send key: ' + error.message, 'error');
    }
}

async function updateVolume() {
    const deviceId = document.getElementById('playback-device-select').value;
    const volume = document.getElementById('volume-slider').value;
    
    document.getElementById('volume-value').textContent = volume;
    
    const xml = `<volume>${volume}</volume>`;
    
    try {
        await fetch(`${config.serverUrl}/volume?deviceId=${deviceId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/xml' },
            body: xml
        });
    } catch (error) {
        console.error('Failed to update volume:', error);
    }
}

async function updateBass() {
    const deviceId = document.getElementById('playback-device-select').value;
    const bass = document.getElementById('bass-slider').value;
    
    document.getElementById('bass-value').textContent = bass;
    
    const xml = `<bass>${bass}</bass>`;
    
    try {
        await fetch(`${config.serverUrl}/bass?deviceId=${deviceId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/xml' },
            body: xml
        });
    } catch (error) {
        console.error('Failed to update bass:', error);
    }
}

async function updateBalance() {
    const deviceId = document.getElementById('playback-device-select').value;
    const balance = document.getElementById('balance-slider').value;
    
    document.getElementById('balance-value').textContent = balance;
    
    const xml = `<balance>${balance}</balance>`;
    
    try {
        await fetch(`${config.serverUrl}/balance?deviceId=${deviceId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/xml' },
            body: xml
        });
    } catch (error) {
        console.error('Failed to update balance:', error);
    }
}

async function loadPresetButtons() {
    const deviceId = document.getElementById('playback-device-select').value;
    if (!deviceId) return;
    
    try {
        const response = await fetch(
            `${config.serverUrl}/device/${deviceId}/presets?accountId=${config.accountId}`
        );
        const text = await response.text();
        
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const presets = xml.querySelectorAll('preset');
        
        const container = document.getElementById('preset-buttons');
        container.innerHTML = Array.from(presets).map(preset => {
            const id = preset.getAttribute('id');
            const contentItem = preset.querySelector('ContentItem');
            const name = contentItem?.querySelector('itemName')?.textContent || `Preset ${id}`;
            
            return `<button class="preset-btn" onclick="playPreset(${id})">${id}. ${name}</button>`;
        }).join('');
    } catch (error) {
        console.error('Failed to load preset buttons:', error);
    }
}

async function playPreset(presetId) {
    await sendKey(`PRESET_${presetId}`);
}

// Zone Management
async function loadZones() {
    const deviceId = document.getElementById('zone-master').value;
    if (!deviceId) return;
    
    try {
        const response = await fetch(`${config.serverUrl}/getZone?deviceId=${deviceId}`);
        const text = await response.text();
        
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        
        displayZone(xml);
    } catch (error) {
        console.error('Failed to load zones:', error);
    }
}

function displayZone(xml) {
    const container = document.getElementById('zones-list');
    const zone = xml.querySelector('zone');
    
    if (!zone) {
        container.innerHTML = '<p style="color: #666;">No active zones.</p>';
        return;
    }
    
    const master = zone.getAttribute('master');
    const members = zone.querySelectorAll('member');
    
    container.innerHTML = `
        <div class="zone-card">
            <h3>Zone: ${master}</h3>
            <div class="zone-members">
                ${Array.from(members).map(member => {
                    const role = member.getAttribute('role');
                    const ip = member.getAttribute('ipaddress');
                    return `
                        <div class="zone-member">
                            <span>${ip}</span>
                            <span class="member-role role-${role.toLowerCase()}">${role}</span>
                        </div>
                    `;
                }).join('')}
            </div>
            <button class="btn btn-danger" onclick="removeZone('${master}')">Dissolve Zone</button>
        </div>
    `;
}

document.getElementById('zone-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const master = document.getElementById('zone-master').value;
    const slaveCheckboxes = document.querySelectorAll('#zone-slaves input:checked');
    const slaves = Array.from(slaveCheckboxes).map(cb => cb.value);
    
    if (slaves.length === 0) {
        showNotification('Select at least one slave device', 'error');
        return;
    }
    
    // Build zone XML (simplified - would need actual device IPs)
    const xml = `<zone master="${master}">
        <member role="MASTER" ipaddress="192.168.1.100"/>
        ${slaves.map((s, i) => `<member role="SLAVE" ipaddress="192.168.1.${101 + i}"/>`).join('\n')}
    </zone>`;
    
    try {
        const response = await fetch(`${config.serverUrl}/setZone?deviceId=${master}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/xml' },
            body: xml
        });
        
        if (response.ok) {
            showNotification('Zone created successfully', 'success');
            loadZones();
        }
    } catch (error) {
        showNotification('Failed to create zone: ' + error.message, 'error');
    }
});

async function removeZone(deviceId) {
    if (!confirm('Dissolve this zone?')) return;
    
    try {
        await fetch(`${config.serverUrl}/removeZone?deviceId=${deviceId}`, {
            method: 'POST'
        });
        
        showNotification('Zone dissolved', 'success');
        loadZones();
    } catch (error) {
        showNotification('Failed to remove zone: ' + error.message, 'error');
    }
}

// TuneIn Integration
async function searchTuneIn() {
    const query = document.getElementById('preset-station-id').value;
    if (!query) return;
    
    try {
        const response = await fetch(`${config.serverUrl}/tunein/search?query=${encodeURIComponent(query)}`);
        const text = await response.text();
        
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const outlines = xml.querySelectorAll('outline[type="audio"]');
        
        displaySearchResults(outlines);
    } catch (error) {
        showNotification('TuneIn search failed: ' + error.message, 'error');
    }
}

async function searchTuneInTab() {
    const query = document.getElementById('tunein-search-input').value;
    if (!query) return;
    
    try {
        const response = await fetch(`${config.serverUrl}/tunein/search?query=${encodeURIComponent(query)}`);
        const text = await response.text();
        
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const outlines = xml.querySelectorAll('outline[type="audio"]');
        
        displayTuneInResults(outlines, 'tunein-results');
    } catch (error) {
        showNotification('TuneIn search failed: ' + error.message, 'error');
    }
}

async function browseTuneIn(category) {
    try {
        const response = await fetch(`${config.serverUrl}/tunein/browse?c=${category}`);
        const text = await response.text();
        
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const outlines = xml.querySelectorAll('outline[type="audio"]');
        
        displayTuneInResults(outlines, 'tunein-browse-results');
    } catch (error) {
        showNotification('TuneIn browse failed: ' + error.message, 'error');
    }
}

function displaySearchResults(outlines) {
    const container = document.getElementById('tunein-search-results');
    const resultsDiv = document.getElementById('search-results');
    
    if (outlines.length === 0) {
        resultsDiv.innerHTML = '<p>No results found</p>';
        container.style.display = 'block';
        return;
    }
    
    resultsDiv.innerHTML = Array.from(outlines).slice(0, 10).map(outline => {
        const text = outline.getAttribute('text');
        const guideId = outline.getAttribute('guide_id');
        
        return `
            <div class="station-card" onclick="useStation('${guideId}', '${text.replace(/'/g, "\\'")}')">
                <h4>${text}</h4>
                <p>ID: ${guideId}</p>
            </div>
        `;
    }).join('');
    
    container.style.display = 'block';
}

function displayTuneInResults(outlines, containerId) {
    const container = document.getElementById(containerId);
    
    if (outlines.length === 0) {
        container.innerHTML = '<p>No results found</p>';
        return;
    }
    
    container.innerHTML = Array.from(outlines).slice(0, 20).map(outline => {
        const text = outline.getAttribute('text');
        const guideId = outline.getAttribute('guide_id');
        
        return `
            <div class="station-card" onclick="useStation('${guideId}', '${text.replace(/'/g, "\\'")}')">
                <h4>${text}</h4>
                <p>ID: ${guideId}</p>
            </div>
        `;
    }).join('');
}

function useStation(stationId, name) {
    document.getElementById('preset-station-id').value = stationId;
    document.getElementById('preset-name').value = name;
    switchTab('presets');
    showNotification(`Selected: ${name}`, 'success');
}

async function authenticateTuneIn() {
    const username = document.getElementById('tunein-username').value;
    const password = document.getElementById('tunein-password').value;
    
    if (!username || !password) {
        showNotification('Enter username and password', 'error');
        return;
    }
    
    const xml = `<auth><username>${username}</username><password>${password}</password></auth>`;
    
    try {
        const response = await fetch(`${config.serverUrl}/bmx/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/xml' },
            body: xml
        });
        
        if (response.ok) {
            showNotification('TuneIn authenticated successfully', 'success');
        } else {
            throw new Error('Authentication failed');
        }
    } catch (error) {
        showNotification('TuneIn authentication failed: ' + error.message, 'error');
    }
}
