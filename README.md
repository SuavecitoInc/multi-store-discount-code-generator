# Discount Code Generator

> This tool is designed to generate and manage discount codes for Shopify stores. It allows you to create new discount codes, top up existing ones, and export them for use in marketing campaigns.

<p align="center">
  <img src="./discount-code-generator-app-icon.png" alt="Discount Code Generator App Icon" width="300" height="300">
</p>

## Features

- Generate unique discount codes with a specified prefix.
- Top up existing discount codes for multiple Shopify stores.
- Export discount codes to a CSV file for easy integration with marketing platforms like Klaviyo.

## Usage

1. Clone the repository:
   ```bash
   git clone git@github.com:SuavecitoInc/multi-store-discount-code-generator.git
   cd multi-store-discount-code-generator
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your Shopify app in the Shopify Dev Dashboard
   - Create App > Start From Dev Dashboard
   - Install the app on both stores
4. Set up your environment variables in a `.env` file:
   ```env
   CLIENT_ID=your_app_client_id
   CLIENT_SECRET=your_app_client_secret
   STORE_A_DOMAIN=store-a.myshopify.com
   STORE_B_DOMAIN=store-b.myshopify.com
   ```
5. Rename the config files from `config/example-admin.json` to `config/admin.json` and `config/example-discount-config.json` to `config/discount-config.json`. Run the tool to generate the necessary config files:
   ```bash
   npm run setup
   ```
6. Run the tool to generate new discount codes:
   ```bash
   npm run create
   ```
7. Run the tool to top up discount codes:
   ```bash
   npm run top-up
   ```
