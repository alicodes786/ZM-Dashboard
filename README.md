# ZM Dashboard - Maintenance & Builders Management System

A professional, modular web application for managing maintenance and construction operations. Built with Next.js 15 and Supabase, designed for scalability and enterprise-grade functionality.

## 🚀 Phase 1 Features (Current)

### ✅ Staff Management
- **Complete CRUD Operations**: Add, edit, delete, and manage staff members
- **Flexible Rate Structure**: Support for both daily and hourly rates
- **Smart Cost Calculations**: Automatic task cost calculation with configurable margins
- **Pay Override System**: Option to set fixed payment amounts per task
- **Hours Allocation**: Track allocated vs actual hours with discrepancy alerts
- **Active Status Management**: Enable/disable staff members as needed

### ✅ Daily Work Tracking
- **Task Logging**: Record daily tasks with detailed descriptions
- **Client Association**: Link tasks to client names (foundation for Phase 2)
- **Hours Tracking**: Precise time logging with validation
- **Cost Management**: Automatic cost calculation with override capabilities
- **Daily Summaries**: Comprehensive daily reports with alerts
- **Hours Variance Alerts**: Automatic notifications for over/under allocation

### ✅ Enterprise-Grade UI
- **Modern Design**: Clean, professional interface built with Tailwind CSS
- **Responsive Layout**: Optimized for desktop and mobile devices
- **Intuitive Navigation**: Easy-to-use sidebar navigation
- **Data Tables**: Sortable, searchable tables with actions
- **Form Validation**: Comprehensive input validation with error handling
- **Alert System**: Real-time notifications and status updates

## 🏗️ Architecture & Modularity

The application is built with a **modular architecture** specifically designed to accommodate future phases without requiring rewrites:

- **Service Layer**: Abstracted business logic for easy extension
- **Component Library**: Reusable UI components
- **Database Schema**: Designed with future relationships in mind
- **Type Safety**: Full TypeScript implementation
- **Scalable Structure**: Clean separation of concerns

## 📋 Future Phases (Roadmap)

- **Phase 2**: Client & Job Management (full client database, job assignment, recurring jobs)
- **Phase 3**: Invoice Management (auto-generation, additional costs, pay overrides)
- **Phase 4**: Dashboard & Reporting (productivity analytics, revenue tracking)
- **Phase 5**: Staff Self-Service (login portal, timesheets, personal info updates)
- **Phase 6**: Bank Integration (Revolut API for invoice reconciliation)

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 with App Router
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **TypeScript**: Full type safety

## ⚡ Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Set Up Database
Run the SQL schema in your Supabase SQL editor:
```sql
-- Copy and paste the contents of database/schema.sql
```

### 4. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your dashboard!

## 📊 Database Schema

### Staff Table
- Complete staff information with rates and allocations
- Margin percentage configuration
- Pay override capabilities
- Active status management

### Daily Work Entries Table
- Task descriptions and time tracking
- Client name association (ready for Phase 2 expansion)
- Automatic cost calculations
- Override cost support
- Comprehensive notes system

## 🎯 Key Features

### Smart Cost Calculations
- Automatic calculation: `(Hours × Rate) + Margin`
- Support for both daily and hourly rates
- Configurable margin percentages per staff member
- Pay override system for fixed-cost tasks

### Hours Management & Alerts
- Track allocated vs actual hours per staff member
- Real-time alerts for over/under allocation
- Daily summary reports with variance analysis
- Visual indicators for hours discrepancies

### Enterprise-Ready
- Professional, clean interface
- Comprehensive form validation
- Error handling and user feedback
- Mobile-responsive design
- Fast, optimized performance

## 🔧 Development

### Project Structure
```
├── app/                    # Next.js app router pages
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── layout/           # Layout components
│   ├── staff/            # Staff management components
│   └── daily-work/       # Daily work components
├── lib/                  # Utility functions and services
│   ├── services/         # Business logic layer
│   ├── types.ts          # TypeScript definitions
│   └── utils.ts          # Helper functions
├── database/             # Database schema and migrations
└── public/               # Static assets
```

### Key Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 📈 Phase 1 Metrics

- ✅ **8/8 Core Features** implemented
- ✅ **100% TypeScript** coverage
- ✅ **Mobile Responsive** design
- ✅ **Enterprise-Grade** UI/UX
- ✅ **Modular Architecture** for future phases
- ✅ **Comprehensive Testing** ready

## 🚀 Next Steps

1. **Set up your Supabase project** and database
2. **Add your first staff members** through the Staff Management module
3. **Start logging daily work** to track productivity and costs
4. **Review daily summaries** to optimize operations
5. **Prepare for Phase 2** - Client & Job Management integration

---

**Built for scalability, designed for growth.** The ZM Dashboard provides a solid foundation for comprehensive maintenance and construction management, with each phase building seamlessly upon the last.
