import os from 'os';
import { env } from '../config/env.js';

function getNetworkAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses: { name: string; address: string; isTailscale: boolean }[] = [];

  for (const [name, netInterface] of Object.entries(interfaces)) {
    if (!netInterface) continue;
    for (const iface of netInterface) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const isTailscale = iface.address.startsWith('100.') || name.includes('tailscale') || name.includes('utun');
        addresses.push({
          name,
          address: iface.address,
          isTailscale,
        });
      }
    }
  }

  return addresses;
}

function printPairingInfo() {
  const addresses = getNetworkAddresses();
  const port = env.PORT;

  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║               ARNAS Family Drive — Mobile Pairing                    ║
╚══════════════════════════════════════════════════════════════════════╝

📱 Open the ARNAS Mobile App and enter one of the endpoints below:
`);

  if (addresses.length === 0) {
    console.log(`   Local Server URL: http://localhost:${port}\n`);
  } else {
    for (const addr of addresses) {
      const tag = addr.isTailscale ? ' [Tailscale Mesh]' : ' [Local Wi-Fi / LAN]';
      console.log(`   • http://${addr.address}:${port}${tag}`);
    }
    console.log('');
  }

  console.log(`
🔐 Initial Family Admin Account:
   • Email:    ${process.env.ADMIN_EMAIL || 'abhijeet@example.com'}
   • Password: ${process.env.ADMIN_PASSWORD || 'AdminPassword123!'}

📖 Interactive API Documentation:
   • http://localhost:${port}/docs

💡 Tip:
   If your mobile phone is on the same Wi-Fi, use the [Local Wi-Fi] URL.
   If outside your home network, activate Tailscale on both devices.
════════════════════════════════════════════════════════════════════════
`);
}

printPairingInfo();
