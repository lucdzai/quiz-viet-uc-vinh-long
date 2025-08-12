console.log('🎯 Student.js file loaded!');

// Global variable to store current user data
let currentUser = {};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 Student.js DOMContentLoaded event fired!');
    
    // Initialize player data when form is submitted
    const form = document.getElementById('info-form');
    if (form) {
        console.log('✅ Form found, setting up submit handler');
        form.onsubmit = async (e) => {
            e.preventDefault();
            console.log('🚀 Form submitted!');
            
            const playerData = {
                name: document.getElementById('student-name').value,
                phone: document.getElementById('student-phone').value,
                course: document.getElementById('student-class').value
            };
            
            console.log('📝 Player data:', playerData);

            if (typeof config !== 'undefined' && await config.initializePlayer(playerData)) {
                console.log('✅ Player initialized, showing quiz...');
                
                // Store current user data globally
                currentUser = { ...playerData };
                console.log('💾 Current user stored:', currentUser);
                
                // Hide form and show quiz
                const studentForm = document.getElementById('student-form');
                const quizSection = document.getElementById('quiz-container');
                
                if (studentForm) {
                    studentForm.style.display = 'none';
                    console.log('✅ Form hidden');
                }
                
                if (quizSection) {
                    quizSection.style.display = 'block';
                    console.log('✅ Quiz container shown');
                    // Show quiz content
                    showQuiz(playerData.course);
                } else {
                    console.log('❌ Quiz container not found');
                    // If quiz-container doesn't exist, try alternative IDs
                    const altQuiz = document.getElementById('quizSection') || document.getElementById('quiz');
                    if (altQuiz) {
                        altQuiz.style.display = 'block';
                        showQuiz(playerData.course);
                    }
                }
            } else {
                console.log('❌ Failed to initialize player');
            }
        };
    } else {
        console.log('❌ Form not found!');
    }
});

// Function to show quiz content
function showQuiz(courseType) {
    const quizContainer = document.getElementById('quiz-container');
    if (!quizContainer) return;

    // Get questions for the selected course
    const questions = getQuestionsByCourse(courseType);
    if (!questions || questions.length === 0) {
        quizContainer.innerHTML = '<p>Không có câu hỏi cho khóa học này.</p>';
        return;
    }

    // Create quiz HTML
    let quizHTML = `
        <div class="logo">
            <img src="assets/logo.svg" alt="Logo Trung Tâm" class="center-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div class="logo-fallback" style="display: none;">🎓</div>
            <h2>🎯 Quiz - ${getCourseDisplayName(courseType)}</h2>
            <p>Chào mừng bạn đến với bài kiểm tra năng lực!</p>
        </div>
        
        <div class="quiz-info">
            <div class="timer-section">
                <span>⏰ Thời gian còn lại: </span>
                <span id="timer-text" class="timer">05:00</span>
            </div>
            <div class="progress-section">
                <span>📝 Tiến độ: </span>
                <span id="progress-text">0/${questions.length}</span>
            </div>
        </div>
        
        <form id="quiz-form">
            <div class="questions-container">
    `;

    // Add each question
    questions.forEach((question, index) => {
        quizHTML += `
            <div class="question-item" id="question-${index}">
                <h3>Câu ${index + 1}: ${question.question}</h3>
                <div class="options">
        `;
        
        question.options.forEach((option, optionIndex) => {
            quizHTML += `
                <label class="option-label">
                    <input type="radio" name="q${index}" value="${optionIndex}" required>
                    <span class="option-text">${option}</span>
                </label>
            `;
        });
        
        quizHTML += `
                </div>
            </div>
        `;
    });

    quizHTML += `
            </div>
            
            <div class="quiz-actions">
                <button type="submit" class="btn-primary" id="submit-quiz">🚀 Nộp bài</button>
                <button type="button" class="btn-secondary" onclick="restartQuiz()">🔄 Làm lại</button>
            </div>
        </form>
    `;

    quizContainer.innerHTML = quizHTML;

    // Start timer
    startQuizTimer(questions.length);
    
    // Handle form submission
    const quizForm = document.getElementById('quiz-form');
    if (quizForm) {
        quizForm.onsubmit = (e) => {
            e.preventDefault();
            submitQuiz(questions);
        };
    }

    // Add progress tracking
    const radioButtons = quizContainer.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', () => {
            updateProgress(questions.length);
        });
    });
}

