# Unique User Tracking Implementation Guide

## 📋 Overview

This document outlines the complete implementation of off-chain unique user tracking for the CrossEra project. The system tracks unique users per project when transaction hashes are submitted and processed through the API.

## 🏗️ Architecture

### **Flow Diagram**
```
Project Submits Hash → API Decodes app_id → Track Unique Users → Process Smart Contract → Return Results
```

### **Key Components**
1. **Database Schema**: New tables for unique user tracking
2. **API Routes**: Enhanced `/api/submit` with user tracking
3. **Database Functions**: Stored procedures for user aggregation
4. **Frontend Components**: UI components for displaying user stats
5. **Analytics APIs**: Endpoints for user analytics

---

## 📊 Database Schema

### **1. New Tables**

#### `project_unique_users`
```sql
CREATE TABLE project_unique_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_address VARCHAR(42) NOT NULL,
    first_transaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_transaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_transactions INTEGER DEFAULT 1,
    total_volume VARCHAR(50) DEFAULT '0',
    total_fees VARCHAR(50) DEFAULT '0',
    total_rewards VARCHAR(50) DEFAULT '0',
    
    CONSTRAINT unique_project_user UNIQUE(project_id, user_address)
);
```

#### `project_user_stats`
```sql
CREATE TABLE project_user_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    unique_users_count INTEGER DEFAULT 0,
    total_users_transactions INTEGER DEFAULT 0,
    total_users_volume VARCHAR(50) DEFAULT '0',
    total_users_fees VARCHAR(50) DEFAULT '0',
    total_users_rewards VARCHAR(50) DEFAULT '0',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_project_stats UNIQUE(project_id)
);
```

### **2. Enhanced Tables**

#### `transactions` (New Columns)
```sql
ALTER TABLE transactions ADD COLUMN user_address VARCHAR(42);
ALTER TABLE transactions ADD COLUMN is_unique_user BOOLEAN DEFAULT FALSE;
```

### **3. Database Functions**

#### Insert New Unique User
```sql
CREATE OR REPLACE FUNCTION insert_new_unique_user(
    p_project_id UUID,
    p_user_address VARCHAR(42),
    p_transaction_volume VARCHAR(50),
    p_transaction_fees VARCHAR(50),
    p_transaction_rewards VARCHAR(50)
)
RETURNS VOID AS $$
-- Implementation in schema file
$$ LANGUAGE plpgsql;
```

#### Update Existing User Stats
```sql
CREATE OR REPLACE FUNCTION update_existing_user_stats(
    p_project_id UUID,
    p_user_address VARCHAR(42),
    p_transaction_volume VARCHAR(50),
    p_transaction_fees VARCHAR(50),
    p_transaction_rewards VARCHAR(50)
)
RETURNS VOID AS $$
-- Implementation in schema file
$$ LANGUAGE plpgsql;
```

---

## 🔧 API Implementation

### **Enhanced Submit Route (`/api/submit`)**

The main transaction processing route now includes unique user tracking:

```typescript
// BEFORE smart contract processing
const userAddress = tx.from.toLowerCase();
const isNewUniqueUser = !existingUser;

if (isNewUniqueUser) {
  await supabase.rpc('insert_new_unique_user', {
    p_project_id: projectId,
    p_user_address: userAddress,
    p_transaction_volume: transactionValue.toString(),
    p_transaction_fees: feeGenerated.toString(),
    p_transaction_rewards: finalReward.toString()
  });
} else {
  await supabase.rpc('update_existing_user_stats', {
    p_project_id: projectId,
    p_user_address: userAddress,
    p_transaction_volume: transactionValue.toString(),
    p_transaction_fees: feeGenerated.toString(),
    p_transaction_rewards: finalReward.toString()
  });
}
```

### **New API Endpoints**

#### 1. Project User Stats (`/api/projects/[appId]/user-tracking/user-stats`)
```typescript
GET /api/projects/{appId}/user-tracking/user-stats
// Returns: user statistics, growth metrics, daily growth data
```

#### 2. Project Users (`/api/projects/[appId]/user-tracking/users`)
```typescript
GET /api/projects/{appId}/user-tracking/users?limit=50&offset=0
// Returns: paginated list of unique users with their stats
```

#### 3. Global User Analytics (`/api/projects/user-analytics`)
```typescript
GET /api/projects/user-analytics?sortBy=unique_users_count&sortOrder=desc
// Returns: all projects with user analytics, global statistics
```

---

## 🎨 Frontend Components

### **1. UniqueUsersWidget**
```typescript
<UniqueUsersWidget appId={appId} />
// Displays: unique users count, growth rate, engagement metrics
```

### **2. UniqueUsersWidgetCompact**
```typescript
<UniqueUsersWidgetCompact appId={appId} />
// Displays: simple user count for cards and lists
```

### **3. UniqueUsersAnalytics**
```typescript
<UniqueUsersAnalytics appId={appId} />
// Displays: comprehensive analytics with tabs (Overview, Users, Growth)
```

### **4. Enhanced ProjectCard**
```typescript
// Now includes unique user count in project cards
<ProjectCard project={project} />
// Shows: unique users alongside transactions and rewards
```

