/**
 * Timezone Utilities
 * 
 * Handles conversion between user's local timezone and GMT/UTC for storage.
 * All times are stored in GMT in the database and converted to/from user's local timezone.
 */

/**
 * Get the user's current timezone
 * @returns IANA timezone string (e.g., "Asia/Colombo", "Europe/London")
 */
export function getUserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Get the user's timezone offset in minutes
 * @returns Offset in minutes (negative for ahead of UTC, positive for behind)
 */
export function getUserTimezoneOffset(): number {
    return new Date().getTimezoneOffset();
}

/**
 * Get user's timezone abbreviation (e.g., "IST", "GMT", "EST")
 * @returns Timezone abbreviation
 */
export function getUserTimezoneAbbreviation(): string {
    const date = new Date();

    // Try to get short timezone name
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZoneName: 'shortGeneric',
            timeZone: getUserTimezone()
        });

        const parts = formatter.formatToParts(date);
        const timeZonePart = parts.find(part => part.type === 'timeZoneName');

        if (timeZonePart?.value && !timeZonePart.value.includes('+') && !timeZonePart.value.includes('-')) {
            return timeZonePart.value;
        }
    } catch (e) {
        // Fallback if shortGeneric not supported
    }

    // Fallback: try to get from long format and abbreviate
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZoneName: 'long',
            timeZone: getUserTimezone()
        });

        const parts = formatter.formatToParts(date);
        const timeZonePart = parts.find(part => part.type === 'timeZoneName');

        if (timeZonePart?.value) {
            // Extract abbreviation from long name (e.g., "India Standard Time" -> "IST")
            const words = timeZonePart.value.split(' ');
            if (words.length > 1) {
                return words.map(w => w[0]).join('');
            }
            return timeZonePart.value;
        }
    } catch (e) {
        // Final fallback
    }

    return 'Local';
}

/**
 * Convert local time to GMT for storage
 * @param dateString - Date in YYYY-MM-DD format (local date)
 * @param timeString - Time in HH:MM format (local time)
 * @returns Object with GMT date and time strings
 */
export function convertLocalToGMT(dateString: string, timeString: string): { date: string; time: string } {
    // Parse the local date and time
    const [year, month, day] = dateString.split('-').map(Number);
    const [hours, minutes] = timeString.split(':').map(Number);

    // Create a date object in local timezone
    const localDate = new Date(year, month - 1, day, hours, minutes, 0);

    // Extract GMT components
    const gmtYear = localDate.getUTCFullYear();
    const gmtMonth = String(localDate.getUTCMonth() + 1).padStart(2, '0');
    const gmtDay = String(localDate.getUTCDate()).padStart(2, '0');
    const gmtHours = String(localDate.getUTCHours()).padStart(2, '0');
    const gmtMinutes = String(localDate.getUTCMinutes()).padStart(2, '0');

    return {
        date: `${gmtYear}-${gmtMonth}-${gmtDay}`,
        time: `${gmtHours}:${gmtMinutes}`
    };
}

/**
 * Convert GMT time to local timezone for display
 * @param dateString - Date in YYYY-MM-DD format (GMT)
 * @param timeString - Time in HH:MM format (GMT)
 * @returns Object with local date and time strings
 */
export function convertGMTToLocal(dateString: string, timeString: string): { date: string; time: string } {
    // Parse GMT date and time
    const [year, month, day] = dateString.split('-').map(Number);
    const [hours, minutes] = timeString.split(':').map(Number);

    // Create a date object in UTC
    const gmtDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));

    // Extract local components
    const localYear = gmtDate.getFullYear();
    const localMonth = String(gmtDate.getMonth() + 1).padStart(2, '0');
    const localDay = String(gmtDate.getDate()).padStart(2, '0');
    const localHours = String(gmtDate.getHours()).padStart(2, '0');
    const localMinutes = String(gmtDate.getMinutes()).padStart(2, '0');

    return {
        date: `${localYear}-${localMonth}-${localDay}`,
        time: `${localHours}:${localMinutes}`
    };
}

/**
 * Format time in 12-hour format with user's timezone
 * @param timeString - Time in HH:MM format (GMT)
 * @param dateString - Optional date in YYYY-MM-DD format (GMT) for accurate conversion
 * @returns Formatted time string (e.g., "8:00 PM IST")
 */
