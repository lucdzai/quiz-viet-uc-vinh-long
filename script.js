// Dữ liệu người dùng hiện tại
let currentUser = {};
let userAnswers = {};
let userScore = 0;
let userId = null;
let quizTimer = null;
let timeRemaining = 300; // 5 phút = 300 giây

// Câu hỏi cho từng lớp học
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

// Initialize Firebase connection and application
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Firebase connection
    try {
        if (typeof FirebaseConfig !== 'undefined' && FirebaseConfig.initializeFirebase) {
            await FirebaseConfig.initializeFirebase();
            console.log('✅ Firebase initialized');
        } else {
            throw new Error('FirebaseConfig not available');
        }
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        handleOfflineMode();
    }

    // Initialize application based on current page
    initializeApplication();

    // Enhanced player form handling
    const form = document.getElementById('info-form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            try {
                const playerData = {
                    name: form.querySelector('#student-name').value.trim(),
                    phone: form.querySelector('#student-phone').value.trim(),
                    course: form.querySelector('#student-class').value.trim(),
                    startTime: new Date().toISOString(),
                    score: 0,
                    prize: '',
                    finalDecision: null
                };

                if (!playerData.name || !playerData.phone || !playerData.course) {
                    alert('Vui lòng điền đầy đủ thông tin!');
                    return;
                }

                if (await config.initializePlayer(playerData)) {
                    console.log('✅ Đã lưu thông tin:', playerData);
                    showQuizSection();
                }
            } catch (error) {
                console.error('❌ Lỗi:', error);
                alert('Có lỗi xảy ra: ' + error.message);
            }
        };
    }
});

// Khởi tạo ứng dụng
function initializeApplication() {
    // Kiểm tra xem đang ở trang nào dựa trên tên file
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'student.html') {
        // Trang học sinh - hiển thị form
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
            adminPanel.style.display = 'none';
        }
        const studentForm = document.getElementById('student-form');
        if (studentForm) {
            studentForm.style.display = 'block';
        }
    } else {
        // Trang admin (index.html) - hiển thị admin panel và tạo QR
        const adminPanel = document.getElementById('admin-panel');
        const studentForm = document.getElementById('student-form');
        
        if (adminPanel) {
            adminPanel.style.display = 'block';
            generateQR();
            updateStats();
            // Cập nhật stats mỗi 30 giây
            setInterval(updateStats, 30000);
        }
        
        if (studentForm) {
            studentForm.style.display = 'none';
        }
    }
}

// Handle offline mode
function handleOfflineMode() {
    console.log('🔄 Switching to offline mode');
    // Show offline indicator or warning if needed
    showNotification('⚠️ Chế độ offline - dữ liệu sẽ được lưu cục bộ', 'warning');
}

// Show quiz section after successful registration
function showQuizSection() {
    const playerForm = document.getElementById('info-form');
    const quizSection = document.getElementById('quiz-container');
    
    if (playerForm) {
        playerForm.style.display = 'none';
    }
    if (quizSection) {
        quizSection.style.display = 'block';
    }
}

// Tạo QR Code với URL thực tế
function generateQR() {
    // Tạo URL trỏ đến trang student.html
    const url = CONFIG.WEBSITE_URL + "/student.html";
    const qrContainer = document.getElementById('qr-code');
    
    // Kiểm tra xem QRCode library có khả dụng không
    if (typeof QRCode !== 'undefined') {
        QRCode.toCanvas(qrContainer, url, {
            width: 200,
            height: 200,
            colorDark: "#2c3e50",
            colorLight: "#ffffff",
            margin: 2,
            errorCorrectionLevel: 'M'
        }, function (error) {
            if (error) {
                console.error('QR Code generation failed:', error);
                showQRFallback(qrContainer, url);
            } else {
                console.log('✅ QR Code generated successfully!');
            }
        });
    } else {
        console.warn('QRCode library not available, showing fallback');
        showQRFallback(qrContainer, url);
    }
}

