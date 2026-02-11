// CLEARNEXT Reflection Analysis System
class ReflectionAnalyzer {
    constructor() {
        this.user = JSON.parse(localStorage.getItem('clearnext_user') || '{}');
    }

    // REFLECTION CHECK (ANTI-CHEAT)
    analyzeReflection(reflectionText) {
        const analysis = {
            isRushed: false,
            isEmpty: false,
            isMeaningful: false,
            wordCount: 0,
            characterCount: 0,
            issues: [],
            recommendations: []
        };

        // Basic metrics
        analysis.wordCount = reflectionText.trim().split(/\s+/).length;
        analysis.characterCount = reflectionText.length;

        // Check for empty or too short
        if (analysis.characterCount < 20) {
            analysis.isEmpty = true;
            analysis.issues.push("Reflection is too short to be meaningful");
            analysis.recommendations.push("Please share more detailed thoughts about your experience");
        }

        // Check for rushed responses
        const rushedIndicators = [
            /\b(ok|good|fine|bad|alright)\s*$/i,  // Single word endings
            /^(idk|dunno|no idea|not sure)/i,      // Uncertain starts
            /(.)\1{4,}/,                           // Repeated characters
            /^[a-z\s]+$/i,                        // All lowercase (no effort)
            analysis.wordCount < 10                // Too few words
        ];

        for (const indicator of rushedIndicators) {
            if (indicator.test(reflectionText)) {
                analysis.isRushed = true;
                analysis.issues.push("Reflection appears rushed or lacks depth");
                analysis.recommendations.push("Take time to honestly reflect on your experience");
                break;
            }
        }

        // Check for meaningful content
        const meaningfulIndicators = [
            /\b(because|since|as|due to|feel|think|believe|realize|understand|learn)\b/i,
            /\b(challenge|difficult|easy|helpful|useful|confusing|clear|interesting)\b/i,
            analysis.wordCount >= 15,
            analysis.characterCount >= 50
        ];

        const meaningfulCount = meaningfulIndicators.filter(indicator => {
            if (typeof indicator === 'function') return indicator(reflectionText);
            return indicator.test(reflectionText);
        }).length;

        analysis.isMeaningful = meaningfulCount >= 2;

        if (!analysis.isMeaningful && !analysis.isEmpty && !analysis.isRushed) {
            analysis.issues.push("Reflection could be more detailed");
            analysis.recommendations.push("Consider sharing specific examples or feelings");
        }

        return analysis;
    }

    // Generate reflection feedback
    generateReflectionFeedback(analysis) {
        if (analysis.isMeaningful) {
            return {
                canContinue: true,
                message: "Thank you for your thoughtful reflection.",
                type: "success"
            };
        }

        let feedbackMessage = "Please provide a more honest reflection: ";
        
        if (analysis.issues.length > 0) {
            feedbackMessage += analysis.issues.join(". ") + ". ";
        }
        
        if (analysis.recommendations.length > 0) {
            feedbackMessage += "Suggestions: " + analysis.recommendations.join(". ");
        }

        return {
            canContinue: false,
            message: feedbackMessage,
            type: "warning",
            analysis: analysis
        };
    }

    // MICRO-APPRECIATION
    generateMicroAppreciation(taskCompleted, mood, effort) {
        const appreciationTemplates = {
            low: [
                "You showed up today. That matters.",
                "Taking time for yourself is wisdom.",
                "Small steps create real change.",
                "Your consistency builds strength.",
                "Being here is enough today."
            ],
            okay: [
                "Your steady effort is impressive.",
                "You're building real momentum.",
                "Consistency is your superpower.",
                "Your dedication shows character.",
                "Keep going, you're doing well."
            ],
            good: [
                "Your energy today is inspiring!",
                "Fantastic focus and commitment.",
                "You're making real progress.",
                "Your positive approach works.",
                "Excellent work today!"
            ]
        };

        const moodKey = mood?.toLowerCase() || 'okay';
        const templates = appreciationTemplates[moodKey] || appreciationTemplates.okay;
        
        return templates[Math.floor(Math.random() * templates.length)];
    }

    // FINAL FEEDBACK (END OF JOURNEY)
    generateFinalFeedback(journeyDays) {
        const dailyProgress = this.user.dailyProgress || {};
        const completedDays = Object.keys(dailyProgress).filter(date => 
            dailyProgress[date] && dailyProgress[date].reflectionCompleted
        ).length;

        // Analyze journey patterns
        const moodAnalysis = this.analyzeMoodPatterns(dailyProgress);
        const growthAnalysis = this.analyzeGrowthPatterns(dailyProgress);
        const consistencyAnalysis = this.analyzeConsistency(dailyProgress);

        const feedback = {
            journeySummary: this.createJourneySummary(journeyDays, completedDays),
            emotionalChanges: moodAnalysis,
            strengthsObserved: growthAnalysis,
            clarityGained: this.identifyClarityGained(dailyProgress),
            suggestedNextStep: this.generateNextStep(moodAnalysis, growthAnalysis),
            overallTone: completedDays >= journeyDays * 0.8 ? "accomplished" : "progressing"
        };

        return this.formatFinalFeedback(feedback);
    }

