// Recycling App JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('Recycling App loaded');

    // Add animation to cards on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all cards
    const cards = document.querySelectorAll('.recycling-card, .tip-item, .stat-card');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Add click event to recycling cards for more info
    const recyclingCards = document.querySelectorAll('.recycling-card');
    recyclingCards.forEach(card => {
        card.addEventListener('click', function() {
            this.classList.toggle('expanded');
        });
    });

    // Interactive stats counter animation
    animateStats();

    // Add search/filter functionality for recycling items
    addSearchFunctionality();

    // Add interactive quiz or game elements
    initializeRecyclingQuiz();
});

// Animate statistics numbers
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-card .number');
    
    statNumbers.forEach(stat => {
        const finalValue = parseInt(stat.textContent);
        const duration = 2000; // 2 seconds
        const stepTime = 50;
        const steps = duration / stepTime;
        const increment = finalValue / steps;
        let currentValue = 0;

        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= finalValue) {
                stat.textContent = finalValue;
                clearInterval(timer);
            } else {
                stat.textContent = Math.floor(currentValue);
            }
        }, stepTime);
    });
}

// Add search functionality for recycling categories
function addSearchFunctionality() {
    const searchInput = document.getElementById('recycling-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.recycling-card');

        cards.forEach(card => {
            const cardText = card.textContent.toLowerCase();
            if (cardText.includes(searchTerm)) {
                card.style.display = 'block';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 10);
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(-20px)';
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            }
        });
    });
}

// Initialize recycling quiz
function initializeRecyclingQuiz() {
    const quizButton = document.getElementById('start-quiz');
    if (!quizButton) return;

    const quizQuestions = [
        {
            question: "Can pizza boxes be recycled?",
            answer: "Only if they're clean and grease-free",
            options: ["Yes, always", "No, never", "Only if they're clean and grease-free"],
            correct: 2
        },
        {
            question: "What type of plastic is most commonly recycled?",
            answer: "PET (Type 1)",
            options: ["PET (Type 1)", "PVC (Type 3)", "Polystyrene (Type 6)"],
            correct: 0
        },
        {
            question: "Should you rinse containers before recycling?",
            answer: "Yes, to prevent contamination",
            options: ["Yes, to prevent contamination", "No, it wastes water", "Only glass containers"],
            correct: 0
        }
    ];

    let currentQuestion = 0;
    let score = 0;

    quizButton.addEventListener('click', function() {
        startQuiz();
    });

    function startQuiz() {
        currentQuestion = 0;
        score = 0;
        showQuestion();
    }

    function showQuestion() {
        if (currentQuestion >= quizQuestions.length) {
            showResults();
            return;
        }

        const question = quizQuestions[currentQuestion];
        const quizContainer = document.getElementById('quiz-container');
        if (!quizContainer) return;

        quizContainer.innerHTML = `
            <div class="quiz-question">
                <h3>Question ${currentQuestion + 1} of ${quizQuestions.length}</h3>
                <p>${question.question}</p>
                <div class="quiz-options">
                    ${question.options.map((option, index) => `
                        <button class="quiz-option" data-index="${index}">${option}</button>
                    `).join('')}
                </div>
            </div>
        `;

        const optionButtons = quizContainer.querySelectorAll('.quiz-option');
        optionButtons.forEach(button => {
            button.addEventListener('click', function() {
                const selectedIndex = parseInt(this.dataset.index);
                checkAnswer(selectedIndex);
            });
        });
    }

    function checkAnswer(selectedIndex) {
        const question = quizQuestions[currentQuestion];
        if (selectedIndex === question.correct) {
            score++;
        }
        currentQuestion++;
        setTimeout(showQuestion, 500);
    }

    function showResults() {
        const quizContainer = document.getElementById('quiz-container');
        if (!quizContainer) return;

        const percentage = (score / quizQuestions.length) * 100;
        quizContainer.innerHTML = `
            <div class="quiz-results">
                <h3>Quiz Complete!</h3>
                <p>You scored ${score} out of ${quizQuestions.length}</p>
                <p>${percentage >= 70 ? '🎉 Great job! You know your recycling!' : '📚 Keep learning about recycling!'}</p>
                <button class="btn-primary" onclick="location.reload()">Try Again</button>
            </div>
        `;
    }
}

// Add tooltip functionality for recycling symbols
function addTooltips() {
    const symbols = document.querySelectorAll('[data-tooltip]');
    
    symbols.forEach(symbol => {
        symbol.addEventListener('mouseenter', function(e) {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = this.dataset.tooltip;
            document.body.appendChild(tooltip);

            const rect = this.getBoundingClientRect();
            tooltip.style.left = rect.left + 'px';
            tooltip.style.top = (rect.top - tooltip.offsetHeight - 5) + 'px';

            this._tooltip = tooltip;
        });

        symbol.addEventListener('mouseleave', function() {
            if (this._tooltip) {
                this._tooltip.remove();
                this._tooltip = null;
            }
        });
    });
}

// Initialize tooltips
addTooltips();