// Hiển thị fallback khi không thể tạo QR code
function showQRFallback(container, url) {
    container.innerHTML = `
        <div class="qr-fallback">
            <div style="font-size: 48px; margin-bottom: 10px;">📱</div>
            <strong>Không thể tạo mã QR</strong>
            <div class="fallback-info">
                <p>Học sinh có thể truy cập trực tiếp:</p>
                <div style="background: white; padding: 10px; border-radius: 8px; margin: 10px 0; word-break: break-all; font-family: monospace; font-size: 12px;">
                    ${url}
                </div>
                <button onclick="copyToClipboard('${url}')" class="btn-secondary" style="font-size: 12px; padding: 8px 15px;">
                    📋 Copy Link
                </button>
            </div>
        </div>
    `;
}

// Copy URL to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('📋 Đã copy link!', 'success');
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        showNotification('📋 Đã copy link!', 'success');
    } catch (err) {
        showNotification('❌ Không thể copy link', 'error');
    }
    document.body.removeChild(textArea);
}

// Cập nhật thống kê realtime
async function updateStats() {
    try {
        const stats = await Database.getStats();
        document.getElementById('total-participants').textContent = stats.totalParticipants || 0;
        document.getElementById('completed-quiz').textContent = stats.completedQuiz || 0;
        document.getElementById('passed-quiz').textContent = stats.passedQuiz || 0;
        
        // Thêm thống kê quyết định đăng ký nếu có elements
        if (document.getElementById('registered-users')) {
            document.getElementById('registered-users').textContent = stats.registeredUsers || 0;
        }
        if (document.getElementById('declined-users')) {
            document.getElementById('declined-users').textContent = stats.declinedUsers || 0;
        }
    } catch (error) {
        console.error('Lỗi cập nhật thống kê:', error);
    }
}