// Get questions by course type
function getQuestionsByCourse(courseType) {
    const questionsByClass = {
        'tieu-hoc': [
            {
                question: "What is your name?",
                options: ["My name is Tom", "I am fine", "Yes, please", "Goodbye"],
                correct: 0
            },
            {
                question: "How old are you?",
                options: ["I like cats", "I am 8 years old", "It's red", "Thank you"],
                correct: 1
            },
            {
                question: "What color is the sun?",
                options: ["Blue", "Green", "Yellow", "Purple"],
                correct: 2
            },
            {
                question: "How many fingers do you have?",
                options: ["Five", "Ten", "Fifteen", "Twenty"],
                correct: 1
            },
            {
                question: "What do you say when you meet someone?",
                options: ["Goodbye", "Hello", "Thank you", "Sorry"],
                correct: 1
            }
        ],
        'thcs': [
            {
                question: "She _____ to school every day.",
                options: ["go", "goes", "going", "gone"],
                correct: 1
            },
            {
                question: "There _____ many books on the table.",
                options: ["is", "am", "are", "be"],
                correct: 2
            },
            {
                question: "I _____ my homework yesterday.",
                options: ["do", "did", "does", "doing"],
                correct: 1
            },
            {
                question: "The weather is _____ today.",
                options: ["rain", "raining", "rainy", "rained"],
                correct: 2
            },
            {
                question: "We _____ English for 3 years.",
                options: ["learn", "learned", "have learned", "learning"],
                correct: 2
            }
        ],
        'thpt': [
            {
                question: "The book _____ by millions of people.",
                options: ["reads", "is read", "read", "reading"],
                correct: 1
            },
            {
                question: "If I _____ rich, I would buy a car.",
                options: ["am", "was", "were", "be"],
                correct: 2
            },
            {
                question: "She said she _____ come tomorrow.",
                options: ["will", "would", "shall", "should"],
                correct: 1
            },
            {
                question: "The man _____ is standing there is my teacher.",
                options: ["who", "which", "when", "where"],
                correct: 0
            },
            {
                question: "I wish I _____ speak English fluently.",
                options: ["can", "could", "may", "might"],
                correct: 1
            }
        ],
        'tieng-trung': [
            {
                question: "你好 (nǐ hǎo) có nghĩa là gì?",
                options: ["Tạm biệt", "Xin chào", "Cảm ơn", "Xin lỗi"],
                correct: 1
            },
            {
                question: "Cách nói 'Cảm ơn' trong tiếng Trung là gì?",
                options: ["再见", "谢谢", "对不起", "不客气"],
                correct: 1
            },
            {
                question: "我是学生 có nghĩa là gì?",
                options: ["Tôi là giáo viên", "Tôi là học sinh", "Tôi là bác sĩ", "Tôi là sinh viên"],
                correct: 1
            },
            {
                question: "Số 5 trong tiếng Trung đọc là?",
                options: ["三 (sān)", "四 (sì)", "五 (wǔ)", "六 (liù)"],
                correct: 2
            },
            {
                question: "这是什么？(zhè shì shén me) có nghĩa là gì?",
                options: ["Đây là gì?", "Kia là gì?", "Ai vậy?", "Làm gì vậy?"],
                correct: 0
            }
        ],
        'tieng-trung-11': [
            {
                question: "你好，我叫小明。中的\"叫\"是什么意思？",
                options: ["là", "tên", "kêu/gọi là", "sống"],
                correct: 2
            },
            {
                question: "你从哪里来？câu này hỏi về điều gì?",
                options: ["Bạn đi đâu?", "Bạn từ đâu đến?", "Bạn làm gì?", "Bạn học gì?"],
                correct: 1
            },
            {
                question: "今天天气怎么样？có nghĩa là gì?",
                options: ["Hôm nay thứ mấy?", "Hôm nay bao nhiêu độ?", "Hôm nay thời tiết thế nào?", "Hôm nay làm gì?"],
                correct: 2
            },
            {
                question: "我想喝水 có nghĩa là gì?",
                options: ["Tôi muốn ăn cơm", "Tôi muốn uống nước", "Tôi muốn ngủ", "Tôi muốn đi"],
                correct: 1
            },
            {
                question: "请问，厕所在哪里？là câu hỏi về điều gì?",
                options: ["Hỏi giờ", "Hỏi đường đến nhà vệ sinh", "Hỏi tên", "Hỏi giá"],
                correct: 1
            }
        ],
        'tieng-anh-giao-tiep': [
            {
                question: "How do you respond to 'How are you?'",
                options: ["I'm fine, thank you", "My name is John", "I'm 25 years old", "I live in Vietnam"],
                correct: 0
            },
            {
                question: "What do you say when you want to ask for directions?",
                options: ["How much is this?", "Excuse me, where is...?", "What time is it?", "Can I help you?"],
                correct: 1
            },
            {
                question: "At a restaurant, how do you order food?",
                options: ["I want to buy this", "I'd like to order...", "How much does it cost?", "Where is the toilet?"],
                correct: 1
            },
            {
                question: "How do you politely decline an invitation?",
                options: ["No!", "I don't want to", "I'm sorry, I can't", "That's bad"],
                correct: 2
            },
            {
                question: "What do you say when someone helps you?",
                options: ["Goodbye", "Hello", "Thank you very much", "You're welcome"],
                correct: 2
            }
        ],
        'tieng-anh-giao-tiep-11': [
            {
                question: "In a business meeting, how do you introduce yourself?",
                options: ["Hi, I'm...", "Good morning, my name is... and I work for...", "Hello everyone", "What's up?"],
                correct: 1
            },
            {
                question: "How do you express disagreement politely?",
                options: ["You're wrong", "I disagree with you", "I'm afraid I don't quite agree", "That's stupid"],
                correct: 2
            },
            {
                question: "What's the best way to ask for clarification?",
                options: ["What?", "Could you please repeat that?", "I don't understand", "Say again"],
                correct: 1
            },
            {
                question: "How do you make a suggestion?",
                options: ["You must do this", "Why don't we...?", "Do this now", "I command you to..."],
                correct: 1
            },
            {
                question: "How do you end a phone conversation professionally?",
                options: ["Bye", "Thank you for your time. Have a great day!", "See you", "OK, done"],
                correct: 1
            }
        ],
        'chung-chi': [
            {
                question: "Which sentence shows the correct use of the present perfect?",
                options: ["I go to Paris last year", "I have been to Paris", "I am going to Paris", "I will go to Paris"],
                correct: 1
            },
            {
                question: "Choose the correct conditional sentence:",
                options: ["If I will have money, I buy a car", "If I have money, I will buy a car", "If I had money, I will buy a car", "If I have money, I would buy a car"],
                correct: 1
            },
            {
                question: "Which is the correct passive form of 'They built the house'?",
                options: ["The house built by them", "The house was built by them", "The house is built by them", "The house has built by them"],
                correct: 1
            },
            {
                question: "What's the meaning of 'break the ice' in conversation?",
                options: ["To start a conversation", "To end a conversation", "To argue", "To cool down"],
                correct: 0
            },
            {
                question: "Choose the correct reported speech: He said, 'I am working.'",
                options: ["He said he is working", "He said he was working", "He said he has been working", "He said he will work"],
                correct: 1
            }
        ]
    };
    
    return questionsByClass[courseType] || [];
}

