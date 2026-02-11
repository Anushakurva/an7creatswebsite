// CLEARNEXT Task Generation System
class TaskGenerator {
    constructor() {
        this.user = JSON.parse(localStorage.getItem('clearnext_user') || '{}');
        this.taskGenerationPrompt = this.user.taskGenerationPrompt || this.getDefaultTaskPrompt();
    }

    getDefaultTaskPrompt() {
        return `DAILY TASK GENERATION
Generate ONE task for today (Day {{day_number}}) for the user.

Rules:
- Time: 30–45 minutes
- Difficulty adaptive (Easy → Medium → Deep)
- Match user's mindset type
- Only show TODAY's task
- mention future tasks but sholud not open.only on its day have to open 
- Calm, empathetic tone`;
    }

    // Generate task for specific day
    generateTask(dayNumber, dailyMood = null) {
        const userProfile = this.user.profile || {};
        const journeyProgress = this.calculateJourneyProgress(dayNumber);
        
        // Determine difficulty based on user profile, progress, and mood
        const difficulty = this.determineDifficulty(userProfile, journeyProgress, dailyMood);
        
        // Generate task based on user's needs, difficulty, and mood
        const task = this.createPersonalizedTask(dayNumber, difficulty, userProfile, journeyProgress, dailyMood);
        
        return task;
    }

    calculateJourneyProgress(dayNumber) {
        const totalDays = this.user.journeyDuration || 30;
        const progress = (dayNumber / totalDays) * 100;
        
        return {
            dayNumber,
            totalDays,
            progress,
            isEarly: dayNumber <= 7,
            isMid: dayNumber > 7 && dayNumber <= 21,
            isLate: dayNumber > 21
        };
    }

    determineDifficulty(userProfile, journeyProgress, dailyMood) {
        // Mood-based adaptation
        if (dailyMood?.toLowerCase() === 'low') {
            return 'Easy'; // Always gentle for low mood
        }
        
        // Base difficulty on struggle type
        if (userProfile.struggleType?.toLowerCase().includes('motivation') || 
            userProfile.struggleType?.toLowerCase().includes('overwhelmed')) {
            return 'Easy';
        }
        
        // Adapt based on journey progress and mood
        if (journeyProgress.isEarly) {
            return dailyMood?.toLowerCase() === 'good' ? 'Medium' : 'Easy';
        } else if (journeyProgress.isMid) {
            if (dailyMood?.toLowerCase() === 'good') {
                return userProfile.struggleType?.toLowerCase().includes('time') ? 'Medium' : 'Medium';
            } else {
                return userProfile.struggleType?.toLowerCase().includes('time') ? 'Easy' : 'Medium';
            }
        } else {
            if (dailyMood?.toLowerCase() === 'good') {
                return userProfile.confusionType?.toLowerCase().includes('advanced') ? 'Deep' : 'Medium';
            } else {
                return 'Medium'; // Neutral for late journey with non-good mood
            }
        }
        
        return 'Medium';
    }

    createPersonalizedTask(dayNumber, difficulty, userProfile, journeyProgress, dailyMood) {
        const taskTypes = this.getTaskTypes(userProfile, difficulty);
        const selectedType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
        
        const task = {
            dayNumber,
            difficulty,
            type: selectedType,
            timeLimit: '30-45 minutes',
            focus: userProfile.confusionType || 'Personal Growth',
            instructions: this.generateInstructions(selectedType, difficulty, userProfile, dayNumber),
            encouragement: this.generateEncouragement(userProfile, journeyProgress, dailyMood),
            tone: this.determineTone(dailyMood)
        };

        return this.formatTask(task);
    }

    getTaskTypes(userProfile, difficulty) {
        const baseTypes = ['Reflection', 'Writing', 'Planning', 'Review'];
        
        if (difficulty === 'Easy') {
            return ['Reflection', 'Writing', 'Observation'];
        } else if (difficulty === 'Medium') {
            return ['Analysis', 'Planning', 'Application'];
        } else {
            return ['Synthesis', 'Creation', 'Evaluation'];
        }

        // Customize based on struggle type
        if (userProfile.struggleType?.toLowerCase().includes('motivation')) {
            return ['Motivation Building', 'Goal Setting', 'Progress Review'];
        } else if (userProfile.struggleType?.toLowerCase().includes('time')) {
            return ['Time Management', 'Prioritization', 'Efficiency'];
        } else if (userProfile.confusionType?.toLowerCase().includes('concept')) {
            return ['Concept Mapping', 'Understanding', 'Application'];
        }

        return baseTypes;
    }