// Enhanced submitQuiz function for better async handling
async function submitQuiz() {
async function submitQuiz() {
    // Dừng timer
    stopQuizTimer();
    
    const questions = questionsByClass[currentUser.classType];
    userScore = 0;
    userAnswers = {};
    
    // Tính điểm
    questions.forEach((q, index) => {
        const selected = document.querySelector(`input[name="q${index}"]:checked`);
        if (selected) {
            const answer = parseInt(selected.value);
            userAnswers[`q${index}`] = {
                selected: answer,
                correct: q.correct,
                isCorrect: answer === q.correct,
                question: q.question,
                selectedOption: q.options[answer],
                correctOption: q.options[q.correct]
            };
            if (answer === q.correct) {
                userScore++;
            }
        }
    });
    
    // Lưu kết quả vào database
    try {
        await config.updateQuizResult({
            score: userScore,
            timestamp: new Date().toISOString()
        });
        console.log('✅ Đã lưu điểm:', userScore);
    } catch (error) {
        console.error('❌ Lỗi lưu điểm:', error);
        alert('Có lỗi khi lưu điểm: ' + error.message);
    }
    
    // Lưu vào currentUser
    currentUser.score = userScore;
    currentUser.answers = userAnswers;
    currentUser.quizCompletedAt = new Date().toISOString();
    
    // Hiển thị kết quả
    showResult();
}

// Hiển thị kết quả
function showResult() {
    document.getElementById('quiz-container').style.display = 'none';
    document.getElementById('student-form').style.display = 'none';
    document.getElementById('wheel-container').style.display = 'none';
    document.getElementById('final-container').style.display = 'none';
    document.getElementById('result-container').style.display = 'block';
    
    const container = document.getElementById('result-container');
    const passed = userScore >= 3;
    
    let html = `
        <div class="logo">
            <img src="assets/logo.svg" alt="Logo Trung Tâm" class="center-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div class="logo-fallback" style="display: none;">🎓</div>
            <h2>📊 Kết Quả Quiz</h2>
            <p>Lớp: ${getClassDisplayName(currentUser.classType)}</p>
        </div>
        <div class="result-score">
            🎯 Bạn trả lời đúng: ${userScore}/5 câu
        </div>
    `;
    
    // Hiển thị chi tiết từng câu - chỉ khi đạt yêu cầu
    if (passed) {
        html += '<div style="text-align: left; margin: 20px 0;">';
        Object.keys(userAnswers).forEach((key, index) => {
            const answer = userAnswers[key];
            html += `
                <div style="margin: 10px 0; padding: 10px; background: ${answer.isCorrect ? '#d4edda' : '#f8d7da'}; border-radius: 8px;">
                    <strong>Câu ${index + 1}:</strong> ${answer.isCorrect ? '✅' : '❌'}<br>
                    <small>Bạn chọn: ${answer.selectedOption}</small><br>
                    ${!answer.isCorrect ? `<small style="color: #155724;">Đáp án đúng: ${answer.correctOption}</small>` : ''}
                </div>
            `;
        });
        html += '</div>';
    }
    
    if (passed) {
        html += `
            <div class="result-message" style="color: #27ae60; background: #d4edda; padding: 15px; border-radius: 10px;">
                🎉 <strong>Chúc mừng bạn ${currentUser.name}!</strong><br>
                Bạn đã đạt yêu cầu để tham gia vòng quay may mắn!<br>
                <small>Có cơ hội nhận được nhiều phần quà hấp dẫn!</small>
            </div>
            <button class="btn-primary" onclick="showWheel()">🎯 Vào vòng quay may mắn</button>
        `;
    } else {
        html += `
            <div class="result-message" style="color: #721c24; background: #f8d7da; padding: 15px; border-radius: 10px;">
                😔 <strong>Rất tiếc!</strong><br>
                Bạn cần trả lời đúng tối thiểu 3/5 câu để vào vòng quay.<br>
                <small>Nhưng đừng lo! Chúng tôi vẫn có những ưu đãi dành cho bạn.</small>
            </div>
            <button class="btn-secondary" onclick="restartQuiz()">🔄 Làm lại Quiz</button>
            <button class="btn-primary" onclick="showCourseRegistration()">🎓 Tìm hiểu khóa học</button>
        `;
    }
    
    container.innerHTML = html;
}

// Bắt đầu timer cho quiz
function startQuizTimer() {
    const timerDisplay = document.getElementById('timer-text');
    
    quizTimer = setInterval(() => {
        timeRemaining--;
        
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timerDisplay) {
            timerDisplay.textContent = formattedTime;
            
            // Đổi màu khi còn ít thời gian
            if (timeRemaining <= 60) {
                timerDisplay.style.color = '#e74c3c';
                timerDisplay.style.animation = 'pulse 1s infinite';
            } else if (timeRemaining <= 120) {
                timerDisplay.style.color = '#f39c12';
            }
        }
        
        // Hết thời gian
        if (timeRemaining <= 0) {
            clearInterval(quizTimer);
            autoSubmitQuiz();
        }
    }, 1000);
}

// Tự động nộp bài khi hết thời gian
function autoSubmitQuiz() {
    showNotification('⏰ Hết thời gian! Tự động nộp bài...', 'warning');
    setTimeout(() => {
        submitQuiz();
    }, 2000);
}

// Dừng timer
function stopQuizTimer() {
    if (quizTimer) {
        clearInterval(quizTimer);
        quizTimer = null;
    }
}

// Vòng quay may mắn
const wheelPrizes = [
    { name: '🖊️ Combo bút viết thước', probability: 20, color: '#3498db' },
    { name: '🎒 Cặp sách', probability: 15, color: '#e74c3c' },
    { name: '👕 Áo trung tâm', probability: 15, color: '#f1c40f' },
    { name: '📚 Combo giáo trình', probability: 20, color: '#27ae60' },
    { name: '🎁 Thử học miễn phí 1 buổi', probability: 25, color: '#9b59b6' },
    { name: '💝 Giảm 50% học phí', probability: 5, color: '#f39c12' }
];

