#!/bin/bash

# Quick test to verify server is accessible from network
# Usage: ./test-server-access.sh

echo "========================================="
echo "Server Network Access Test"
echo "========================================="
echo ""

# Get server IP addresses
echo "Server IP Addresses:"
echo "---------------------------------------"
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}'
echo ""

# Get the first non-localhost IP
SERVER_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

if [ -z "$SERVER_IP" ]; then
  echo "✗ Could not determine server IP address"
  exit 1
fi

echo "Using IP: $SERVER_IP"
echo ""

# Test 1: Is server running on localhost?
echo "Test 1: Server on localhost"
echo "---------------------------------------"
if curl -s -f "http://localhost:8090/account/default/devices" > /dev/null 2>&1; then
  echo "✓ Server is running on localhost"
else
  echo "✗ Server is NOT running on localhost"
  echo "  Start server: npm start"
  exit 1
fi
echo ""

# Test 2: Is server accessible via network IP?
echo "Test 2: Server on network IP ($SERVER_IP)"
echo "---------------------------------------"
if curl -s -f "http://${SERVER_IP}:8090/account/default/devices" > /dev/null 2>&1; then
  echo "✓ Server is accessible via network IP"
else
  echo "✗ Server is NOT accessible via network IP"
  echo ""
  echo "Possible causes:"
  echo "  1. Firewall blocking port 8090"
  echo "  2. Server only listening on localhost"
  echo ""
  echo "Check what server is listening on:"
  echo "  netstat -an | grep 8090"
  echo "  lsof -i :8090"
  echo ""
  echo "Should show: *:8090 or 0.0.0.0:8090"
  echo "NOT: 127.0.0.1:8090"
  echo ""
  exit 1
fi
echo ""

# Test 3: Check what server is listening on
echo "Test 3: Server Binding"
echo "---------------------------------------"
if command -v lsof > /dev/null; then
  echo "Server is listening on:"
  lsof -i :8090 | grep LISTEN
elif command -v netstat > /dev/null; then
  echo "Server is listening on:"
  netstat -an | grep 8090 | grep LISTEN
else
  echo "Cannot check (lsof/netstat not available)"
fi
echo ""

# Test 4: Firewall status (macOS)
echo "Test 4: Firewall Status (macOS)"
echo "---------------------------------------"
if [ "$(uname)" = "Darwin" ]; then
  FW_STATUS=$(sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>/dev/null)
  echo "$FW_STATUS"
  
  if echo "$FW_STATUS" | grep -q "enabled"; then
    echo ""
    echo "⚠️  Firewall is enabled"
    echo "   This might block device access"
    echo ""
    echo "To allow Node.js through firewall:"
    echo "  sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add \$(which node)"
    echo "  sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp \$(which node)"
  fi
else
  echo "Not macOS, skipping firewall check"
fi
echo ""

echo "========================================="
echo "Summary"
echo "========================================="
echo ""
echo "Server IP: $SERVER_IP"
echo "Server Port: 8090"
echo "Server URL: http://${SERVER_IP}:8090"
echo ""
echo "✓ Server is accessible from network"
echo ""
echo "Device Configuration:"
echo "---------------------------------------"
echo "Update device config to use:"
echo "  <server name=\"bmx\" url=\"http://${SERVER_IP}:8090\"/>"
echo "  <bmxRegistryUrl>http://${SERVER_IP}:8090</bmxRegistryUrl>"
echo "  <margeUrl>http://${SERVER_IP}:8090</margeUrl>"
echo ""
echo "Test from device:"
echo "---------------------------------------"
echo "1. Connect: telnet DEVICE_IP 17000"
echo "2. Test: wget -O- http://${SERVER_IP}:8090/account/default/devices"
echo "3. If works: Device can reach server"
echo "4. If fails: Network/firewall issue"
echo ""
echo "========================================="
echo ""
