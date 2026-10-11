# RestaurantIQ (local version, with login + roles)
Requires Node.js 18+.
    npm install
    npm start      # first run prints the admin password ONCE in the terminal
    npm test       # 10 automated tests
Open http://localhost:3000 and log in as `admin`. Create staff under Users.
Roles: owner (all), manager, storekeeper, cashier, accountant. Permissions are enforced in server.js (see the P table).
Stock changes + ledger rows + audit rows commit together in one SQLite transaction; CHECK(stock>=0) blocks negative stock.
Delete data.db to reset (a new admin password is generated).
Before using over a network: add HTTPS (and the cookie `Secure` flag), backups, and review SQLite vs PostgreSQL.
NOT included yet: batches/expiry, locations/transfers, camera scanning, payment gateway, full reports.