// Hiển thị vòng quay
function showWheel() {
    document.getElementById('result-container').style.display = 'none';
    document.getElementById('quiz-container').style.display = 'none';
    document.getElementById('student-form').style.display = 'none';
    document.getElementById('final-container').style.display = 'none';
    document.getElementById('wheel-container').style.display = 'block';
    
    const container = document.getElementById('wheel-container');
    
    let html = `
        <div class="logo">
            <img src="assets/logo.svg" alt="Logo Trung Tâm" class="center-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div class="logo-fallback" style="display: none;">🎓</div>
            <h2>🎯 Vòng Quay May Mắn</h2>
            <p>Chúc mừng <strong>${currentUser.name}</strong>!<br>Bạn đã đạt điều kiện tham gia vòng quay</p>
        </div>
        
        <div class="wheel-wrapper">
            <div class="wheel-container-inner">
                <canvas id="wheel-canvas" width="400" height="400"></canvas>
                <div class="wheel-pointer">▼</div>
            </div>
        </div>
        
        <div class="wheel-controls">
            <button class="btn-primary" onclick="spinWheel()" id="spin-btn">🎯 QUAY NGAY!</button>
            <div id="wheel-result" style="display: none;">
                <div class="prize-announcement">
                    <h3 id="prize-text"></h3>
                    <p>Chúc mừng bạn đã nhận được phần quà!</p>
                    <button class="btn-primary" onclick="confirmPrizeRegistration()">🎁 Nhận Quà</button>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Vẽ vòng quay
    drawWheel();
}

// Vẽ vòng quay
function drawWheel() {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 180;
    
    let currentAngle = 0;
    
    wheelPrizes.forEach((prize, index) => {
        const sliceAngle = (prize.probability / 100) * 2 * Math.PI;
        
        // Vẽ sector
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = prize.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Vẽ text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(currentAngle + sliceAngle / 2);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 2;
        
        // Chia text thành nhiều dòng
        const lines = prize.name.split(' ');
        lines.forEach((line, i) => {
            ctx.fillText(line, radius * 0.7, (i - lines.length / 2 + 0.5) * 15);
        });
        
        ctx.restore();
        
        currentAngle += sliceAngle;
    });
    
    // Vẽ center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#2c3e50';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
}

// Quay vòng
function spinWheel() {
    const canvas = document.getElementById('wheel-canvas');
    const spinBtn = document.getElementById('spin-btn');
    
    spinBtn.disabled = true;
    spinBtn.textContent = '🎯 Đang quay...';
    
    // Tính toán phần thưởng dựa trên xác suất
    const randomNum = Math.random() * 100;
    let cumulativeProbability = 0;
    let selectedPrize = null;
    
    for (let prize of wheelPrizes) {
        cumulativeProbability += prize.probability;
        if (randomNum <= cumulativeProbability) {
            selectedPrize = prize;
            break;
        }
    }
    
    // Tính toán góc quay
    let targetAngle = 0;
    cumulativeProbability = 0;
    
    for (let prize of wheelPrizes) {
        const sliceAngle = (prize.probability / 100) * 360;
        if (prize === selectedPrize) {
            targetAngle = cumulativeProbability + sliceAngle / 2;
            break;
        }
        cumulativeProbability += sliceAngle;
    }
    
    // Animation quay
    const totalRotation = 1080 + (360 - targetAngle); // 3 vòng + góc đích
    let currentRotation = 0;
    const duration = 3000; // 3 giây
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        currentRotation = totalRotation * easeOut;
        
        canvas.style.transform = `rotate(${currentRotation}deg)`;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Hoàn thành quay
            setTimeout(() => {
                showWheelResult(selectedPrize);
            }, 500);
        }
    }
    
    // Play sound effect (if available)
    playSpinSound();
    
    animate();
}

// Hiển thị kết quả vòng quay
async function showWheelResult(prize) {
    const resultDiv = document.getElementById('wheel-result');
    const prizeText = document.getElementById('prize-text');
    
    prizeText.textContent = `🎉 ${prize.name}`;
    resultDiv.style.display = 'block';
    
    // Confetti effect
    showConfetti();
    
    // Lưu kết quả vòng quay
    currentUser.prize = prize.name;
    currentUser.wheelCompletedAt = new Date().toISOString();
    
    // Lưu vào database với enhanced config
    try {
        await config.updateWheelResult({
            prize: prize.name,
            timestamp: new Date().toISOString()
        });
        console.log('✅ Đã lưu quà:', prize.name);
    } catch (error) {
        console.error('❌ Lỗi lưu quà:', error);
        alert('Có lỗi khi lưu phần quà: ' + error.message);
    }
}

// Sound effect cho vòng quay
function playSpinSound() {
    try {
        // Create audio context for sound effect
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('Không thể phát âm thanh:', error);
    }
}

// Confetti effect
function showConfetti() {
    const colors = ['#f1c40f', '#e74c3c', '#3498db', '#27ae60', '#9b59b6', '#f39c12'];
    const confettiCount = 100;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            createConfettiPiece(colors[Math.floor(Math.random() * colors.length)]);
        }, i * 20);
    }
}

function createConfettiPiece(color) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background: ${color};
        left: ${Math.random() * window.innerWidth}px;
        top: -10px;
        z-index: 10000;
        border-radius: 50%;
        pointer-events: none;
        animation: confettiFall 3s linear forwards;
    `;
    
    document.body.appendChild(confetti);
    
    setTimeout(() => {
        confetti.remove();
    }, 3000);
}

