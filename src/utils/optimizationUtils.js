// utils/optimizationUtils.js

/**
 * Calculate time savings between original and optimized processes
 * @param {string} originalTime - Original time estimate (e.g., "2 hours 30 minutes")
 * @param {string} optimizedTime - Optimized time estimate (e.g., "1 hour 45 minutes")
 * @returns {Object} - Time savings in minutes and percentage
 */
export function calculateTimeSavings(originalTime, optimizedTime) {
    // Parse times to minutes
    const originalMinutes = parseTimeToMinutes(originalTime);
    const optimizedMinutes = parseTimeToMinutes(optimizedTime);

    if (originalMinutes === null || optimizedMinutes === null) {
        return { minutes: null, percentage: null, formatted: null };
    }

    const savedMinutes = originalMinutes - optimizedMinutes;
    const percentage = (savedMinutes / originalMinutes) * 100;

    return {
        minutes: savedMinutes,
        percentage: percentage,
        formatted: formatMinutesToTime(savedMinutes)
    };
}

/**
 * Parse time string to minutes
 * @param {string} timeString - Time string (e.g., "2 hours 30 minutes", "45 min", "1.5 hours")
 * @returns {number|null} - Time in minutes or null if parsing failed
 */
export function parseTimeToMinutes(timeString) {
    if (!timeString || timeString === "Unknown") return null;

    let totalMinutes = 0;

    // Try to extract hours and minutes using regex
    const hoursPattern = /(\d+(?:\.\d+)?)\s*(hour|hr|h)s?/i;
    const minutesPattern = /(\d+(?:\.\d+)?)\s*(minute|min|m)s?/i;
    const daysPattern = /(\d+(?:\.\d+)?)\s*(day|d)s?/i;

    // Extract hours
    const hoursMatch = timeString.match(hoursPattern);
    if (hoursMatch) {
        totalMinutes += parseFloat(hoursMatch[1]) * 60;
    }

    // Extract minutes
    const minutesMatch = timeString.match(minutesPattern);
    if (minutesMatch) {
        totalMinutes += parseFloat(minutesMatch[1]);
    }

    // Extract days (assuming 8-hour workday)
    const daysMatch = timeString.match(daysPattern);
    if (daysMatch) {
        totalMinutes += parseFloat(daysMatch[1]) * 8 * 60;
    }

    // If no patterns matched but there's a number, assume it's minutes
    if (totalMinutes === 0) {
        const justNumber = timeString.match(/(\d+(?:\.\d+)?)/);
        if (justNumber) {
            totalMinutes = parseFloat(justNumber[1]);
        }
    }

    return totalMinutes > 0 ? totalMinutes : null;
}

/**
 * Format minutes to readable time string
 * @param {number} minutes - Time in minutes
 * @returns {string} - Formatted time string
 */
export function formatMinutesToTime(minutes) {
    if (minutes === null || isNaN(minutes)) return "Unknown";

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);

    if (hours === 0) {
        return `${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
    } else if (remainingMinutes === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
        return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
    }
}

/**
 * Analyze and group similar steps that could be combined
 * @param {Array} steps - Array of process steps
 * @returns {Array} - Grouped steps that could be combined
 */
export function findRedundantSteps(steps) {
    if (!Array.isArray(steps) || steps.length === 0) return [];

    const groups = [];
    const approvalSteps = steps.filter(step =>
        typeof step.stepName === 'string' &&
        step.stepName.toLowerCase().includes('approv')
    );

    // Group similar approval steps
    if (approvalSteps.length > 1) {
        groups.push({
            type: 'approval',
            steps: approvalSteps,
            suggestion: 'Consider consolidating multiple approval steps into a single approval workflow'
        });
    }

    // Find review steps that could be combined
    const reviewSteps = steps.filter(step =>
        typeof step.stepName === 'string' &&
        (step.stepName.toLowerCase().includes('review') ||
            step.stepName.toLowerCase().includes('check'))
    );

    if (reviewSteps.length > 1) {
        groups.push({
            type: 'review',
            steps: reviewSteps,
            suggestion: 'Consider combining multiple review steps into a single comprehensive review'
        });
    }

    return groups;
}