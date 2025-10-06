# Zen Admin Dashboard

A comprehensive admin dashboard for the Zen travel booking platform, built with Next.js, TypeScript, and Tailwind CSS.

## Features

### 🎨 Design System

- **Typography**: Red Hat Display font family
- **Color Scheme**: Orange (#FF6B35) and Blue (#2563EB) primary colors
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Modern UI**: Clean, professional interface with smooth animations

### 📊 Dashboard Overview

- Real-time analytics and key performance indicators
- Recent bookings and activity tracking
- Revenue and booking statistics
- Top destinations analysis
- Growth rate indicators

### 👥 User Management

- Complete user CRUD operations
- User role management (Admin/Customer)
- Account status and verification controls
- User activity tracking
- Advanced search and filtering

### 📅 Booking Management

- Comprehensive booking overview
- Status management (Pending, Confirmed, Cancelled, Completed)
- Customer information management
- Booking type filtering (Flight, Hotel, Car, Tour, Package)
- Date range filtering

### 💳 Payment Management

- Payment transaction tracking
- Multiple payment method support (Card, PayPal, Bank Transfer)
- Payment status management
- Revenue analytics by payment method
- Transaction search and filtering

### 🏪 Customer Management

- Customer account management
- Booking history tracking
- Customer segmentation
- Activity monitoring
- Bulk operations support

### 📈 Reports & Analytics

- **Summary Reports**: Comprehensive business overview
- **Financial Reports**: Revenue, refunds, and financial metrics
- **User Reports**: User growth and activity analysis
- **Export Options**: CSV and PDF export functionality
- **Custom Date Ranges**: Flexible reporting periods

### ⚙️ System Settings

- System performance monitoring
- Maintenance mode controls
- Backup management
- Cache clearing
- Security settings
- System alerts and notifications

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Custom CSS variables
- **Icons**: Lucide React
- **State Management**: React hooks and local state
- **API Integration**: RESTful API calls with error handling
- **Authentication**: JWT token-based authentication

## API Endpoints Used

### Admin Authentication

- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/auth/verify-token` - Token verification

### Dashboard & Analytics

- `GET /api/admin/dashboard` - Dashboard overview data
- `GET /api/admin/analytics` - Detailed analytics (overview, revenue, users)

### User Management

- `GET /api/admin/users` - List users with pagination and filtering
- `PATCH /api/admin/users` - Update user information
- `DELETE /api/admin/users` - Deactivate user accounts

### Booking Management

- `GET /api/admin/bookings` - List bookings with filtering
- `PATCH /api/admin/bookings` - Update booking status and details
- `DELETE /api/admin/bookings` - Delete bookings

### Payment Management

- `GET /api/admin/payments` - List payments with filtering
- `POST /api/admin/payments` - Create new payments
- `PATCH /api/admin/payments` - Update payment information
- `DELETE /api/admin/payments` - Delete payments

### Customer Management

- `GET /api/admin/customers` - List customers with filtering
- `POST /api/admin/customers` - Create new customers
- `PATCH /api/admin/customers` - Update customer information
- `DELETE /api/admin/customers` - Deactivate customers

### Reports

- `GET /api/admin/reports` - Generate various report types
  - `type=summary` - Business summary report
  - `type=financial` - Financial analysis report
  - `type=users` - User activity report

### System Settings

- `GET /api/admin/settings` - System status and metrics
- `POST /api/admin/settings` - System actions (backup, maintenance, etc.)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Zen backend API running

### Installation

1. **Navigate to the Zen directory**:

   ```bash
   cd Zen
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file with:

   ```env
   DATABASE_URL="your-database-url"
   JWT_SECRET="your-jwt-secret"
   NEXTAUTH_SECRET="your-nextauth-secret"
   ```

4. **Run the development server**:

   ```bash
   npm run dev
   ```

5. **Access the admin dashboard**:
   Open [http://localhost:3000/admin](http://localhost:3000/admin)

### Default Login Credentials

- **Email**: admin@zen.com
- **Password**: admin123

## Project Structure

```
Zen/app/admin/
├── layout.tsx              # Main admin layout with navigation
├── login/
│   └── page.tsx           # Admin login page
├── page.tsx               # Dashboard overview
├── users/
│   └── page.tsx           # User management
├── bookings/
│   └── page.tsx           # Booking management
├── payments/
│   └── page.tsx           # Payment management
├── customers/
│   └── page.tsx           # Customer management
├── reports/
│   └── page.tsx           # Reports and analytics
└── settings/
    └── page.tsx           # System settings
```

## Key Features Implementation

### Authentication & Security

- JWT token-based authentication
- Protected routes with automatic redirects
- Token verification on page load
- Secure logout functionality

### Responsive Design

- Mobile-first approach
- Collapsible sidebar for mobile devices
- Responsive tables with horizontal scrolling
- Touch-friendly interface elements

### Data Management

- Real-time data fetching with loading states
- Error handling with user-friendly messages
- Pagination for large datasets
- Advanced search and filtering capabilities

### User Experience

- Smooth animations and transitions
- Loading spinners and skeleton screens
- Toast notifications for actions
- Confirmation modals for destructive actions

## Customization

### Colors

The color scheme can be customized by modifying the CSS variables in `app/globals.css`:

```css
:root {
  --zen-orange: #ff6b35;
  --zen-blue: #2563eb;
  --zen-orange-light: #ff8a65;
  --zen-orange-dark: #e55100;
  --zen-blue-light: #60a5fa;
  --zen-blue-dark: #1d4ed8;
}
```

### Fonts

The Red Hat Display font is loaded from Google Fonts. To change the font, update the import in `app/globals.css` and modify the font-family declarations.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Zen travel booking platform. All rights reserved.

## Support

For support and questions, please contact the development team or create an issue in the repository.
