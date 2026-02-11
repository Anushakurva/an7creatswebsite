// Frontend Integration - Task Rules and Reflection Validation Client
class TaskRulesClient {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
        this.token = localStorage.getItem('clearnext_token');
        this.userId = localStorage.getItem('clearnext_user_id');
    }

    async checkTaskStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/api/task-rules/${this.userId}/status`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            return await response.json();
        } catch (error) {
            console.error('Task status check failed:', error);
            return { success: false, error: error.message };
        }
    }

    async checkLockStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/api/task-rules/${this.userId}/lock-status`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            return await response.json();
        } catch (error) {
            console.error('Lock status check failed:', error);
            return { success: false, error: error.message };
        }
    }

    async validateReflection(reflectionData) {
        try {
            const response = await fetch(`${this.baseUrl}/api/task-rules/validate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...reflectionData,
                    user_id: this.userId
                })
            });

            return await response.json();
        } catch (error) {
            console.error('Reflection validation failed:', error);
            return { success: false, error: error.message };
        }
    }

    async getNextAvailableTime() {
        try {
            const response = await fetch(`${this.baseUrl}/api/task-rules/${this.userId}/next-available`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            return await response.json();
        } catch (error) {
            console.error('Next available check failed:', error);
            return { success: false, error: error.message };
        }
    }

    async enforceTimeWindow(action = 'generate') {
        try {
            const response = await fetch(`${this.baseUrl}/api/task-rules/${this.userId}/enforce-time-window`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action })
            });

            return await response.json();
        } catch (error) {
            console.error('Time window check failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Frontend helper methods
    async canAccessTodayTask() {
        const status = await this.checkTaskStatus();
        
        if (!status.success) {
            return { can_access: false, reason: 'error', message: status.error };
        }

        const { can_generate_task, time_window } = status;
        
        if (!can_generate_task.can_generate) {
            return {
                can_access: false,
                reason: can_generate_task.reason,
                message: can_generate_task.message,
                next_available: can_generate_task.next_available
            };
        }

        if (!time_window.allowed) {
            return {
                can_access: false,
                reason: time_window.reason,
                message: time_window.message,
                available_at: time_window.available_at
            };
        }

        return { can_access: true };
    }

    async validateAndSubmitReflection(reflectionData) {
        const validation = await this.validateReflection(reflectionData);
        
        if (!validation.success) {
            return {
                can_submit: false,
                validation: validation,
                message: 'Validation failed'
            };
        }

        const { validation: validationResult } = validation;
        
        if (!validationResult.can_submit) {
            return {
                can_submit: false,
                validation: validationResult,
                message: validationResult.message,
                issues: validationResult.issues,
                suggestions: validationResult.suggestions
            };
        }

        return {
            can_submit: true,
            validation: validationResult,
            message: validationResult.message,
            score: validationResult.score,
            encouragement: validationResult.encouragement
        };
    }

    showTaskLockMessage(lockStatus) {
        if (!lockStatus.locked) {
            return; // Task is available
        }

        const messages = {
            'today_incomplete': {
                title: '🔒 Task Locked',
                message: 'Complete today\'s task to unlock tomorrow\'s challenge.',
                action: 'Complete Today\'s Task'
            },
            'reflection_incomplete': {
                title: '🤔 Reflection Needed',
                message: 'Complete today\'s reflection to unlock tomorrow\'s task.',
                action: 'Complete Reflection'
            },
            'too_early': {
                title: '⏰ Not Yet',
                message: 'Tasks are available from 12:00 AM.',
                action: 'Check Back Later'
            },
            'too_late': {
                title: '😴 Window Closed',
                message: 'Task window closed at 11:59 PM. Try again tomorrow!',
                action: 'Try Tomorrow'
            }
        };

        const msg = messages[lockStatus.reason] || {
            title: '🔒 Task Unavailable',
            message: lockStatus.message,
            action: 'Check Back Later'
        };

        this.showModal(msg.title, msg.message, msg.action);
    }

    showValidationModal(validationResult) {
        const { can_submit, message, issues, warnings, suggestions, encouragement } = validationResult;
        
        let modalHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; padding: 2rem; border-radius: 15px; max-width: 500px; max-height: 80vh; overflow-y: auto;">
                    <h3 style="color: ${can_submit ? '#10b981' : '#ef4444'}; margin-bottom: 1rem;">
                        ${can_submit ? '✅ Reflection Accepted' : '❌ Please Improve Your Reflection'}
                    </h3>
                    <p style="margin-bottom: 1rem;">${message}</p>
        `;

        if (encouragement) {
            modalHTML += `<p style="color: #667eea; font-weight: 600; margin-bottom: 1rem;">${encouragement}</p>`;
        }

        if (issues && issues.length > 0) {
            modalHTML += `
                <div style="background: #fee2e2; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <h4 style="color: #dc2626; margin-bottom: 0.5rem;">Issues to Fix:</h4>
                    <ul style="margin: 0; padding-left: 1.5rem;">
                        ${issues.map(issue => `<li style="margin-bottom: 0.5rem;">${issue.message}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (warnings && warnings.length > 0) {
            modalHTML += `
                <div style="background: #fef3c7; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <h4 style="color: #d97706; margin-bottom: 0.5rem;">Suggestions:</h4>
                    <ul style="margin: 0; padding-left: 1.5rem;">
                        ${warnings.map(warning => `<li style="margin-bottom: 0.5rem;">${warning.message}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (suggestions && suggestions.length > 0) {
            modalHTML += `
                <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <h4 style="color: #0ea5e9; margin-bottom: 0.5rem;">How to Improve:</h4>
                    <ul style="margin: 0; padding-left: 1.5rem;">
                        ${suggestions.map(suggestion => `<li style="margin-bottom: 0.5rem;">${suggestion}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        modalHTML += `
            <div style="text-align: center; margin-top: 1.5rem;">
                <button onclick="this.parentElement.parentElement.remove();" style="background: #667eea; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">
                    ${can_submit ? 'Continue' : 'Improve Reflection'}
                </button>
            </div>
        </div>
    </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    showModal(title, message, actionText) {
        const modalHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; padding: 2rem; border-radius: 15px; max-width: 400px; text-align: center;">
                    <h3 style="color: #667eea; margin-bottom: 1rem;">${title}</h3>
                    <p style="margin-bottom: 1.5rem;">${message}</p>
                    <button onclick="this.parentElement.parentElement.remove();" style="background: #667eea; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">
                        ${actionText}
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    showTimeWindowMessage(timeWindow) {
        if (timeWindow.allowed) {
            return;
        }

        const messages = {
            'before_window': {
                title: '⏰ Too Early',
                message: `Tasks are available from 12:00 AM. Current time: ${new Date().toLocaleTimeString()}`,
                action: 'Check Back Later'
            },
            'after_window': {
                title: '😴 Window Closed',
                message: `Task window closed at 11:59 PM. Available tomorrow at 12:00 AM`,
                action: 'Try Tomorrow'
            }
        };

        const msg = messages[timeWindow.reason] || {
            title: '⏰ Time Restricted',
            message: timeWindow.message,
            action: 'Check Back Later'
        };

        this.showModal(msg.title, msg.message, msg.action);
    }
}

// Auto-integrate with reflection form
document.addEventListener('DOMContentLoaded', function() {
    // Add validation to reflection forms
    const reflectionForm = document.getElementById('reflectionForm');
    if (reflectionForm) {
        reflectionForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const taskRulesClient = new TaskRulesClient();
            
            const reflectionData = {
                learning: document.getElementById('learningInput')?.value || '',
                feeling: document.getElementById('feelingInput')?.value || '',
                improvement: document.getElementById('improvementInput')?.value || '',
                task_id: document.getElementById('taskId')?.value || ''
            };

            const validation = await taskRulesClient.validateAndSubmitReflection(reflectionData);
            
            if (!validation.can_submit) {
                taskRulesClient.showValidationModal(validation.validation);
                return;
            }

            // If validation passes, show encouragement and submit
            if (validation.encouragement) {
                const encouragementHTML = `
                    <div style="position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 1rem 1.5rem; border-radius: 10px; z-index: 1000;">
                        ${validation.encouragement}
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', encouragementHTML);
                setTimeout(() => {
                    const elem = document.querySelector('[style*="position: fixed"]');
                    if (elem) elem.remove();
                }, 3000);
            }

            // Submit the form normally
            this.submit();
        });
    }
});

// Export for manual use
window.TaskRulesClient = TaskRulesClient;