// Get course display name
function getCourseDisplayName(courseType) {
    const displayNames = {
        'tieu-hoc': 'Khối Tiểu học (Starters - Movers - Flyers)',
        'thcs': 'Khối THCS (Pre-KET - PET)', 
        'thpt': 'Luyện thi THPT',
        'tieng-trung': 'Tiếng Trung cơ bản',
        'tieng-trung-11': 'Tiếng Trung cơ bản 1-1',
        'tieng-anh-giao-tiep': 'Tiếng Anh giao tiếp',
        'tieng-anh-giao-tiep-11': 'Tiếng Anh giao tiếp 1-1',
        'chung-chi': 'Luyện thi chứng chỉ (B1, B2, TOEIC, IELTS)'
    };
    return displayNames[courseType] || courseType;
}

// Start quiz timer
function startQuizTimer(totalQuestions) {
    let timeRemaining = 300; // 5 minutes
    const timerDisplay = document.getElementById('timer-text');
    
    const timer = setInterval(() => {
        timeRemaining--;
        
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timerDisplay) {
            timerDisplay.textContent = formattedTime;
            
            // Change color when time is running out
            if (timeRemaining <= 60) {
                timerDisplay.style.color = '#e74c3c';
                timerDisplay.style.animation = 'pulse 1s infinite';
            } else if (timeRemaining <= 120) {
                timerDisplay.style.color = '#f39c12';
            }
        }
        
        // Time's up
        if (timeRemaining <= 0) {
            clearInterval(timer);
            autoSubmitQuiz();
        }
    }, 1000);
    
    // Store timer reference for cleanup
    window.quizTimer = timer;
}

