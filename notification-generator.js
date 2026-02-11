// CLEARNEXT Notification Generator System
class NotificationGenerator {
    constructor() {
        this.user = JSON.parse(localStorage.getItem('clearnext_user') || '{}');
    }

    // DAILY NOTIFICATION
    generateDailyNotification(dailyMood = null) {
        const userProfile = this.user.profile || {};
        const today = new Date().toDateString();
        const todayProgress = this.user.dailyProgress?.[today];

        // Don't send if task already completed
        if (todayProgress?.reflectionCompleted) {
            return null;
        }

        const notifications = {
            gentle: [
                "Time for today's gentle reflection",
                "Your learning moment awaits",
                "A quiet moment for growth today",
                "Today's thoughtful task is ready",
                "Your journey continues softly"
            ],
            focused: [
                "Today's learning task is ready",
                "Complete your reflection now",
                "Your growth task awaits",
                "Today's 30-minute challenge",
                "Time for meaningful progress"
            ],
            encouraging: [
                "You've got this today!",
                "Another step forward awaits",
                "Your consistency builds success",
                "Today's task will help you grow",
                "Keep your momentum going"
            ]
        };

        // Select tone based on user type and mood
        let tone = 'gentle';
        if (userProfile.struggleType?.toLowerCase().includes('motivation')) {
            tone = 'encouraging';
        } else if (userProfile.status?.toLowerCase().includes('professional')) {
            tone = 'focused';
        } else if (dailyMood?.toLowerCase() === 'good') {
            tone = 'focused';
        } else if (dailyMood?.toLowerCase() === 'low') {
            tone = 'gentle';
        }

        const messages = notifications[tone] || notifications.gentle;
        return messages[Math.floor(Math.random() * messages.length)];
    }

    // MISSED DAY NOTIFICATION
    generateMissedDayNotification() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        const yesterdayProgress = this.user.dailyProgress?.[yesterdayStr];

        // Only send if yesterday was missed (not completed)
        if (yesterdayProgress?.reflectionCompleted) {
            return null;
        }

        const missedMessages = [
            "Yesterday was missed, but today is a new start",
            "No pressure - just begin again today",
            "Every day is a fresh opportunity",
            "Yesterday doesn't define today",
            "Ready to try again? Today awaits",
            "Missed days happen. Today matters",
            "New day, fresh start, you've got this",
            "Let's make today count together"
        ];

        return missedMessages[Math.floor(Math.random() * missedMessages.length)];
    }

    // Generate notification with all context
    generateNotification(notificationType = 'daily', dailyMood = null) {
        switch (notificationType) {
            case 'daily':
                return this.generateDailyNotification(dailyMood);
            case 'missed':
                return this.generateMissedDayNotification();
            default:
                return this.generateDailyNotification(dailyMood);
        }
    }

    // Check if notification should be sent
    shouldSendNotification(notificationType = 'daily') {
        const today = new Date().toDateString();
        const lastNotification = this.user.lastNotificationDate;

        // Don't send multiple notifications in same day
        if (lastNotification === today) {
            return false;
        }

        if (notificationType === 'daily') {
            // Check if today's task is completed
            const todayProgress = this.user.dailyProgress?.[today];
            return !todayProgress?.reflectionCompleted;
        }

        if (notificationType === 'missed') {
            // Check if yesterday was missed
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toDateString();
            const yesterdayProgress = this.user.dailyProgress?.[yesterdayStr];
            return !yesterdayProgress?.reflectionCompleted;
        }

        return true;
    }

    // Save notification sent status
    markNotificationSent(notificationType = 'daily') {
        const today = new Date().toDateString();
        this.user.lastNotificationDate = today;
        this.user.lastNotificationType = notificationType;
        localStorage.setItem('clearnext_user', JSON.stringify(this.user));
    }

    // Get notification title and body for browser notifications
    getBrowserNotification(notificationType = 'daily', dailyMood = null) {
        const message = this.generateNotification(notificationType, dailyMood);
        
        if (!message) return null;

        const titles = {
            daily: "📚 CLEARNEXT - Daily Reminder",
            missed: "🌅 CLEARNEXT - New Day"
        };

        const icons = {
            daily: "📝",
            missed: "🌱"
        };

        return {
            title: titles[notificationType] || titles.daily,
            body: message,
            icon: icons[notificationType] || icons.daily,
            tag: `clearnext-${notificationType}`,
            requireInteraction: false,
            actions: notificationType === 'daily' ? [
                {
                    action: 'start',
                    title: 'Start Task'
                },
                {
                    action: 'dismiss',
                    title: 'Later'
                }
            ] : []
        };
    }

    // Get user's preferred notification time
    getNotificationTime() {
        return this.user.profile?.notification || '9:00 AM';
    }

    // Check if it's time to send notification
    isNotificationTime() {
        const now = new Date();
        const notificationTime = this.getNotificationTime();
        const [time, period] = notificationTime.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        
        let notificationHour = hours;
        if (period === 'PM' && hours !== 12) {
            notificationHour += 12;
        } else if (period === 'AM' && hours === 12) {
            notificationHour = 0;
        }

        const notificationDateTime = new Date(now);
        notificationDateTime.setHours(notificationHour, parseInt(minutes), 0, 0);

        // Check if current time is within 30 minutes of notification time
        const timeDiff = Math.abs(now - notificationDateTime);
        const thirtyMinutes = 30 * 60 * 1000;

        return timeDiff <= thirtyMinutes;
    }

    // Smart notification logic
    generateSmartNotification() {
        const today = new Date().toDateString();
        const dailyMood = this.user.dailyProgress?.[today]?.mood;

        // First check for missed day
        if (this.shouldSendNotification('missed')) {
            const missedNotification = this.generateMissedDayNotification();
            if (missedNotification) {
                this.markNotificationSent('missed');
                return {
                    type: 'missed',
                    message: missedNotification,
                    priority: 'high'
                };
            }
        }

        // Then check for daily notification
        if (this.shouldSendNotification('daily')) {
            const dailyNotification = this.generateDailyNotification(dailyMood);
            if (dailyNotification) {
                this.markNotificationSent('daily');
                return {
                    type: 'daily',
                    message: dailyNotification,
                    priority: 'normal'
                };
            }
        }

        return null;
    }
}

// Make NotificationGenerator available globally
window.NotificationGenerator = NotificationGenerator;
