# Time Account App

A mobile application for tracking time entries, managing customers, and generating reports.

## What It Does

This app helps freelancers, consultants, and small businesses track their time spent on different projects and for different customers. Key features include:

- **Time Tracking**: Create and manage time entries with descriptions, durations, and timestamps
- **Customer Management**: Add, edit, and delete customer information including contact details
- **Filtering**: Filter time entries by customer and date range
- **Export**: Generate and share PDF reports of time entries with customizable date ranges
- **Data Visualization**: View time data in chart format for better insights

## Screens

### Home Screen
- Create new time entries
- View and manage existing time entries
- Filter entries by customer
- Quick access to frequently used customers

### Customer Screen
- Add new customers
- Edit customer information including:
  - Name
  - Email
  - Phone
  - Billing contact information

### Export Screen
- Select time entries to export
- Filter by customer or date range
- Generate PDF reports
- Share reports via email or other apps

## Requirements

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI

## Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd time-account-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

## Running the App

After starting the development server, you can run the app in several ways:

- **On a physical device**: Scan the QR code with the Expo Go app
- **On an emulator**: Press 'a' for Android or 'i' for iOS in the terminal
- **On the web**: Press 'w' to open in a web browser

## Project Structure

- `/screens`: Main application screens (Home, Customer, Export)
- `/components`: Reusable UI components like TabBar
- `/assets`: Images, fonts, and other static assets
- `/utils`: Utility functions including PDF generation

## Technologies Used

- React Native / Expo
- React Native Paper (UI components)
- React Navigation
- PDF generation and export functionality

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License]
