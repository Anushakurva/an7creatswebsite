// Frontend Integration - Daily Check Client
class DailyCheckClient {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
        this.token = localStorage.getItem('clearnext_token');
        this.userId = localStorage.getItem('clearnext_user_id');
    }

    async checkDailyStatus() {
        try {
            if (!this.token || !this.userId) {
                return {
                    success: false,
                    action: 'redirect_to_login',
                    message: 'Please login to continue'
                };
            }

            const response = await fetch(`${this.baseUrl}/api/daily-check/${this.userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
                }
            });

            const result = await response.json();
            return result;

        } catch (error) {
            console.error('Daily check failed:', error);
            return {
                success: false,
                action: 'show_error_page',
                message: 'Unable to connect to server'
            };
        }
    }

    async getNextAvailableTime() {
        try {
            const response = await fetch(`${this.baseUrl}/api/daily-check/${this.userId}/next-available`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            return await response.json();

        } catch (error) {
            console.error('Next available check failed:', error);
            return null;
        }
    }

    async markUserActive() {
        try {
            await fetch(`${this.baseUrl}/api/daily-check/${this.userId}/mark-active`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Mark active failed:', error);
        }
    }

    // Frontend routing based on daily check result
    async routeBasedOnStatus() {
        const status = await this.checkDailyStatus();
        
        if (!status.success) {
            this.handleError(status);
            return;
        }

        // Mark user as active
        await this.markUserActive();

        // Route based on status
        switch (status.action) {
            case 'redirect_to_login':
                window.location.href = 'login.html';
                break;

            case 'redirect_to_ai_conversation':
                window.location.href = 'ai-conversation.html';
                break;

            case 'show_today_task':
                if (status.data.needs_task_generation) {
                    // Generate task first, then show
                    await this.generateAndShowTask(status);
                } else {
                    window.location.href = 'tasks.html';
                }
                break;

            case 'show_reflection_page':
                window.location.href = 'daily-reflection.html';
                break;

            case 'show_pause_screen':
                this.showPauseScreen(status);
                break;

            case 'show_completion_dashboard':
                window.location.href = 'dashboard-new.html';
                break;

            case 'show_error_page':
                this.showErrorPage(status);
                break;

            default:
                console.warn('Unknown action:', status.action);
                window.location.href = 'dashboard-new.html';
        }
    }

    async generateAndShowTask(status) {
        try {
            const response = await fetch(`${this.baseUrl}/api/tasks/today`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            if (result.success) {
                window.location.href = 'tasks.html';
            } else {
                this.showErrorPage({ error: result.error });
            }
        } catch (error) {
            console.error('Task generation failed:', error);
            this.showErrorPage({ error: 'Failed to generate task' });
        }
    }

    showPauseScreen(status) {
        const pauseHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; padding: 2rem; border-radius: 15px; max-width: 400px; text-align: center;">
                    <h2 style="color: #667eea; margin-bottom: 1rem;">🌟 Welcome Back!</h2>
                    <p style="margin-bottom: 1rem;">${status.message}</p>
                    <p style="color: #666; margin-bottom: 1.5rem;">You missed ${status.data.missed_days} day(s). Ready to continue?</p>
                    <button onclick="this.parentElement.parentElement.remove(); window.location.href='tasks.html'" style="background: #667eea; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; margin-right: 0.5rem;">
                        Continue Learning
                    </button>
                    <button onclick="this.parentElement.parentElement.remove(); window.location.href='dashboard-new.html'" style="background: #e5e7eb; color: #333; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">
                        View Dashboard
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', pauseHTML);
    }

    showErrorPage(status) {
        const errorHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; padding: 2rem; border-radius: 15px; max-width: 400px; text-align: center;">
                    <h2 style="color: #ef4444; margin-bottom: 1rem;">⚠️ Oops!</h2>
                    <p style="margin-bottom: 1.5rem;">${status.error || 'Something went wrong'}</p>
                    <button onclick="this.parentElement.parentElement.remove(); window.location.href='index.html'" style="background: #667eea; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">
                        Back to Home
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', errorHTML);
    }

    handleError(status) {
        if (status.action === 'redirect_to_login') {
            // Clear invalid token
            localStorage.removeItem('clearnext_token');
            localStorage.removeItem('clearnext_user_id');
            localStorage.removeItem('clearnext_user');
        }
        window.location.href = 'login.html';
    }
}

// Auto-run on page load for main app pages
document.addEventListener('DOMContentLoaded', async function() {
    // Only run on main app pages, not login/register
    const currentPage = window.location.pathname;
    const isMainApp = !currentPage.includes('login.html') && 
                     !currentPage.includes('register.html') && 
                     !currentPage.includes('index.html');

    if (isMainApp) {
        const dailyCheck = new DailyCheckClient();
        await dailyCheck.routeBasedOnStatus();
    }
});

// Export for manual use
window.DailyCheckClient = DailyCheckClient;
