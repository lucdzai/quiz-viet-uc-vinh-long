// Dữ liệu người dùng hiện tại
let currentUser = {};
let userAnswers = {};
let userScore = 0;
let userId = null;

// Câu hỏi cho từng lớp học (giữ nguyên như trước)
const questionsByClass = {
    'tieu-hoc': [
        {
            question: "How do you say 'Xin chào' in English?",
            options: ["Hello", "Goodbye", "Thank you", "Sorry"],
            correct: 0
        },
        {
            question: "What color is the sun?",
            options: ["Blue", "Green", "Yellow", "Red"],
            correct: 2
        },
        {
            question: "How many days are there in a week?",
            options: ["Five", "Six", "Seven", "Eight"],
            correct: 2
        },
        {
            question: "What do you say when you meet someone for the first time?",
            options: ["Goodbye", "Nice to meet you", "See you later", "Good night"],
            correct: 1
        },
        {
            question: "Which animal says 'meow'?",
            options: ["Dog", "Cat", "Bird", "Fish"],
            correct: 1
        }
    ],
    // ... các câu hỏi khác giữ nguyên như trước
};

// Khởi tạo ứng dụng
window.onload = function() {
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
};

// Tạo QR Code với URL thực tế
function generateQR() {
    // Tạo URL trỏ đến trang student.html
    const url = CONFIG.WEBSITE_URL + "/student.html";
    const qrContainer = document.getElementById('qr-code');
    
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
            qrContainer.innerHTML = '<p style="color: #e74c3c;">❌ Không thể tạo mã QR</p>';
        } else {
            console.log('✅ QR Code generated successfully!');
        }
    });
}

// Cập nhật thống kê realtime
async function updateStats() {
    try {
        const stats = await Database.getStats();
        document.getElementById('total-participants').textContent = stats.totalParticipants || 0;
        document.getElementById('completed-quiz').textContent = stats.completedQuiz || 0;
        document.getElementById('passed-quiz').textContent = stats.passedQuiz || 0;
    } catch (error) {
        console.error('Lỗi cập nhật thống kê:', error);
    }
}

// Xử lý form thông tin học sinh
document.getElementById('info-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Hiển thị loading
    document.getElementById('loading').style.display = 'block';
    
    // Lưu thông tin người dùng
    currentUser = {
        name: document.getElementById('student-name').value.trim(),
        phone: document.getElementById('student-phone').value.trim(),
        classType: document.getElementById('student-class').value,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ipAddress: await getUserIP()
    };
    
    // Validate
    if (!currentUser.name || !currentUser.phone || !currentUser.classType) {
        alert('⚠️ Vui lòng điền đầy đủ thông tin!');
        document.getElementById('loading').style.display = 'none';
        return;
    }
    
    // Validate số điện thoại
    if (!/^[0-9]{10,11}$/.test(currentUser.phone)) {
        alert('⚠️ Số điện thoại không hợp lệ! Vui lòng nhập 10-11 số.');
        document.getElementById('loading').style.display = 'none';
        return;
    }
    
    try {
        // Lưu vào database
        const result = await Database.saveUserData(currentUser);
        if (result.success) {
            userId = result.userId || currentUser.timestamp;
            
            // Ẩn loading và chuyển sang quiz
            document.getElementById('loading').style.display = 'none';
            showQuiz();
            
            if (result.fallback) {
                showNotification('⚠️ Đã lưu thông tin tạm thời (offline mode)', 'warning');
            } else {
                showNotification('✅ Đã lưu thông tin thành công!', 'success');
            }
        } else {
            throw new Error('Không thể lưu thông tin');
        }
    } catch (error) {
        console.error('Lỗi lưu thông tin:', error);
        document.getElementById('loading').style.display = 'none';
        alert('❌ Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại!');
    }
});

// Lấy IP người dùng (để tracking)
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'unknown';
    }
}