// Admin functions
function resetQuiz() {
    if (confirm('🤔 Bạn có chắc muốn reset tất cả dữ liệu quiz?')) {
        localStorage.clear();
        location.reload();
    }
}

async function viewResults() {
    try {
        const stats = await Database.getStats();
        
        // Tạo thông tin chi tiết từ localStorage để hiển thị
        const users = JSON.parse(localStorage.getItem('quizUsers') || '[]');
        let detailText = '';
        
        if (users.length > 0) {
            detailText += '\n\n📋 CHI TIẾT NGƯỜI DÙNG:\n';
            detailText += '━━━━━━━━━━━━━━━━━━━━━━━━━\n';
            
            users.forEach((user, index) => {
                const score = user.score !== undefined ? `${user.score}/5` : 'Chưa làm';
                const wheelStatus = user.score >= 3 ? '🎯 Đạt vòng quay' : '❌ Chưa đạt';
                const prize = user.prize ? 
                    (typeof user.prize === 'string' ? user.prize : user.prize.name || 'N/A') : 'Không có';
                
                let decision = 'Chưa quyết định';
                if (user.choice === 'register' || user.registrationData?.registrationDecision === 'register') {
                    decision = '✅ Đăng ký';
                } else if (user.choice === 'decline' || user.registrationData?.registrationDecision === 'decline') {
                    decision = '❌ Từ chối';
                } else if (user.choice === 'completed') {
                    decision = '✅ Hoàn thành (cũ)';
                }
                
                detailText += `${index + 1}. ${user.name || 'N/A'}\n`;
                detailText += `   📱 ${user.phone || 'N/A'}\n`;
                detailText += `   📚 ${getClassDisplayName(user.classType) || 'N/A'}\n`;
                detailText += `   📊 Điểm: ${score} | ${wheelStatus}\n`;
                detailText += `   🎁 Quà: ${prize}\n`;
                detailText += `   📝 Quyết định: ${decision}\n`;
                detailText += `   ⏰ ${user.timestamp ? new Date(user.timestamp).toLocaleString('vi-VN') : 'N/A'}\n\n`;
            });
        }
        
        alert(`📊 THỐNG KÊ CHI TIẾT:\n\n` +
              `👥 Tổng người tham gia: ${stats.totalParticipants}\n` +
              `✅ Hoàn thành quiz: ${stats.completedQuiz}\n` +
              `🎯 Đạt vòng quay: ${stats.passedQuiz}\n` +
              `📈 Tỷ lệ đạt: ${stats.completedQuiz > 0 ? Math.round((stats.passedQuiz / stats.completedQuiz) * 100) : 0}%\n\n` +
              `📝 QUYẾT ĐỊNH ĐĂNG KÝ:\n` +
              `✅ Đã đăng ký: ${stats.registeredUsers || 0}\n` +
              `❌ Từ chối: ${stats.declinedUsers || 0}\n` +
              `💼 Tỷ lệ chuyển đổi: ${(stats.registeredUsers || 0) > 0 ? Math.round(((stats.registeredUsers || 0) / stats.totalParticipants) * 100) : 0}%` +
              detailText);
    } catch (error) {
        alert('❌ Không thể lấy dữ liệu thống kê!');
    }
}

