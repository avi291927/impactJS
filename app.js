// ======================================
// UTILITY FUNCTIONS
// ======================================

// Show toast notification
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, duration);
}

// Show loading spinner
function showLoader() {
    const loader = document.getElementById('loadingSpinner');
    if (loader) loader.classList.remove('hidden');
}

// Hide loading spinner
function hideLoader() {
    const loader = document.getElementById('loadingSpinner');
    if (loader) loader.classList.add('hidden');
}

// Generate random OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ======================================
// BLOCKCHAIN IMPLEMENTATION
// ======================================

class Block {
    constructor(index, timestamp, data, previousHash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.data = data;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    calculateHash() {
        const crypto = window.crypto || window.msCrypto;
        const data = this.index + this.previousHash + this.timestamp + JSON.stringify(this.data) + this.nonce;
        
        // Simple hash function for demonstration
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(64, '0');
    }

    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        console.log("Block mined: " + this.hash);
    }
}

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.loadFromStorage();
    }

    createGenesisBlock() {
        return new Block(0, new Date().toISOString(), {
            type: "genesis",
            message: "EventChain Genesis Block"
        }, "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(data) {
        const newBlock = new Block(
            this.chain.length,
            new Date().toISOString(),
            data,
            this.getLatestBlock().hash
        );
        newBlock.mineBlock(this.difficulty);
        this.chain.push(newBlock);
        this.saveToStorage();
        return newBlock;
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }

    saveToStorage() {
        localStorage.setItem('blockchain', JSON.stringify(this.chain));
    }

    loadFromStorage() {
        const stored = localStorage.getItem('blockchain');
        if (stored) {
            const parsedChain = JSON.parse(stored);
            this.chain = parsedChain.map(blockData => {
                const block = new Block(
                    blockData.index,
                    blockData.timestamp,
                    blockData.data,
                    blockData.previousHash
                );
                block.hash = blockData.hash;
                block.nonce = blockData.nonce;
                return block;
            });
        }
    }
}

// Initialize blockchain
const eventChain = new Blockchain();

// ======================================
// AUTHENTICATION LOGIC (Login Page)
// ======================================

if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
    let generatedOTP = '';
    let otpTimer;
    let timeLeft = 60;

    const emailForm = document.getElementById('emailForm');
    const otpForm = document.getElementById('otpForm');
    const emailInput = document.getElementById('email');
    const displayEmail = document.getElementById('displayEmail');
    const otpInputs = document.querySelectorAll('.otp-input');
    const resendBtn = document.getElementById('resendOtp');
    const changeEmailBtn = document.getElementById('changeEmail');
    const timerDisplay = document.getElementById('timer');

    // Handle Email Form Submission
    emailForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();

        if (!email) {
            showToast('Please enter your email address');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('Please enter a valid email address');
            return;
        }

        showLoader();

        // Simulate API call to send OTP
        setTimeout(() => {
            generatedOTP = generateOTP();
            console.log('Generated OTP:', generatedOTP); // For demo purposes

            // Store email in session
            sessionStorage.setItem('userEmail', email);

            // Switch to OTP form
            emailForm.classList.add('hidden');
            otpForm.classList.remove('hidden');
            displayEmail.textContent = email;

            hideLoader();
            showToast('OTP sent to ' + email);

            // Start timer
            startOTPTimer();

            // Focus first OTP input
            otpInputs[0].focus();
        }, 1500);
    });

    // Handle OTP Input
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1) {
                if (index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });

    // Handle OTP Form Submission
    otpForm.addEventListener('submit', (e) => {
        e.preventDefault();

        let enteredOTP = '';
        otpInputs.forEach(input => {
            enteredOTP += input.value;
        });

        if (enteredOTP.length !== 6) {
            showToast('Please enter complete OTP');
            return;
        }

        showLoader();

        // Simulate OTP verification
        setTimeout(() => {
            // For demo: accept any 6-digit OTP or the generated one
            if (enteredOTP === generatedOTP || enteredOTP.length === 6) {
                const email = sessionStorage.getItem('userEmail');
                
                // Save user session
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userEmail', email);
                localStorage.setItem('userName', email.split('@')[0]);

                // Add login event to blockchain
                eventChain.addBlock({
                    type: 'user_login',
                    email: email,
                    timestamp: new Date().toISOString()
                });

                hideLoader();
                showToast('Login successful! Redirecting...');

                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                hideLoader();
                showToast('Invalid OTP. Please try again.');
                otpInputs.forEach(input => input.value = '');
                otpInputs[0].focus();
            }
        }, 1500);
    });

    // OTP Timer
    function startOTPTimer() {
        timeLeft = 60;
        resendBtn.disabled = true;
        resendBtn.style.opacity = '0.5';

        otpTimer = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft + 's';

            if (timeLeft <= 0) {
                clearInterval(otpTimer);
                resendBtn.disabled = false;
                resendBtn.style.opacity = '1';
                timerDisplay.textContent = 'Expired';
            }
        }, 1000);
    }

    // Resend OTP
    resendBtn.addEventListener('click', () => {
        generatedOTP = generateOTP();
        console.log('New OTP:', generatedOTP); // For demo purposes
        showToast('New OTP sent!');
        startOTPTimer();
        otpInputs.forEach(input => input.value = '');
        otpInputs[0].focus();
    });

    // Change Email
    changeEmailBtn.addEventListener('click', () => {
        otpForm.classList.add('hidden');
        emailForm.classList.remove('hidden');
        clearInterval(otpTimer);
        otpInputs.forEach(input => input.value = '');
        emailInput.value = '';
    });
}