// Auto submit quiz when time runs out
function autoSubmitQuiz() {
    alert('⏰ Hết thời gian! Tự động nộp bài...');
    setTimeout(() => {
        const quizForm = document.getElementById('quiz-form');
        if (quizForm) {
            quizForm.dispatchEvent(new Event('submit'));
        }
    }, 1000);
}

// Update progress
function updateProgress(totalQuestions) {
    const answeredQuestions = document.querySelectorAll('input[type="radio"]:checked').length;
    const progressText = document.getElementById('progress-text');
    if (progressText) {
        progressText.textContent = `${answeredQuestions}/${totalQuestions}`;
    }
}

// Submit quiz
function submitQuiz(questions) {
    // Stop timer
    if (window.quizTimer) {
        clearInterval(window.quizTimer);
        window.quizTimer = null;
    }
    
    let score = 0;
    const answers = {};
    
    // Calculate score
    questions.forEach((question, index) => {
        const selected = document.querySelector(`input[name="q${index}"]:checked`);
        if (selected) {
            const answer = parseInt(selected.value);
            answers[`q${index}`] = {
                selected: answer,
                correct: question.correct,
                isCorrect: answer === question.correct,
                question: question.question,
                selectedOption: question.options[answer],
                correctOption: question.options[question.correct]
            };
            if (answer === question.correct) {
                score++;
            }
        }
    });
    
    console.log('🎯 Quiz completed! Score:', score);
    console.log('🔍 Current player ID:', config.currentPlayerId);
    
    // Save result to database if config is available
    if (typeof config !== 'undefined' && config.updateQuizResult) {
        config.updateQuizResult({
            score: score,
            timestamp: new Date().toISOString()
        }).then(() => {
            console.log('✅ Score saved successfully!');
        }).catch(error => {
            console.error('❌ Lỗi lưu điểm:', error);
        });
    } else {
        console.error('❌ Config or updateQuizResult not available');
    }
    
    // Show result
    showResult(score, answers, questions.length);
}