    analyzeMoodPatterns(dailyProgress) {
        const moods = Object.values(dailyProgress)
            .filter(day => day.mood)
            .map(day => day.mood.toLowerCase());

        const moodCounts = { low: 0, okay: 0, good: 0 };
        moods.forEach(mood => {
            if (moodCounts.hasOwnProperty(mood)) moodCounts[mood]++;
        });

        const total = moods.length || 1;
        const dominantMood = Object.keys(moodCounts).reduce((a, b) => 
            moodCounts[a] > moodCounts[b] ? a : b
        );

        return {
            dominantMood,
            distribution: moodCounts,
            positivity: (moodCounts.good / total) * 100,
            resilience: moodCounts.low > 0 ? "You showed resilience on challenging days" : "Consistently positive mindset"
        };
    }

    analyzeGrowthPatterns(dailyProgress) {
        const reflections = Object.values(dailyProgress)
            .filter(day => day.reflection)
            .map(day => day.reflection);

        const strengths = [];
        
        // Analyze reflection patterns
        const avgReflectionLength = reflections.reduce((sum, ref) => {
            const length = (ref.learning || '').length + (ref.feeling || '').length + (ref.improvement || '').length;
            return sum + length;
        }, 0) / (reflections.length || 1);

        if (avgReflectionLength > 200) {
            strengths.push("Deep self-reflection and thoughtful analysis");
        }

        const completedDays = Object.keys(dailyProgress).filter(date => 
            dailyProgress[date] && dailyProgress[date].reflectionCompleted
        ).length;

        if (completedDays > 10) {
            strengths.push("Strong commitment and consistency");
        }

        return strengths.length > 0 ? strengths : ["Building self-awareness through regular practice"];
    }

    analyzeConsistency(dailyProgress) {
        const dates = Object.keys(dailyProgress).sort((a, b) => new Date(a) - new Date(b));
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        for (let i = 0; i < dates.length; i++) {
            const date = new Date(dates[i]);
            const expectedDate = new Date(dates[0]);
            expectedDate.setDate(expectedDate.getDate() + i);

            if (date.toDateString() === expectedDate.toDateString() && 
                dailyProgress[dates[i]] && dailyProgress[dates[i]].reflectionCompleted) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                tempStreak = 0;
            }

            // Check if this is recent (last 7 days)
            const daysDiff = (new Date() - date) / (1000 * 60 * 60 * 24);
            if (daysDiff <= 7) {
                currentStreak = tempStreak;
            }
        }

        return {
            currentStreak,
            longestStreak,
            totalDays: dates.length,
            consistency: (longestStreak / dates.length) * 100
        };
    }

    identifyClarityGained(dailyProgress) {
        const clarityAreas = [];

        // Analyze reflection content for clarity themes
        Object.values(dailyProgress).forEach(day => {
            if (day.reflection) {
                const text = (day.reflection.learning || '') + ' ' + (day.reflection.improvement || '');
                
                if (text.toLowerCase().includes('understand') || text.toLowerCase().includes('clear')) {
                    clarityAreas.push("Better understanding of personal learning patterns");
                }
                if (text.toLowerCase().includes('time') || text.toLowerCase().includes('schedule')) {
                    clarityAreas.push("Improved time management awareness");
                }
                if (text.toLowerCase().includes('motivation') || text.toLowerCase().includes('energy')) {
                    clarityAreas.push("Deeper insight into personal motivation");
                }
            }
        });

        return clarityAreas.length > 0 ? [...new Set(clarityAreas)] : ["Developing self-awareness through regular reflection"];
    }

    generateNextStep(moodAnalysis, growthAnalysis) {
        if (moodAnalysis.positivity < 40) {
            return "Focus on building positive routines and self-compassion";
        } else if (growthAnalysis.includes("Deep self-reflection")) {
            return "Apply your insights to new learning challenges";
        } else {
            return "Continue your reflection practice with new topics or goals";
        }
    }

    createJourneySummary(journeyDays, completedDays) {
        const completion = Math.round((completedDays / journeyDays) * 100);
        return `You completed ${completedDays} out of ${journeyDays} days (${completion}% completion rate)`;
    }

    formatFinalFeedback(feedback) {
        return `Journey Complete: ${feedback.journeySummary}

Emotional & Mental Changes:
- Dominant mood pattern: ${feedback.emotionalChanges.dominantMood}
- Positivity rate: ${Math.round(feedback.emotionalChanges.positivity)}%
- ${feedback.emotionalChanges.resilience}

Strengths Observed:
${feedback.strengthsObserved.map(strength => `- ${strength}`).join('\n')}

Clarity Gained:
${feedback.clarityGained.map(clarity => `- ${clarity}`).join('\n')}

Suggested Next Step:
${feedback.suggestedNextStep}

Your journey shows ${feedback.overallTone} growth. Keep building on this foundation.`;
    }
}

// Make ReflectionAnalyzer available globally
window.ReflectionAnalyzer = ReflectionAnalyzer;
