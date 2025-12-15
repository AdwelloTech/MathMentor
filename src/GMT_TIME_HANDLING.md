# GMT Time Handling - Frontend

## Overview
All scheduled classes, bookings, and sessions in the MathMentor application use **GMT (Greenwich Mean Time)** as the standard timezone. All times are displayed with a "GMT" label to make this clear to users.

## Utilities

### `gmtTimeUtils.ts`
Central utility functions for GMT time handling:

- **`parseGMTDateTime(dateString, timeString)`** - Parse date and time as GMT
- **`formatGMTTime(dateString, timeString)`** - Format GMT time with label
- **`formatGMTTimeWithRelativeDate(dateString, timeString)`** - Format with relative dates (Today, Tomorrow)
- **`formatGMTTime12Hour(timeString)`** - 12-hour format with GMT label
- **`formatGMTTime24Hour(timeString)`** - 24-hour format with GMT label
- **`canJoinGMTSession(dateString, timeString)`** - Check if session can be joined
- **`isGMTSessionActive(dateString, startTime, endTime)`** - Check if session is active
- **`isGMTSessionEnded(dateString, endTime)`** - Check if session has ended

### `sessionUtils.ts`
Updated to use GMT for all operations:
- All time checks use GMT
- All time formatting includes GMT label
- Uses `gmtTimeUtils` functions internally

## Usage Examples

### Displaying Session Time
```typescript
import { formatGMTTimeWithRelativeDate } from '@/utils/gmtTimeUtils';

// Display session time with GMT label
const timeDisplay = formatGMTTimeWithRelativeDate(session.date, session.start_time);
// Output: "Today, 14:30 GMT" or "Tomorrow, 09:00 GMT"
```

### Checking Session Status
```typescript
import { sessionUtils } from '@/utils/sessionUtils';

// Check if session can be joined (uses GMT)
if (sessionUtils.canJoinSession(session)) {
  // Allow joining
}

// Check if session is active (uses GMT)
if (sessionUtils.isSessionActive(session)) {
  // Show active status
}
```

### Formatting Time for Display
```typescript
import { formatGMTTime12Hour } from '@/utils/gmtTimeUtils';

// Display time in 12-hour format with GMT
const timeStr = formatGMTTime12Hour("14:30");
// Output: "2:30 PM GMT"
```

## Components Updated

### Class Scheduling
- **ClassSchedulingPage**: Time slots display with GMT label
- Added GMT notice: "All times are in GMT (Greenwich Mean Time)"

### Session Display
- **SessionList**: Uses GMT formatting
- **ActiveSessionFloatingButton**: Uses GMT formatting
- All session times show GMT label

## Best Practices

1. **Always use GMT utilities** for time operations
2. **Always display GMT label** with times
3. **Never convert times** - treat all times as GMT
4. **Use UTC methods** when creating Date objects:
   ```typescript
   const date = new Date(`${dateString}T${timeString}:00Z`); // Z = UTC/GMT
   ```

## User Communication

- All time inputs should indicate they are in GMT
- All time displays should include "GMT" label
- Consider adding a tooltip or help text explaining GMT if needed














