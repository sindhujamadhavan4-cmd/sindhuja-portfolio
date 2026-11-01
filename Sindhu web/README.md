# Sindhu Restaurant Website (CRUD + Billing)

This is a **no-install** website (pure HTML/CSS/JS) for:
- Menu with items (Idly, Puttu, Poori, Coffee, Dosai, Vadai, Pazhampori)
- **CRUD** (Manage Menu)
- **Cart + Billing** (click item → add to cart → bill updates)
- **Pay Now** (QR code)
- **Print bill**
- **Clear cart**
- **Monthly sales report** (saved from completed orders)

## Run (Windows)
1. Open the folder `Sindhu web`
2. Double-click `index.html`

## How to use
- **POS tab**:
  - Click any menu item to add to cart
  - Use + / − to change quantity
  - Set Tax % if needed
  - **Pay now (QR)** → enter your UPI ID → scan QR
  - After payment, click **Complete order** (this saves to report)
  - **Print bill** prints the current cart
  - **Clear cart** empties the cart

- **Manage Menu tab**:
  - Add / Edit / Delete items
  - Changes are saved in your browser (localStorage)

- **Monthly Report tab**:
  - Select month
  - View total orders, items sold, revenue
  - Export CSV

## Notes
- Data is stored in your browser using **localStorage**.
- If you clear browser data, menu and reports reset.

