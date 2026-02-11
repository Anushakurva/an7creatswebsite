// CLEARNEXT Daily Notification System
class DailyNotificationSystem {
    constructor() {
        this.user = JSON.parse(localStorage.getItem('clearnext_user') || '{}');
        this.notificationTime = this.user.profile?.notification || '9:00 AM';
        this.lastNotificationDate = this.user.lastNotificationDate;
        this.isSupported = 'Notification' in window;
    }

    // Request permission for notifications
    async requestPermission() {
        if (!this.isSupported) {
            console.log('Notifications not supported in this browser');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    // Schedule daily notification
    scheduleNotification() {
        if (!this.isSupported || Notification.permission !== 'granted') {
            return;
        }

        // Clear any existing timeout
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }

        // Calculate time until next notification
        const now = new Date();
        const [time, period] = this.notificationTime.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        
        let notificationHour = hours;
        if (period === 'PM' && hours !== 12) {
            notificationHour += 12;
        } else if (period === 'AM' && hours === 12) {
            notificationHour = 0;
        }

        const notificationTime = new Date();
        notificationTime.setHours(notificationHour, minutes, 0, 0);

        // If notification time has passed today, schedule for tomorrow
        if (notificationTime <= now) {
            notificationTime.setDate(notificationTime.getDate() + 1);
        }

        const timeUntilNotification = notificationTime - now;

        // Schedule the notification
        this.notificationTimeout = setTimeout(() => {
            this.sendDailyNotification();
            // Schedule next day's notification
            this.scheduleNotification();
        }, timeUntilNotification);

        console.log(`Next notification scheduled for: ${notificationTime.toLocaleString()}`);
    }

    // Send daily notification
    sendDailyNotification() {
        const today = new Date().toDateString();
        
        // Check if notification already sent today
        if (this.lastNotificationDate === today) {
            return;
        }

        // Check if today's task is already completed
        const todayProgress = this.user.dailyProgress?.[today];
        if (todayProgress?.reflectionCompleted) {
            return;
        }

        // Use notification generator for smart notifications
        if (window.NotificationGenerator) {
            const notificationGenerator = new NotificationGenerator();
            const smartNotification = notificationGenerator.generateSmartNotification();
            
            if (smartNotification) {
                this.sendBrowserNotification(smartNotification.message, smartNotification.type);
                this.updateLastNotificationDate(today);
                return;
            }
        }

        // Fallback to original logic
        const notification = new Notification('📚 CLEARNEXT - Daily Learning Reminder', {
            body: this.getNotificationMessage(),
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📚</text></svg>',
            badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎯</text></svg>',
            tag: 'clearnext-daily',
            renotify: true,
            requireInteraction: false,
            actions: [
                {
                    action: 'start',
                    title: 'Start Learning'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ]
        });

        // Handle notification clicks
        notification.onclick = (event) => {
            event.preventDefault();
            window.focus();
            window.location.href = 'daily-reflection.html';
            notification.close();
        };

        // Handle action clicks
        notification.onclose = (event) => {
            if (event.action === 'start') {
                window.location.href = 'daily-reflection.html';
            }
        };

        // Update last notification date
        this.updateLastNotificationDate(today);
    }

    // Helper method to send browser notification
    sendBrowserNotification(message, type = 'daily') {
        if (!window.NotificationGenerator) return;
        
        const notificationGenerator = new NotificationGenerator();
        const browserNotification = notificationGenerator.getBrowserNotification(type);
        
        if (!browserNotification) return;
        
        const notification = new Notification(browserNotification.title, {
            body: browserNotification.body,
            icon: browserNotification.icon,
            tag: browserNotification.tag,
            requireInteraction: browserNotification.requireInteraction,
            actions: browserNotification.actions
        });

        // Handle notification clicks
        notification.onclick = (event) => {
            event.preventDefault();
            window.focus();
            window.location.href = 'daily-reflection.html';
            notification.close();
        };

        // Handle action clicks
        notification.onclose = (event) => {
            if (event.action === 'start') {
                window.location.href = 'daily-reflection.html';
            }
        };
    }

    // Get personalized notification message
    getNotificationMessage() {
        const today = new Date().toDateString();
        const todayProgress = this.user.dailyProgress?.[today];
        const streak = this.calculateCurrentStreak();

        if (todayProgress?.mood && !todayProgress?.taskCompleted) {
            return `You've checked in today! Complete your task to maintain your ${streak}-day streak 🔥`;
        }

        if (streak === 0) {
            return `Ready to start your learning journey? Your first task awaits! 🌟`;
        } else if (streak === 1) {
            return `Great start yesterday! Keep the momentum going today 💪`;
        } else if (streak < 7) {
            return `${streak}-day streak! You're building a powerful habit 🎯`;
        } else if (streak < 30) {
            return `Amazing ${streak}-day streak! Your consistency is paying off 🏆`;
        } else {
            return `${streak} days of learning! You're absolutely incredible 🌟`;
        }
    }

    // Calculate current streak
    calculateCurrentStreak() {
        if (!this.user.dailyProgress) return 0;

        let streak = 0;
        const today = new Date();

        for (let i = 0; i < 365; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dateStr = checkDate.toDateString();

            if (this.user.dailyProgress[dateStr] && this.user.dailyProgress[dateStr].taskCompleted) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }

        return streak;
    }

    // Update last notification date
    updateLastNotificationDate(date) {
        this.user.lastNotificationDate = date;
        localStorage.setItem('clearnext_user', JSON.stringify(this.user));
    }

    // Check if user needs notification now
    checkAndSendNotification() {
        const today = new Date().toDateString();
        const todayProgress = this.user.dailyProgress?.[today];

        // Don't send if task already completed
        if (todayProgress?.taskCompleted) {
            return;
        }

        // Don't send if already sent today
        if (this.lastNotificationDate === today) {
            return;
        }

        // Check if current time is past notification time
        const now = new Date();
        const [time, period] = this.notificationTime.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        
        let notificationHour = hours;
        if (period === 'PM' && hours !== 12) {
            notificationHour += 12;
        } else if (period === 'AM' && hours === 12) {
            notificationHour = 0;
        }

        const notificationTime = new Date();
        notificationTime.setHours(notificationHour, minutes, 0, 0);

        if (now >= notificationTime) {
            this.sendDailyNotification();
        }
    }

    // Initialize notification system
    async initialize() {
        const hasPermission = await this.requestPermission();
        
        if (hasPermission) {
            this.scheduleNotification();
            this.checkAndSendNotification(); // Check for immediate notification
        }

        return hasPermission;
    }

    // Update notification time
    updateNotificationTime(newTime) {
        this.notificationTime = newTime;
        this.user.profile.notification = newTime;
        localStorage.setItem('clearnext_user', JSON.stringify(this.user));
        
        // Reschedule with new time
        this.scheduleNotification();
    }

    // Stop notification system
    stop() {
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
            this.notificationTimeout = null;
        }
    }

    // Get notification status
    getStatus() {
        return {
            supported: this.isSupported,
            permission: Notification.permission,
            scheduled: !!this.notificationTimeout,
            time: this.notificationTime,
            lastSent: this.lastNotificationDate
        };
    }
}

// Initialize notification system when page loads
let notificationSystem;

document.addEventListener('DOMContentLoaded', async function() {
    // Only initialize on dashboard and main pages
    const isMainPage = window.location.pathname.includes('dashboard') || 
                     window.location.pathname.includes('index') ||
                     window.location.pathname.endsWith('/');

    if (isMainPage) {
        notificationSystem = new DailyNotificationSystem();
        await notificationSystem.initialize();
    }
});

// Make notification system available globally
window.DailyNotificationSystem = DailyNotificationSystem;
