# ARNAS Remote Access & Family Networking Guide

ARNAS is built to be accessible anywhere in the world while ensuring your family's personal photos, videos, and documents remain 100% private.

Below are the 3 recommended networking architectures in order of security and ease of setup.

---

## 🏆 Option 1: Tailscale (Recommended — 100% Private, Zero Open Ports)

**Tailscale** creates a secure WireGuard-based encrypted mesh network (tailnet) connecting your host server and your family’s mobile phones.

### Advantages:
* **Zero Port Forwarding**: Never expose your home router IP to the public internet.
* **Encrypted WireGuard**: Military-grade point-to-point encryption between phones and server.
* **MagicDNS**: Access the drive via clean URLs like `http://arnas:8080` or `https://arnas.my-tailnet.ts.net`.
* **Free**: Free for personal/family use with up to 100 connected devices.

### Step-by-Step Setup:

1. **Install Tailscale on the Host Server (Mac / Linux):**
   ```bash
   # On macOS
   brew install --cask tailscale
   # Or on Ubuntu/Debian server:
   curl -fsSL https://tailscale.com/install.sh | sh
   ```
2. Authenticate the host server:
   ```bash
   sudo tailscale up --ssh
   ```
   Note the Tailscale 100.x.y.z IP assigned to your server (e.g. `100.85.12.34`) or MagicDNS name (e.g. `arnas.pigeon-galaxy.ts.net`).

3. **Install Tailscale on Family Phones:**
   - Install **Tailscale** from the Apple App Store or Google Play Store on family members' phones.
   - Sign in using the same family Tailscale account (or invite family members via Tailscale Share).
   - Toggle the VPN switch to **Connected**.

4. **Connect in ARNAS Mobile App:**
   - Open ARNAS App on mobile.
   - In the Server URL field on the login screen, enter:
     ```
     http://100.85.12.34:8080
     # or if using MagicDNS:
     http://arnas:8080
     ```
   - Tap **"Test Server Connection"** and sign in. Automatic camera roll sync will now run from anywhere on Wi-Fi or cellular!

---

## 🌐 Option 2: Cloudflare Tunnel (Custom Domain, Zero Open Ports)

If you own a custom domain (e.g., `rautcloud.com`) and prefer family members not having to install a VPN app.

### Advantages:
* No port forwarding required on home router.
* Automated enterprise-grade SSL and CDN protection.
* Clean custom domain URL (e.g. `https://drive.rautcloud.com`).

### Step-by-Step Setup:

1. In your Cloudflare Dashboard, navigate to **Zero Trust > Networks > Tunnels**.
2. Click **Create a Tunnel** named `arnas-tunnel`.
3. Run the provided docker container or command on your host:
   ```bash
   docker run -d --name cloudflared --restart unless-stopped \
     cloudflare/cloudflared:latest tunnel --no-autoupdate run --token <YOUR_TUNNEL_TOKEN>
   ```
4. In Cloudflare Tunnel settings, add a Public Hostname:
   - **Subdomain:** `drive`
   - **Domain:** `yourdomain.com`
   - **Service:** `HTTP` -> `localhost:8080` (or `arnas-server:8080` in docker network)
5. On the ARNAS Mobile App, set the Server URL to:
   ```
   https://drive.yourdomain.com
   ```

---

## 🏠 Option 3: Local LAN & mDNS (Home Wi-Fi Only)

If you only want data to synchronize when devices are connected to the home Wi-Fi network.

1. Find your host server's local IP address:
   ```bash
   # On macOS
   ipconfig getifaddr en0
   # Example: 192.168.1.150
   ```
2. (Optional) Set a DHCP static IP reservation on your home Wi-Fi router for the server MAC address so the IP never changes.
3. In the ARNAS Mobile App, set Server URL to:
   ```
   http://192.168.1.150:8080
   # or using macOS / Avahi mDNS:
   http://arnas.local:8080
   ```