// Show quiz result
function showResult(score, answers, totalQuestions) {
    const quizContainer = document.getElementById('quiz-container');
    const passed = score >= 3;
    
    let resultHTML = `
        <div class="logo">
            <img src="assets/logo.svg" alt="Logo Trung Tâm" class="center-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div class="logo-fallback" style="display: none;">🎓</div>
            <h2>📊 Kết Quả Quiz</h2>
        </div>
        
        <div class="result-score">
            🎯 Bạn trả lời đúng: ${score}/${totalQuestions} câu
        </div>
    `;
    
    // Show detailed answers if passed
    if (passed) {
        resultHTML += '<div class="detailed-answers">';
        Object.keys(answers).forEach((key, index) => {
            const answer = answers[key];
            resultHTML += `
                <div class="answer-item ${answer.isCorrect ? 'correct' : 'incorrect'}">
                    <strong>Câu ${index + 1}:</strong> ${answer.isCorrect ? '✅' : '❌'}<br>
                    <small>Bạn chọn: ${answer.selectedOption}</small><br>
                    ${!answer.isCorrect ? `<small class="correct-answer">Đáp án đúng: ${answer.correctOption}</small>` : ''}
                </div>
            `;
        });
        resultHTML += '</div>';
    }
    
    if (passed) {
        resultHTML += `
            <div class="result-message success">
                🎉 <strong>Chúc mừng bạn!</strong><br>
                Bạn đã đạt yêu cầu để tham gia vòng quay may mắn!<br>
                <small>Có cơ hội nhận được nhiều phần quà hấp dẫn!</small>
            </div>
            <button class="btn-primary" onclick="showWheel()">🎯 Vào vòng quay may mắn</button>
        `;
    } else {
        resultHTML += `
            <div class="result-message warning">
                😔 <strong>Rất tiếc!</strong><br>
                Bạn cần trả lời đúng tối thiểu 3/${totalQuestions} câu để vào vòng quay.<br>
                <small>Nhưng đừng lo! Chúng tôi vẫn có những ưu đãi dành cho bạn.</small>
            </div>
            <button class="btn-secondary" onclick="restartQuiz()">🔄 Làm lại Quiz</button>
            <button class="btn-primary" onclick="showCourseRegistration()">🎓 Tìm hiểu khóa học</button>
        `;
    }
    
    quizContainer.innerHTML = resultHTML;
}

// Restart quiz
function restartQuiz() {
    const quizContainer = document.getElementById('quiz-container');
    if (quizContainer) {
        // Get the course type from the current user or form
        const courseSelect = document.getElementById('student-class');
        const courseType = courseSelect ? courseSelect.value : 'tieu-hoc';
        showQuiz(courseType);
    }
}

// Show course registration for users who didn't pass
function showCourseRegistration() {
    const quizContainer = document.getElementById('quiz-container');
    quizContainer.innerHTML = `
        <div class="logo">
            <img src="assets/logo.svg" alt="Logo Trung Tâm" class="center-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div class="logo-fallback" style="display: none;">🎓</div>
            <h2>🎓 Đăng Ký Khóa Học</h2>
            <p>Mặc dù bạn chưa đạt điều kiện vào vòng quay, chúng tôi vẫn có nhiều ưu đãi đặc biệt cho bạn!</p>
        </div>
        
        <div class="registration-options">
            <button class="btn-primary" onclick="registerCourse()">✅ Đăng Ký Ngay</button>
            <button class="btn-secondary" onclick="declineCourse()">❌ Để Sau</button>
        </div>
    `;
}

// Register course
function registerCourse() {
    if (typeof config !== 'undefined' && config.updateFinalChoice) {
        config.updateFinalChoice({
            decision: true,
            timestamp: new Date().toISOString()
        }).catch(error => {
            console.error('❌ Lỗi lưu quyết định:', error);
        });
    }
    showFinalScreen('register');
}

// Decline course
function declineCourse() {
    if (typeof config !== 'undefined' && config.updateFinalChoice) {
        config.updateFinalChoice({
            decision: false,
            timestamp: new Date().toISOString()
        }).catch(error => {
            console.error('❌ Lỗi lưu quyết định:', error);
        });
    }
    showFinalScreen('decline');
}