export function formatTimeInUserTimezone12Hour(timeString: string, dateString?: string): string {
    const date = dateString || new Date().toISOString().split('T')[0];
    const local = convertGMTToLocal(date, timeString);

    const [hours, minutes] = local.time.split(':').map(Number);
    const localDate = new Date(2000, 0, 1, hours, minutes);

    const timeStr = localDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    const tzAbbr = getUserTimezoneAbbreviation();
    return `${timeStr} ${tzAbbr}`;
}

/**
 * Format time in 24-hour format with user's timezone
 * @param timeString - Time in HH:MM format (GMT)
 * @param dateString - Optional date in YYYY-MM-DD format (GMT) for accurate conversion
 * @returns Formatted time string (e.g., "20:00 IST")
 */
export function formatTimeInUserTimezone24Hour(timeString: string, dateString?: string): string {
    const date = dateString || new Date().toISOString().split('T')[0];
    const local = convertGMTToLocal(date, timeString);

    const tzAbbr = getUserTimezoneAbbreviation();
    return `${local.time} ${tzAbbr}`;
}

/**
 * Format date and time with relative date (Today, Tomorrow) in user's timezone
 * @param dateString - Date in YYYY-MM-DD format (GMT)
 * @param timeString - Time in HH:MM format (GMT)
 * @returns Formatted string (e.g., "Today, 8:00 PM IST")
 */
export function formatTimeWithRelativeDate(dateString: string, timeString: string): string {
    const local = convertGMTToLocal(dateString, timeString);
    const [year, month, day] = local.date.split('-').map(Number);
    const [hours, minutes] = local.time.split(':').map(Number);

    const localDate = new Date(year, month - 1, day, hours, minutes);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Format time
    const timeStr = localDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    const tzAbbr = getUserTimezoneAbbreviation();

    // Check if it's today
    if (
        localDate.getFullYear() === today.getFullYear() &&
        localDate.getMonth() === today.getMonth() &&
        localDate.getDate() === today.getDate()
    ) {
        return `Today, ${timeStr} ${tzAbbr}`;
    }

    // Check if it's tomorrow
    if (
        localDate.getFullYear() === tomorrow.getFullYear() &&
        localDate.getMonth() === tomorrow.getMonth() &&
        localDate.getDate() === tomorrow.getDate()
    ) {
        return `Tomorrow, ${timeStr} ${tzAbbr}`;
    }

    // Format full date
    const dateStr = localDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });

    return `${dateStr}, ${timeStr} ${tzAbbr}`;
}

/**
 * Get current time in GMT
 * @returns Object with GMT date and time strings
 */
export function getCurrentGMT(): { date: string; time: string } {
    const now = new Date();

    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');

    return {
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`
    };
}

/**
 * Check if a session can be joined (5 minutes before start time)
 * @param dateString - Date in YYYY-MM-DD format (GMT)
 * @param timeString - Time in HH:MM format (GMT)
 * @returns true if session can be joined
 */
export function canJoinSession(dateString: string, timeString: string): boolean {
    const [year, month, day] = dateString.split('-').map(Number);
    const [hours, minutes] = timeString.split(':').map(Number);

    const sessionDateTime = new Date(Date.UTC(year, month - 1, day, hours, minutes));
    const now = new Date();
    const fiveMinutesBefore = new Date(sessionDateTime.getTime() - 5 * 60 * 1000);

    return now >= fiveMinutesBefore && now <= sessionDateTime;
}

/**
 * Check if a session is currently active
 * @param dateString - Date in YYYY-MM-DD format (GMT)
 * @param startTime - Start time in HH:MM format (GMT)
 * @param endTime - End time in HH:MM format (GMT)
 * @returns true if session is active
 */
export function isSessionActive(dateString: string, startTime: string, endTime: string): boolean {
    const [year, month, day] = dateString.split('-').map(Number);
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const sessionStart = new Date(Date.UTC(year, month - 1, day, startHours, startMinutes));
    const sessionEnd = new Date(Date.UTC(year, month - 1, day, endHours, endMinutes));
    const now = new Date();

    return now >= sessionStart && now <= sessionEnd;
}

/**
 * Check if a session has ended
 * @param dateString - Date in YYYY-MM-DD format (GMT)
 * @param endTime - End time in HH:MM format (GMT)
 * @returns true if session has ended
 */
export function isSessionEnded(dateString: string, endTime: string): boolean {
    const [year, month, day] = dateString.split('-').map(Number);
    const [hours, minutes] = endTime.split(':').map(Number);

    const sessionEnd = new Date(Date.UTC(year, month - 1, day, hours, minutes));
    const now = new Date();

    return now > sessionEnd;
}
