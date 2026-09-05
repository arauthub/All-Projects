# Workflow: Managing App Access & Modularity

This workflow describes how administrators can manage shop-specific feature access and modularity in the Mechanic ERP.

## Step 1: Accessing Shop Settings
1. Log in to the Wagtail Admin console (`/admin`).
2. Navigate to **Snippets** > **Shop Settings**.
3. Edit the singleton setting to update:
   - **Branding**: Shop Name, Owner Name, and Logo URL.
   - **Theming**: Choose from presets (Classic, Cyberpunk, etc.) or set custom Hex colors.
   - **Tax Info**: Update the shop's GSTIN for billing compliance.

## Step 2: Toggling Modules
1. Navigate to **Snippets** > **Module Configs**.
2. For each module (e.g., "Payroll", "Invoicing"):
   - Set **Is Active** to `True` to enable the feature in the frontend.
   - Set **Is Active** to `False` to hide the feature for that specific shop.
3. Save changes. Feature tabs in the ERP Dashboard will update dynamically upon refresh.

## Step 3: Managing Seasonal Offers
1. Navigate to **Snippets** > **Seasonal Offers**.
2. Create new offers with titles, descriptions, and validity dates.
3. Active offers will automatically appear as banners in the **New Registration** workflow to encourage service upsells.

## Implementation Details
- **Modularity**: Controlled via `isModuleActive()` in Angular, which checks the `module_name` against the configuration fetched from the API.
- **Dynamic Theming**: colors are pushed to the frontend via CSS variables (`--primary`, `--secondary`), ensuring a zero-code branding update process.