// Show final screen
function showFinalScreen(decision) {
    const quizContainer = document.getElementById('quiz-container');
    const decisionText = decision === 'register' ? 'ĐĂNG KÝ' : 'ĐỂ SAU';
    const decisionColor = decision === 'register' ? '#27ae60' : '#f39c12';
    
    let prizeSection = '';
    if (decision === 'register') {
        prizeSection = `
            <div class="prize-info">
                <h3>🎁 Ưu Đãi Đặc Biệt</h3>
                <div class="prize-name">🎁 Học bổng 15% khóa học</div>
                <p><strong>Trung tâm đã ghi nhận thông tin và sẽ trao quà trực tiếp khi bạn tham dự lớp học!</strong></p>
            </div>
        `;
    }
    
    quizContainer.innerHTML = `
        <div class="logo">
            <img src="assets/logo.svg" alt="Logo Trung Tâm" class="center-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div class="logo-fallback" style="display: none;">🎓</div>
            <h2>🎓 Trung Tâm Ngoại Ngữ Việt Úc Vĩnh Long</h2>
        </div>
        
        <div class="final-message" style="color: ${decisionColor};">
            <h3>🎉 Cảm ơn bạn đã tham gia!</h3>
            <p>Bạn đã chọn: <strong>${decisionText}</strong></p>
        </div>
        
        ${prizeSection}
        
        <div class="contact-info">
            <h3>📞 Thông tin liên hệ:</h3>
            <p><strong>🏢 Địa chỉ:</strong> Số 36/7, đường Trần Phú, Phường Phước Hậu, Tỉnh Vĩnh Long</p>
            <p><strong>📱 Hotline:</strong> 02703.912.007</p>
            <p><strong>📧 Email:</strong> ngoainguvietuceducation@gmail.com</p>
            <p><strong>🌐 Website:</strong> ngoainguvietuc.vn</p>
        </div>
        
        <div class="final-actions">
            <button class="btn-primary" onclick="window.open('tel:02703.912.007')">📞 Gọi ngay</button>
            <button class="btn-secondary" onclick="location.reload()">🔄 Làm lại</button>
        </div>
    `;
}

// Show wheel
function showWheel() {
    const quizContainer = document.getElementById('quiz-container');
    
    console.log('🎯 Showing wheel...');
    console.log('🔍 Current player ID:', config.currentPlayerId);
    
    quizContainer.innerHTML = `
        <div class="logo">
            <img src="assets/logo.svg" alt="Logo Trung Tâm" class="center-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div class="logo-fallback" style="display: none;">🎓</div>
            <h2>🎯 Vòng Quay May Mắn</h2>
            <p>Chúc mừng bạn! Bạn đã đạt điều kiện tham gia vòng quay</p>
        </div>
        
        <div class="wheel-container">
            <div class="wheel-wrapper">
                <div class="wheel" id="prize-wheel">
                    <div class="wheel-center">
                        <span>🎯</span>
                    </div>
                    <!-- Prize segments with labels -->
                    <div class="prize-segment segment-1" style="--start: 0deg; --end: 72deg;">
                        <div class="prize-label">
                            <div class="prize-icon-wheel">✏️</div>
                            <div class="prize-name-wheel">Bút viết</div>
                        </div>
                    </div>
                    <div class="prize-segment segment-2" style="--start: 72deg; --end: 144deg;">
                        <div class="prize-label">
                            <div class="prize-icon-wheel">🎒</div>
                            <div class="prize-name-wheel">Balo VAE</div>
                        </div>
                    </div>
                    <div class="prize-segment segment-3" style="--start: 144deg; --end: 216deg;">
                        <div class="prize-label">
                            <div class="prize-icon-wheel">📚</div>
                            <div class="prize-name-wheel">Giáo trình</div>
                        </div>
                    </div>
                    <div class="prize-segment segment-4" style="--start: 216deg; --end: 288deg;">
                        <div class="prize-label">
                            <div class="prize-icon-wheel">📏</div>
                            <div class="prize-name-wheel">Thước</div>
                        </div>
                    </div>
                    <div class="prize-segment segment-5" style="--start: 288deg; --end: 360deg;">
                        <div class="prize-label">
                            <div class="prize-icon-wheel">👕</div>
                            <div class="prize-name-wheel">Áo VAE</div>
                        </div>
                    </div>
                </div>
                <!-- Fixed pointer that doesn't move -->
                <div class="wheel-pointer"></div>
            </div>
            
            <button class="spin-button" id="spin-btn" onclick="spinWheel()">🎯 Quay Thưởng</button>
            
            <div id="prize-result" style="display: none;">
                <h3>🎉 Chúc mừng bạn!</h3>
                <div class="won-prize">
                    <span class="prize-icon-large" id="won-prize-icon"></span>
                    <div class="prize-name-large" id="won-prize-name"></div>
                    <div class="prize-description" id="won-prize-description"></div>
                </div>
                
                <div class="prize-actions">
                    <button class="btn-primary" onclick="registerForPrize()">✅ Đăng ký nhận quà</button>
                    <button class="btn-secondary" onclick="contactLater()">📞 Tôi sẽ liên hệ lại sau</button>
                </div>
            </div>
        </div>
    `;
    
    console.log('✅ Wheel HTML created successfully');
}