### **5. Enhanced StatsWidget**
```typescript
// Dashboard stats now include unique users
<StatsWidget 
  totalUniqueUsers={totalUniqueUsers}
  // ... other props
/>
```

---

## 📈 Analytics Features

### **Overview Tab**
- **Key Metrics**: Unique users, transactions, avg per user, daily growth
- **Volume & Rewards**: Total volume, fees, rewards from users
- **Growth Metrics**: Days active, avg daily growth, project age
- **User Engagement**: Average transactions per user

### **Users Tab**
- **Top Users Table**: Ranked by activity with pagination
- **User Details**: Address, transaction count, volume, first/last seen
- **Export Capability**: Download user data (future feature)

### **Growth Tab**
- **Daily Growth Chart**: Last 30 days of new unique users
- **Growth Trends**: Visual representation of user acquisition
- **Historical Data**: Track user growth over time

---

## 🧪 Testing

### **Test Script**
```bash
# Run the comprehensive test suite
node scripts/test-unique-user-tracking.js
```

### **Test Coverage**
1. **Database Schema**: Table existence, column validation
2. **Unique User Functions**: Insert/update operations
3. **API Endpoints**: Response validation, data accuracy
4. **Data Consistency**: Unique user counting accuracy

### **Test Scenarios**
- ✅ New user insertion
- ✅ Existing user updates
- ✅ Duplicate user handling
- ✅ Multi-project user tracking
- ✅ Data aggregation accuracy

---

## 🚀 Deployment Steps

### **1. Database Migration**
```bash
# Run the schema migration
psql -d your_database -f docs/unique-users-schema.sql
```

### **2. Environment Variables**
```bash
# Ensure these are set in your .env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### **3. Code Deployment**
```bash
# Deploy the updated codebase
git add .
git commit -m "Add unique user tracking system"
git push origin main
```

### **4. Verification**
```bash
# Run tests to verify implementation
node scripts/test-unique-user-tracking.js
```

---

## 📊 Usage Examples

### **API Response Example**
```json
{
  "success": true,
  "message": "Transaction processed successfully",
  "data": {
    "userTracking": {
      "userAddress": "0x1234...5678",
      "isNewUniqueUser": true,
      "uniqueUsersCount": 45,
      "totalUsersTransactions": 123
    },
    "metrics": {
      "gasUsed": "21000",
      "feeGenerated": "0.001 XFI",
      "estimatedReward": "0.0001 XFI"
    }
  }
}
```

### **Frontend Integration Example**
```typescript
// In a React component
const [userStats, setUserStats] = useState(null);

useEffect(() => {
  const fetchStats = async () => {
    const response = await fetch(`/api/projects/${appId}/user-tracking/user-stats`);
    const result = await response.json();
    setUserStats(result.data.userStats);
  };
  
  fetchStats();
}, [appId]);

return (
  <div>
    <h2>Unique Users: {userStats?.uniqueUsersCount}</h2>
    <p>Avg Transactions per User: {userStats?.avgTransactionsPerUser}</p>
  </div>
);
```

---

## 🔍 Monitoring & Maintenance

### **Key Metrics to Monitor**
- **Unique User Growth Rate**: Track daily/weekly new users
- **User Engagement**: Average transactions per user
- **Data Accuracy**: Verify unique user counts match expectations
- **API Performance**: Monitor response times for analytics endpoints

### **Maintenance Tasks**
- **Weekly**: Review unique user growth trends
- **Monthly**: Analyze user engagement patterns
- **Quarterly**: Optimize database queries and indexes

### **Troubleshooting**
- **Duplicate Users**: Check for case sensitivity issues in addresses
- **Missing Stats**: Verify database functions are working correctly
- **API Errors**: Check Supabase connection and permissions

---

## 🎯 Benefits

### **For Projects**
- **User Acquisition Tracking**: Monitor unique user growth
- **Engagement Analytics**: Understand user behavior patterns
- **Competitive Insights**: Compare with other projects

### **For Platform**
- **Better Metrics**: More accurate user engagement data
- **Campaign Optimization**: Improve reward distribution based on user metrics
- **Analytics Dashboard**: Rich insights for platform users

### **For Users**
- **Transparent Metrics**: See real user engagement data
- **Better Rewards**: More accurate reward calculations based on unique users
- **Growth Tracking**: Monitor project adoption over time

---

## 🔮 Future Enhancements

### **Planned Features**
- **User Segmentation**: Group users by behavior patterns
- **Retention Analytics**: Track user return rates
- **Geographic Distribution**: Map user locations (if available)
- **Export Functionality**: Download user data for analysis

### **Advanced Analytics**
- **Cohort Analysis**: Track user groups over time
- **Funnel Analysis**: Understand user journey through the platform
- **Predictive Analytics**: Forecast user growth trends

---

## 📝 Conclusion

The unique user tracking system provides comprehensive off-chain analytics for the CrossEra platform. By tracking unique users at the transaction level, projects can gain valuable insights into their user base and engagement patterns.

The implementation is designed to be:
- **Scalable**: Efficient database queries and pagination
- **Accurate**: Proper unique user counting and aggregation
- **User-Friendly**: Rich analytics dashboard and widgets
- **Maintainable**: Well-structured code and comprehensive testing

This system enhances the platform's value proposition by providing detailed user analytics that help projects understand their adoption and engagement metrics.