    generateInstructions(taskType, difficulty, userProfile, dayNumber) {
        const instructions = {
            'Reflection': [
                'Take 15 minutes to reflect on your recent learning experiences.',
                'Write about what worked well and what challenges you faced.',
                'Consider how you can apply these insights going forward.'
            ],
            'Writing': [
                'Spend 20 minutes writing about your current learning journey.',
                'Focus on your thoughts and feelings about the process.',
                'End with 3 key takeaways from this writing exercise.'
            ],
            'Planning': [
                'Review your learning goals for the next 7 days.',
                'Break down one goal into small, actionable steps.',
                'Create a realistic timeline for completing these steps.'
            ],
            'Motivation Building': [
                'List 3 things that motivate you to learn.',
                'Write about a past learning success and why it felt good.',
                'Create a small reward system for your next learning milestone.'
            ],
            'Time Management': [
                'Track how you spend your time for one day.',
                'Identify time-wasting activities and plan alternatives.',
                'Create a simple schedule that includes dedicated learning time.'
            ],
            'Concept Understanding': [
                'Choose one concept you\'re struggling to understand.',
                'Explain it in simple terms as if teaching someone else.',
                'Identify what makes this concept confusing and how to clarify it.'
            ]
        };

        const baseInstructions = instructions[taskType] || instructions['Reflection'];
        
        // Adapt based on difficulty
        if (difficulty === 'Easy') {
            return baseInstructions.slice(0, 2).join(' ');
        } else if (difficulty === 'Deep') {
            return baseInstructions.join(' ') + ' Additionally, consider how this connects to your broader learning goals and future aspirations.';
        } else {
            return baseInstructions.join(' ');
        }
    }

    generateEncouragement(userProfile, journeyProgress, dailyMood) {
        const moodBasedEncouragement = {
            low: [
                "It's okay to have difficult days. Be gentle with yourself today.",
                "You're showing up, and that's what matters most. Take it one step at a time.",
                "Even small progress is progress. You've got this, at your own pace."
            ],
            okay: [
                "You're building consistency, and that's a real achievement.",
                "Every day you engage with your learning, you're growing stronger.",
                "Your steady approach is creating lasting change."
            ],
            good: [
                "Your energy today is perfect for tackling meaningful challenges!",
                "You're in a great mindset to make significant progress today.",
                "Your positive attitude will help you achieve great things today!"
            ]
        };

        const stageBasedEncouragement = {
            early: [
                "You're building a strong foundation for your learning journey.",
                "Every small step counts toward your growth.",
                "Trust the process - you're doing great!"
            ],
            mid: [
                "You're making meaningful progress on your journey.",
                "Your consistency is paying off in ways you might not see yet.",
                "Keep showing up - that's what matters most."
            ],
            late: [
                "You've come so far - look at how much you've grown!",
                "Your dedication to learning is truly inspiring.",
                "You're developing skills that will serve you for life."
            ]
        };

        let stage = 'mid';
        if (journeyProgress.isEarly) stage = 'early';
        else if (journeyProgress.isLate) stage = 'late';

        let mood = 'okay';
        if (dailyMood) {
            const moodLower = dailyMood.toLowerCase();
            if (moodLower === 'low') mood = 'low';
            else if (moodLower === 'good') mood = 'good';
        }

        // Prioritize mood-based encouragement
        const moodMessages = moodBasedEncouragement[mood];
        const stageMessages = stageBasedEncouragement[stage];

        // Mix mood and stage encouragement
        return Math.random() > 0.5 
            ? moodMessages[Math.floor(Math.random() * moodMessages.length)]
            : stageMessages[Math.floor(Math.random() * stageMessages.length)];
    }

    determineTone(dailyMood) {
        if (!dailyMood) return 'neutral';
        
        const mood = dailyMood.toLowerCase();
        if (mood === 'low') return 'gentle, reassuring';
        if (mood === 'okay') return 'neutral';
        if (mood === 'good') return 'slightly challenging';
        
        return 'neutral';
    }

    formatTask(task) {
        return `Day ${task.dayNumber} - ${task.type} Task (${task.difficulty})

Time: ${task.timeLimit}
Focus: ${task.focus}
Tone: ${task.tone}

Today's task: ${task.instructions}

${task.encouragement}

Remember: This is about understanding yourself better, not perfection. Take your time and be gentle with yourself.`;
    }

    // Save generated task to user data
    saveTask(dayNumber, task) {
        if (!this.user.dailyTasks) {
            this.user.dailyTasks = {};
        }
        this.user.dailyTasks[dayNumber] = task;
        localStorage.setItem('clearnext_user', JSON.stringify(this.user));
    }

    // Get task for specific day
    getTask(dayNumber, dailyMood = null) {
        return this.user.dailyTasks?.[dayNumber] || this.generateAndSaveTask(dayNumber, dailyMood);
    }

    // Generate and save task if not exists
    generateAndSaveTask(dayNumber, dailyMood = null) {
        const task = this.generateTask(dayNumber, dailyMood);
        this.saveTask(dayNumber, task);
        return task;
    }

    // Get today's task
    getTodaysTask(dailyMood = null) {
        const today = new Date();
        const journeyStart = new Date(this.user.journeyStartDate || Date.now());
        const dayNumber = Math.floor((today - journeyStart) / (1000 * 60 * 60 * 24)) + 1;
        
        return this.getTask(dayNumber, dailyMood);
    }
}

// Make TaskGenerator available globally
window.TaskGenerator = TaskGenerator;
