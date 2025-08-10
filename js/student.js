document.addEventListener('DOMContentLoaded', async () => {
    // Initialize player data when form is submitted
    const form = document.getElementById('info-form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const playerData = {
                name: document.getElementById('student-name').value,
                phone: document.getElementById('student-phone').value,
                course: document.getElementById('student-class').value
            };

            if (typeof config !== 'undefined' && await config.initializePlayer(playerData)) {
                // Hide form and show quiz
                const studentForm = document.getElementById('student-form');
                const quizSection = document.getElementById('quiz-container');
                
                if (studentForm) studentForm.style.display = 'none';
                if (quizSection) {
                    quizSection.style.display = 'block';
                } else {
                    // If quiz-container doesn't exist, try alternative IDs
                    const altQuiz = document.getElementById('quizSection') || document.getElementById('quiz');
                    if (altQuiz) altQuiz.style.display = 'block';
                }
            }
        };
    }
});