// Spin the wheel
function spinWheel() {
    const wheel = document.getElementById('prize-wheel');
    const spinBtn = document.getElementById('spin-btn');
    const prizeResult = document.getElementById('prize-result');
    
    if (!wheel || !spinBtn) {
        console.error('❌ Wheel elements not found');
        return;
    }
    
    console.log('🎯 Spinning wheel...');
    console.log('🔍 Current player ID:', config.currentPlayerId);
    
    // Disable button during spin
    spinBtn.disabled = true;
    spinBtn.textContent = '🔄 Đang quay...';
    
    // Random prize
    const randomIndex = Math.floor(Math.random() * prizes.length);
    currentPrize = prizes[randomIndex];
    
    console.log('🎁 Selected prize:', currentPrize);
    
    // Random rotation (multiple full rotations + prize position)
    const baseRotation = 1440; // 4 full rotations
    const prizeRotation = (360 / prizes.length) * randomIndex;
    const finalRotation = baseRotation + prizeRotation;
    
    // Add spinning class
    wheel.classList.add('spinning');
    wheel.style.transform = `rotate(${finalRotation}deg)`;
    
    // Show result after animation
    setTimeout(() => {
        wheel.classList.remove('spinning');
        
        // Update prize display
        document.getElementById('won-prize-icon').textContent = currentPrize.icon;
        document.getElementById('won-prize-name').textContent = currentPrize.name;
        document.getElementById('won-prize-description').textContent = currentPrize.description;
        
        prizeResult.style.display = 'block';
        spinBtn.style.display = 'none';
        
        console.log('🎉 Wheel stopped! Saving prize to Firebase...');
        
        // Save prize to Firebase
        if (typeof config !== 'undefined' && config.updateWheelResult) {
            config.updateWheelResult({
                prize: currentPrize.name,
                prizeIcon: currentPrize.icon,
                prizeDescription: currentPrize.description,
                timestamp: new Date().toISOString()
            }).then(() => {
                console.log('✅ Prize saved successfully!');
            }).catch(error => {
                console.error('❌ Lỗi lưu phần thưởng:', error);
            });
        } else {
            console.error('❌ Config or updateWheelResult not available');
        }
    }, 4000); // 4 seconds to match CSS animation
}

// Prize wheel prizes
const prizes = [
    {
        name: "Combo bút viết",
        icon: "✏️",
        description: "Bộ bút viết chất lượng cao"
    },
    {
        name: "Balo VAE",
        icon: "🎒",
        description: "Balo thương hiệu VAE"
    },
    {
        name: "Giáo trình",
        icon: "📚",
        description: "Bộ giáo trình học tập"
    },
    {
        name: "Thước",
        icon: "📏",
        description: "Thước kẻ chính xác"
    },
    {
        name: "Áo VAE",
        icon: "👕",
        description: "Áo thun thương hiệu VAE"
    }
];

let currentPrize = null;

function registerForPrize() {
    console.log('✅ User chose to register for prize');
    console.log('🔍 Current player ID:', config.currentPlayerId);
    console.log('🎁 Prize:', currentPrize);
    
    if (typeof config !== 'undefined' && config.updateFinalChoice) {
        config.updateFinalChoice({
            decision: true,
            prize: currentPrize.name,
            prizeIcon: currentPrize.icon,
            timestamp: new Date().toISOString()
        }).then(() => {
            console.log('✅ Final choice saved successfully!');
        }).catch(error => {
            console.error('❌ Lỗi lưu quyết định:', error);
        });
    } else {
        console.error('❌ Config or updateFinalChoice not available');
    }
    showFinalScreenWithPrize();
}

function contactLater() {
    console.log('📞 User chose to contact later');
    console.log('🔍 Current player ID:', config.currentPlayerId);
    console.log('🎁 Prize:', currentPrize);
    
    if (typeof config !== 'undefined' && config.updateFinalChoice) {
        config.updateFinalChoice({
            decision: false,
            prize: currentPrize.name,
            prizeIcon: currentPrize.icon,
            timestamp: new Date().toISOString()
        }).then(() => {
            console.log('✅ Final choice saved successfully!');
        }).catch(error => {
            console.error('❌ Lỗi lưu quyết định:', error);
        });
    } else {
        console.error('❌ Config or updateFinalChoice not available');
    }
    showFinalScreenContactLater();
}