// Hiển thị thông báo
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'warning' ? '#f39c12' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Hiển thị quiz
function showQuiz() {
    document.getElementById('student-form').style.display = 'none';
    document.getElementById('quiz-container').style.display = 'block';
    
    const questions = questionsByClass[currentUser.classType];
    const container = document.getElementById('quiz-container');
    
    let html = `
        <div class="logo">
            <h2>📝 Bài Quiz - ${getClassDisplayName(currentUser.classType)}</h2>
            <p>Chào <strong>${currentUser.name}</strong>! Trả lời 5 câu hỏi sau<br>
            <small>(Cần đúng tối thiểu 3/5 để vào vòng quay may mắn)</small></p>
        </div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: 0%" id="progress"></div>
        </div>
    `;
    
    questions.forEach((q, index) => {
        html += `
            <div class="question-container" id="question-${index}">
                <div class="question-title">Câu ${index + 1}: ${q.question}</div>
                <ul class="question-options">
                    ${q.options.map((option, i) => `
                        <li>
                            <label>
                                <input type="radio" name="q${index}" value="${i}" onchange="updateProgress()">
                                ${String.fromCharCode(65 + i)}. ${option}
                            </label>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    });
    
    html += '<button class="btn-primary" onclick="submitQuiz()" id="submit-btn" style="opacity: 0.5;" disabled>Hoàn thành tất cả câu hỏi để nộp bài 📤</button>';
    container.innerHTML = html;
}

// Cập nhật progress bar
function updateProgress() {
    const questions = questionsByClass[currentUser.classType];
    let answered = 0;
    
    questions.forEach((q, index) => {
        if (document.querySelector(`input[name="q${index}"]:checked`)) {
            answered++;
        }
    });
    
    const progress = (answered / questions.length) * 100;
    document.getElementById('progress').style.width = progress + '%';
    
    const submitBtn = document.getElementById('submit-btn');
    if (answered === questions.length) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.textContent = 'Nộp bài Quiz 📤';
        submitBtn.style.animation = 'pulse 2s infinite';
    } else {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.textContent = `Hoàn thành tất cả câu hỏi để nộp bài 📤 (${answered}/${questions.length})`;
        submitBtn.style.animation = 'none';
    }
}

// Nộp bài quiz
async function submitQuiz() {
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
        await Database.updateQuizResult(userId, userScore, userAnswers);
        showNotification('✅ Đã lưu kết quả quiz!', 'success');
    } catch (error) {
        console.error('Lỗi lưu kết quả quiz:', error);
        showNotification('⚠️ Lưu kết quả offline', 'warning');
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
    document.getElementById('result-container').style.display = 'block';
    
    const container = document.getElementById('result-container');
    const passed = userScore >= 3;
    
    let html = `
        <div class="logo">
            <h2>📊 Kết Quả Quiz</h2>
            <p>Lớp: ${getClassDisplayName(currentUser.classType)}</p>
        </div>
        <div class="result-score">
            🎯 Bạn trả lời đúng: ${userScore}/5 câu
        </div>
    `;
    
    // Hiển thị chi tiết từng câu
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
            <button class="btn-primary" onclick="showFinalScreen()">🎓 Tìm hiểu khóa học</button>
        `;
    }
    
    container.innerHTML = html;
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
        alert(`📊 Thống kê Quiz:\n\n👥 Tổng người tham gia: ${stats.totalParticipants}\n✅ Hoàn thành quiz: ${stats.completedQuiz}\n🎯 Đạt vòng quay: ${stats.passedQuiz}\n🏆 Tỷ lệ đạt: ${stats.completedQuiz > 0 ? Math.round((stats.passedQuiz / stats.completedQuiz) * 100) : 0}%`);
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
    
    let csv = 'Họ tên,Số điện thoại,Lớp học,Điểm,Thời gian,Trạng thái\n';
    users.forEach(user => {
        csv += `"${user.name}","${user.phone}","${getClassDisplayName(user.classType)}","${user.score || 'Chưa làm'}","${new Date(user.timestamp).toLocaleString('vi-VN')}","${user.score >= 3 ? 'Đạt vòng quay' : 'Chưa đạt'}"\n`;
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
    showQuiz();
}

// Placeholder functions cho các bước tiếp theo
function showWheel() {
    alert('🎯 Chức năng vòng quay sẽ được implement trong bước tiếp theo!');
}

function showFinalScreen() {
    alert('🎓 Chức năng màn hình cuối sẽ được implement trong bước tiếp theo!');
}