function exportData() {
    // Xuất dữ liệu localStorage thành file Excel/CSV
    const users = JSON.parse(localStorage.getItem('quizUsers') || '[]');
    if (users.length === 0) {
        alert('❌ Không có dữ liệu để xuất!');
        return;
    }
    
    // Header với BOM cho UTF-8
    const BOM = '\uFEFF';
    let csv = BOM + 'Họ tên,Số điện thoại,Lớp học,Điểm quiz,Thời gian làm bài,Trạng thái vòng quay,Phần thưởng,Quyết định cuối,Thời gian quyết định\n';
    
    users.forEach(user => {
        const name = (user.name || '').replace(/"/g, '""');
        const phone = (user.phone || '').replace(/"/g, '""');
        const classType = getClassDisplayName(user.classType || '').replace(/"/g, '""');
        const score = user.score !== undefined ? `${user.score}/5` : 'Chưa làm';
        const timestamp = user.timestamp ? new Date(user.timestamp).toLocaleString('vi-VN') : '';
        const wheelStatus = user.score >= 3 ? 'Đạt vòng quay' : 'Chưa đạt';
        const prize = user.prize ? 
            (typeof user.prize === 'string' ? user.prize : 
             (user.prize.name ? user.prize.name : 'Không xác định')) : 'Không có';
        
        // Thêm thông tin quyết định cuối
        let finalDecision = 'Chưa quyết định';
        if (user.choice === 'register' || user.registrationData?.registrationDecision === 'register') {
            finalDecision = '✅ Đăng ký khóa học';
        } else if (user.choice === 'decline' || user.registrationData?.registrationDecision === 'decline') {
            finalDecision = '❌ Từ chối đăng ký';
        } else if (user.choice === 'completed') {
            finalDecision = '✅ Hoàn thành (cũ)'; // For legacy data
        }
        
        const decisionTime = user.finalChoiceTimestamp || 
                            user.registrationData?.completedAt || 
                            (user.choice ? new Date().toLocaleString('vi-VN') : '');
        
        csv += `"${name}","${phone}","${classType}","${score}","${timestamp}","${wheelStatus}","${prize}","${finalDecision}","${decisionTime}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `quiz-results-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showNotification('📤 Đã xuất dữ liệu thành công!', 'success');
}

// Helper functions
function getClassDisplayName(classType) {
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
    return displayNames[classType] || classType;
}

function restartQuiz() {
    userAnswers = {};
    userScore = 0;
    stopQuizTimer();
    showQuiz();
}

// Hiển thị modal đăng ký khóa học cho users không đạt vòng quay
function showCourseRegistration() {
    showModal(
        '🎓 Đăng Ký Khóa Học',
        'Mặc dù bạn chưa đạt điều kiện vào vòng quay, chúng tôi vẫn có nhiều ưu đãi đặc biệt cho bạn! Bạn có muốn đăng ký tham gia khóa học không?',
        '✅ Đăng Ký Ngay',
        '❌ Để Sau',
        function() {
            // User chose to register
            showFinalScreen('register');
        },
        function() {
            // User chose to decline
            showFinalScreen('decline');
        }
    );
}

// Custom Modal Functions
function showModal(title, message, confirmText = 'Xác nhận', cancelText = 'Hủy', onConfirm = null, onCancel = null) {
    // Remove existing modal if any
    const existingModal = document.getElementById('custom-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal HTML
    const modalHTML = `
        <div class="modal-overlay" id="custom-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-icon">🎁</div>
                    <h3>${title}</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn modal-btn-secondary" onclick="closeModal(false)">${cancelText}</button>
                    <button class="modal-btn modal-btn-primary" onclick="closeModal(true)">${confirmText}</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Store callbacks
    window.modalCallbacks = { onConfirm, onCancel };
    
    // Show modal with animation
    setTimeout(() => {
        document.getElementById('custom-modal').classList.add('show');
    }, 10);
    
    // Close on overlay click
    document.getElementById('custom-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal(false);
        }
    });
    
    // Close on ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal(false);
        }
    });
}

function closeModal(confirmed) {
    const modal = document.getElementById('custom-modal');
    if (!modal) return;
    
    // Hide with animation
    modal.classList.remove('show');
    
    // Remove after animation
    setTimeout(() => {
        modal.remove();
        
        // Execute callbacks
        if (window.modalCallbacks) {
            if (confirmed && window.modalCallbacks.onConfirm) {
                window.modalCallbacks.onConfirm();
            } else if (!confirmed && window.modalCallbacks.onCancel) {
                window.modalCallbacks.onCancel();
            }
            window.modalCallbacks = null;
        }
    }, 300);
}

// Xác nhận đăng ký khóa học để nhận quà
function confirmPrizeRegistration() {
    showModal(
        '🎁 Xác Nhận Nhận Quà',
        'Bạn có muốn đăng ký tham gia khóa học để nhận thưởng không?',
        '✅ Đăng Ký',
        '❌ Để Sau',
        function() {
            // Confirmed - user chose to register
            showFinalScreen('register');
        },
        function() {
            // Declined - user chose to decline
            showFinalScreen('decline');
        }
    );
}

// Màn hình cuối - thông tin liên hệ và khóa học
async function showFinalScreen(userChoice = 'completed') {
    document.getElementById('result-container').style.display = 'none';
    document.getElementById('wheel-container').style.display = 'none';
    document.getElementById('quiz-container').style.display = 'none';
    document.getElementById('student-form').style.display = 'none';
    document.getElementById('final-container').style.display = 'block';
    
    const container = document.getElementById('final-container');
    const hasPrize = currentUser.prize;
    
    let html = `
        <div class="logo">
            <img src="assets/logo.svg" alt="Logo Trung Tâm" class="center-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div class="logo-fallback" style="display: none;">🎓</div>
            <h2>🎓 Trung Tâm Ngoại Ngữ Việt Úc Vĩnh Long</h2>
            <p>Cảm ơn <strong>${currentUser.name}</strong> đã tham gia!</p>
        </div>
    `;
    
    // Show different content based on user's choice
    if (userChoice === 'register') {
        html += `
            <div class="registration-success">
                <h3>🎉 Cảm ơn bạn đã đăng ký!</h3>
                <p style="color: #27ae60; font-weight: 600;">✅ Bạn đã chọn <strong>ĐĂNG KÝ</strong> tham gia khóa học</p>
                <p>Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để tư vấn chi tiết.</p>
            </div>
        `;
    } else if (userChoice === 'decline') {
        html += `
            <div class="registration-decline">
                <h3>💭 Cảm ơn bạn đã tham gia!</h3>
                <p style="color: #f39c12; font-weight: 600;">ℹ️ Bạn đã chọn <strong>ĐỂ SAU</strong> việc đăng ký</p>
                <p>Không sao cả! Bạn có thể liên hệ với chúng tôi bất cứ lúc nào khi sẵn sàng.</p>
            </div>
        `;
    }
    
    if (hasPrize) {
        html += `
            <div class="prize-info">
                <h3>🎉 Phần quà của bạn:</h3>
                <div class="prize-display">${currentUser.prize}</div>
                <p><strong>Cách nhận quà:</strong><br>
                ${userChoice === 'register' ? 
                    'Vui lòng liên hệ trung tâm trong vòng 7 ngày để nhận quà và được tư vấn khóa học.' :
                    'Vui lòng liên hệ trung tâm trong vòng 7 ngày để nhận quà với thông tin bạn đã đăng ký.'
                }</p>
            </div>
        `;
    }
    
    html += `
        <div class="contact-info">
            <h3>📞 Thông tin liên hệ:</h3>
            <div class="contact-details">
                <p><strong>🏢 Địa chỉ:</strong><br>${CONFIG.CENTER_INFO.address}</p>
                <p><strong>📱 Hotline:</strong> <a href="tel:${CONFIG.CENTER_INFO.hotline}">${CONFIG.CENTER_INFO.hotline}</a></p>
                <p><strong>📧 Email:</strong> <a href="mailto:${CONFIG.CENTER_INFO.email}">${CONFIG.CENTER_INFO.email}</a></p>
                <p><strong>🌐 Website:</strong> <a href="${CONFIG.CENTER_INFO.website}" target="_blank">ngoainguvietuc.vn</a></p>
                <p><strong>📘 Facebook:</strong> <a href="${CONFIG.CENTER_INFO.facebook}" target="_blank">Trung tâm Ngoại ngữ Việt Úc</a></p>
                <p><strong>💬 Zalo:</strong> <a href="https://zalo.me/${CONFIG.CENTER_INFO.zalo}">${CONFIG.CENTER_INFO.zalo}</a></p>
            </div>
        </div>
        
        <div class="course-info">
            <h3>📚 Các khóa học hiện có:</h3>
            <div class="course-list">
                <div class="course-item">🧒 <strong>Khối Tiểu học:</strong> Starters, Movers, Flyers</div>
                <div class="course-item">👨‍🎓 <strong>Khối THCS:</strong> Pre-KET, PET</div>
                <div class="course-item">🎓 <strong>Luyện thi THPT:</strong> Ôn thi tốt nghiệp</div>
                <div class="course-item">🇨🇳 <strong>Tiếng Trung:</strong> Cơ bản & 1-1</div>
                <div class="course-item">💬 <strong>Tiếng Anh giao tiếp:</strong> Thực hành & 1-1</div>
                <div class="course-item">🏆 <strong>Luyện thi chứng chỉ:</strong> B1, B2, TOEIC, IELTS</div>
            </div>
        </div>
        
        <div class="final-actions">
            <button class="btn-primary" onclick="window.open('tel:${CONFIG.CENTER_INFO.hotline}')">📞 Gọi ngay</button>
            <button class="btn-secondary" onclick="window.open('${CONFIG.CENTER_INFO.facebook}', '_blank')">📘 Facebook</button>
            <button class="btn-secondary" onclick="window.open('https://zalo.me/${CONFIG.CENTER_INFO.zalo}', '_blank')">💬 Zalo</button>
        </div>
        
        <div class="thank-you">
            <p>🌟 <em>Cảm ơn bạn đã tin tưởng và lựa chọn Trung Tâm Ngoại Ngữ Việt Úc Vĩnh Long!</em></p>
            <p><small>Chúng tôi cam kết mang đến chất lượng giáo dục tốt nhất.</small></p>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Lưu lựa chọn cuối vào database với enhanced config
    try {
        await config.updateFinalChoice({
            decision: userChoice === 'register',
            timestamp: new Date().toISOString()
        });
        console.log('✅ Đã lưu quyết định:', userChoice);
    } catch (error) {
        console.error('❌ Lỗi lưu quyết định:', error);
        alert('Có lỗi khi lưu quyết định: ' + error.message);
    }
    
    // Cập nhật currentUser với choice
    currentUser.finalChoice = userChoice;
    currentUser.finalChoiceTimestamp = new Date().toISOString();
}