// ======================================
// DASHBOARD LOGIC
// ======================================

if (window.location.pathname.endsWith('dashboard.html')) {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'index.html';
    }

    // Set user info
    const userName = localStorage.getItem('userName') || 'User';
    const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
    document.getElementById('userName').textContent = userName;
    document.getElementById('userEmail').textContent = userEmail;

    // Sample Data
    const sampleEvents = [
        {
            id: 1,
            name: 'Tech Hackathon 2024',
            description: 'Build innovative solutions in 48 hours',
            date: '2024-03-15',
            time: '09:00 AM',
            venue: 'Main Auditorium',
            club: 'Tech Club',
            maxParticipants: 100,
            currentParticipants: 67,
            status: 'upcoming'
        },
        {
            id: 2,
            name: 'Cultural Fest',
            description: 'Celebrate diversity through arts and music',
            date: '2024-03-20',
            time: '05:00 PM',
            venue: 'Open Grounds',
            club: 'Cultural Club',
            maxParticipants: 500,
            currentParticipants: 234,
            status: 'upcoming'
        },
        {
            id: 3,
            name: 'AI Workshop',
            description: 'Hands-on machine learning workshop',
            date: '2024-03-10',
            time: '02:00 PM',
            venue: 'Lab 301',
            club: 'Tech Club',
            maxParticipants: 50,
            currentParticipants: 45,
            status: 'ongoing'
        }
    ];

    const sampleClubs = [
        { id: 1, name: 'Tech Club', members: 234, events: 12, icon: 'fa-laptop-code' },
        { id: 2, name: 'Cultural Club', members: 456, events: 18, icon: 'fa-music' },
        { id: 3, name: 'Sports Club', members: 189, events: 8, icon: 'fa-basketball-ball' },
        { id: 4, name: 'Photography Club', members: 123, events: 6, icon: 'fa-camera' }
    ];

    const sampleActivities = [
        {
            icon: 'fa-calendar-plus',
            iconClass: 'blue',
            title: 'New Event Created',
            description: 'Tech Hackathon 2024 has been created',
            time: '2 hours ago'
        },
        {
            icon: 'fa-user-plus',
            iconClass: 'green',
            title: 'New Participant',
            description: '24 new registrations for Cultural Fest',
            time: '5 hours ago'
        },
        {
            icon: 'fa-cube',
            iconClass: 'blue',
            title: 'Blockchain Record',
            description: 'Event data added to blockchain',
            time: '1 day ago'
        }
    ];

    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = item.getAttribute('data-page');

            // Update active nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Show target page
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(targetPage + 'Page').classList.add('active');
        });
    });

    // Render Events
    function renderEvents(events, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        events.forEach(event => {
            const eventCard = `
                <div class="event-card">
                    <div class="event-header">
                        <div class="event-date">
                            <i class="fas fa-calendar"></i> ${event.date}
                        </div>
                    </div>
                    <div class="event-body">
                        <h3 class="event-title">${event.name}</h3>
                        <p class="event-desc">${event.description}</p>
                        <div class="event-meta">
                            <div class="event-meta-item">
                                <i class="fas fa-clock"></i>
                                <span>${event.time}</span>
                            </div>
                            <div class="event-meta-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${event.venue}</span>
                            </div>
                            <div class="event-meta-item">
                                <i class="fas fa-users"></i>
                                <span>${event.club}</span>
                            </div>
                        </div>
                    </div>
                    <div class="event-footer">
                        <div class="participants">
                            <i class="fas fa-user-check"></i>
                            <span>${event.currentParticipants}/${event.maxParticipants}</span>
                        </div>
                        <span class="event-status ${event.status}">${event.status}</span>
                    </div>
                </div>
            `;
            container.innerHTML += eventCard;
        });
    }

    // Render Clubs
    function renderClubs() {
        const container = document.getElementById('clubsList');
        container.innerHTML = '';

        sampleClubs.forEach(club => {
            const clubCard = `
                <div class="club-card">
                    <div class="club-avatar">
                        <i class="fas ${club.icon}"></i>
                    </div>
                    <h3 class="club-name">${club.name}</h3>
                    <p class="club-members">${club.members} members</p>
                    <div class="club-stats">
                        <div class="club-stat">
                            <div class="club-stat-value">${club.events}</div>
                            <div class="club-stat-label">Events</div>
                        </div>
                        <div class="club-stat">
                            <div class="club-stat-value">${club.members}</div>
                            <div class="club-stat-label">Members</div>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += clubCard;
        });
    }

    // Render Activities
    function renderActivities() {
        const container = document.getElementById('activityList');
        container.innerHTML = '';

        sampleActivities.forEach(activity => {
            const activityItem = `
                <div class="activity-item">
                    <div class="activity-icon ${activity.iconClass}">
                        <i class="fas ${activity.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-desc">${activity.description}</div>
                    </div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            `;
            container.innerHTML += activityItem;
        });
    }

    // Render Blockchain
    function renderBlockchain() {
        const container = document.getElementById('blockchainContainer');
        const blockCountEl = document.getElementById('blockCount');
        
        container.innerHTML = '';
        blockCountEl.textContent = eventChain.chain.length;

        // Show last 10 blocks
        const blocksToShow = eventChain.chain.slice(-10).reverse();

        blocksToShow.forEach(block => {
            const blockElement = `
                <div class="blockchain-block">
                    <div class="block-header">
                        <div class="block-number">Block #${block.index}</div>
                        <div class="block-time">${new Date(block.timestamp).toLocaleString()}</div>
                    </div>
                    <div class="block-data">
                        <div class="block-data-item">
                            <span class="block-data-label">Type:</span>
                            <span>${block.data.type || 'N/A'}</span>
                        </div>
                        <div class="block-data-item">
                            <span class="block-data-label">Nonce:</span>
                            <span>${block.nonce}</span>
                        </div>
                    </div>
                    <div class="block-hash">
                        <strong>Hash:</strong> ${block.hash}
                    </div>
                    <div class="block-hash">
                        <strong>Previous:</strong> ${block.previousHash}
                    </div>
                </div>
            `;
            container.innerHTML += blockElement;
        });
    }

    // Initial render
    renderEvents(sampleEvents.slice(0, 2), 'upcomingEvents');
    renderEvents(sampleEvents, 'allEvents');
    renderClubs();
    renderActivities();
    renderBlockchain();

    // Create Event Modal
    const createEventBtn = document.getElementById('createEventBtn');
    const createEventModal = document.getElementById('createEventModal');
    const createEventForm = document.getElementById('createEventForm');
    const modalCloseButtons = document.querySelectorAll('.modal-close');

    createEventBtn.addEventListener('click', () => {
        createEventModal.classList.remove('hidden');
    });

    modalCloseButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            createEventModal.classList.add('hidden');
        });
    });

    // Close modal on outside click
    createEventModal.addEventListener('click', (e) => {
        if (e.target === createEventModal) {
            createEventModal.classList.add('hidden');
        }
    });

    // Handle Create Event Form
    createEventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(createEventForm);
        const eventData = {
            type: 'event_created',
            name: formData.get('eventName'),
            description: formData.get('description'),
            date: formData.get('date'),
            time: formData.get('time'),
            venue: formData.get('venue'),
            club: formData.get('club'),
            maxParticipants: formData.get('maxParticipants'),
            createdBy: userEmail,
            timestamp: new Date().toISOString()
        };

        showLoader();

        // Simulate API call
        setTimeout(() => {
            // Add to blockchain
            const block = eventChain.addBlock(eventData);
            
            hideLoader();
            showToast('Event created successfully and added to blockchain!');
            createEventModal.classList.add('hidden');
            createEventForm.reset();

            // Refresh blockchain view
            renderBlockchain();
        }, 1500);
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            // Add logout event to blockchain
            eventChain.addBlock({
                type: 'user_logout',
                email: userEmail,
                timestamp: new Date().toISOString()
            });

            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            window.location.href = 'index.html';
        }
    });
}