function showFinalScreenWithPrize() {
    const quizContainer = document.getElementById('quiz-container');
    const playerName = document.getElementById('student-name')?.value || 'Bạn';
    
    quizContainer.innerHTML = `
        <div class="logo">
            <img src="assets/logo.svg" alt="Logo Trung Tâm" class="center-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div class="logo-fallback" style="display: none;">🎓</div>
            <h2>🎓 Trung Tâm Ngoại Ngữ Việt Úc Vĩnh Long</h2>
        </div>
        
        <div class="final-message" style="color: #27ae60;">
            <h3>🎉 Chúc mừng ${playerName}!</h3>
            <p>Bạn đã chọn: <strong>ĐĂNG KÝ NHẬN QUÀ</strong></p>
        </div>
        
        <div class="prize-info">
            <h3>🎁 Phần Thưởng Của Bạn</h3>
            <div class="prize-name">
                <span class="prize-icon-large">${currentPrize.icon}</span>
                ${currentPrize.name}
            </div>
            <p><strong>Trung tâm đã ghi nhận thông tin và sẽ trao quà trực tiếp khi bạn tham dự lớp học!</strong></p>
        </div>
        
        <div class="contact-info">
            <h3>📞 Thông tin liên hệ:</h3>
            <p><strong>🏢 Địa chỉ:</strong> Số 36/7, đường Trần Phú, Phường Phước Hậu, Tỉnh Vĩnh Long</p>
            <p><strong>📱 Hotline:</strong> 02703.912.007</p>
            <p><strong>📧 Email:</strong> ngoainguvietuceducation@gmail.com</p>
            <p><strong>🌐 Website:</strong> ngoainguvietuc.vn</p>
        </div>
        
        <div class="final-actions">
            <button class="btn-primary" onclick="window.open('tel:02703.912.007')">📞 Gọi ngay</button>
            <button class="btn-secondary" onclick="location.reload()">🔄 Làm lại</button>
        </div>
    `;
}

function showFinalScreenContactLater() {
    const quizContainer = document.getElementById('quiz-container');
    
    quizContainer.innerHTML = `
        <div class="logo">
            <img src="assets/logo.svg" alt="Logo Trung Tâm" class="center-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div class="logo-fallback" style="display: none;">🎓</div>
            <h2>🎓 Trung Tâm Ngoại Ngữ Việt Úc Vĩnh Long</h2>
        </div>
        
        <div class="final-message" style="color: #f39c12;">
            <h3>🎉 Cảm ơn bạn đã tham gia thử sức!</h3>
            <p>Bạn đã chọn: <strong>LIÊN HỆ LẠI SAU</strong></p>
        </div>
        
        <div class="prize-info">
            <h3>🎁 Phần Thưởng Đã Trúng</h3>
            <div class="prize-name">
                <span class="prize-icon-large">${currentPrize.icon}</span>
                ${currentPrize.name}
            </div>
            <p><strong>Chúng tôi sẽ liên hệ lại với bạn sớm nhất để trao phần thưởng!</strong></p>
        </div>
        
        <div class="contact-info">
            <h3>📞 Thông tin liên hệ:</h3>
            <p><strong>🏢 Địa chỉ:</strong> Số 36/7, đường Trần Phú, Phường Phước Hậu, Tỉnh Vĩnh Long</p>
            <p><strong>📱 Hotline:</strong> 02703.912.007</p>
            <p><strong>📧 Email:</strong> ngoainguvietuceducation@gmail.com</p>
            <p><strong>🌐 Website:</strong> ngoainguvietuc.vn</p>
        </div>
        
        <div class="final-actions">
            <button class="btn-primary" onclick="window.open('tel:02703.912.007')">📞 Gọi ngay</button>
            <button class="btn-secondary" onclick="location.reload()">🔄 Làm lại</button>
        </div>
    `;
}