class HAGDBot {
    constructor() {
        this.user = null;
        this.token = null;
        this.isAdmin = false;
        this.init();
    }

    async init() {
        // Initialize Telegram Web App
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();
        }

        // Get user ID from URL or Telegram
        const urlParams = new URLSearchParams(window.location.search);
        const telegramId = urlParams.get('user') || 
                          (window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString());

        if (telegramId) {
            await this.login(telegramId);
        }

        this.setupEventListeners();
        this.startCooldownTimers();
    }

    async login(telegramId) {
        try {
            this.showLoading(true);
            
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ telegramId })
            });

            const data = await response.json();
            
            if (data.success) {
                this.token = data.token;
                this.user = data.user;
                this.updateUI();
                this.loadUserData();
            } else {
                this.showToast('Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Connection error', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    setupEventListeners() {
        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                this.switchTab(targetTab);
            });
        });

        // Earn section buttons
        document.getElementById('watch-ad-btn').addEventListener('click', () => {
            this.watchAd();
        });

        document.getElementById('bonus-btn').addEventListener('click', () => {
            this.claimBonus();
        });

        // Withdrawal form
        document.getElementById('withdrawal-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.requestWithdrawal();
        });

        // Copy referral link
        document.getElementById('copy-link-btn').addEventListener('click', () => {
            this.copyReferralLink();
        });

        // Admin panel
        document.getElementById('admin-panel-btn').addEventListener('click', () => {
            this.showAdminModal();
        });

        document.getElementById('close-admin').addEventListener('click', () => {
            this.hideAdminModal();
        });

        document.getElementById('admin-login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.adminLogin();
        });

        // Admin tabs
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                this.switchAdminTab(targetTab);
            });
        });
    }

    switchTab(tabName) {
        // Update nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Update sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        const activeSection = document.getElementById(`${tabName}-section`);
        if (activeSection) {
            activeSection.classList.add('active');
        }

        // Load section-specific data
        if (tabName === 'wallet') {
            this.loadWithdrawalHistory();
        } else if (tabName === 'refer') {
            this.loadReferralStats();
        }
    }

    async watchAd() {
        const button = document.getElementById('watch-ad-btn');
        const cooldownSpan = document.getElementById('ad-cooldown');
        
        if (button.disabled) return;

        try {
            // Show interstitial ad
            if (typeof show_9613656 === 'function') {
                await show_9613656();
                this.showToast('You have seen an ad!', 'success');
            }

            // Process reward
            const response = await fetch('/api/user/watch-ad', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                this.user.hagdBalance = data.newBalance;
                this.updateBalance();
                this.showToast(`+${data.reward} HAGD earned!`, 'success');
                this.startAdCooldown();
            } else {
                if (data.remainingTime) {
                    this.startAdCooldown(data.remainingTime);
                }
                this.showToast(data.error, 'error');
            }
        } catch (error) {
            console.error('Watch ad error:', error);
            this.showToast('Failed to process ad reward', 'error');
        }
    }

    async claimBonus() {
        const button = document.getElementById('bonus-btn');
        const cooldownSpan = document.getElementById('bonus-cooldown');
        
        if (button.disabled) return;

        try {
            // Show interstitial ad first
            if (typeof show_9613656 === 'function') {
                await show_9613656();
            }

            // Process bonus
            const response = await fetch('/api/user/claim-bonus', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                this.user.hagdBalance = data.newBalance;
                this.updateBalance();
                this.showToast(`+${data.reward} HAGD bonus claimed!`, 'success');
                this.startBonusCooldown();
            } else {
                if (data.remainingTime) {
                    this.startBonusCooldown(data.remainingTime);
                }
                this.showToast(data.error, 'error');
            }
        } catch (error) {
            console.error('Claim bonus error:', error);
            this.showToast('Failed to claim bonus', 'error');
        }
    }

    async requestWithdrawal() {
        const amountElement = document.getElementById('withdraw-amount');
        const binanceUidElement = document.getElementById('binance-uid');
        
        if (!amountElement || !binanceUidElement) {
            this.showToast('Form elements not found', 'error');
            return;
        }
        
        const amount = parseInt(amountElement.value);
        const binanceUid = binanceUidElement.value;

        if (!amount || !binanceUid) {
            this.showToast('Please fill all fields', 'error');
            return;
        }

        try {
            const response = await fetch('/api/user/withdraw', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount, binanceUid })
            });

            const data = await response.json();

            if (data.success) {
                this.user.hagdBalance = data.newBalance;
                this.updateBalance();
                this.showToast('Withdrawal request submitted!', 'success');
                document.getElementById('withdrawal-form').reset();
                this.loadWithdrawalHistory();
            } else {
                this.showToast(data.error, 'error');
            }
        } catch (error) {
            console.error('Withdrawal error:', error);
            this.showToast('Failed to submit withdrawal', 'error');
        }
    }

    async loadWithdrawalHistory() {
        try {
            const response = await fetch('/api/user/withdrawals', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const withdrawals = await response.json();
            this.displayWithdrawalHistory(withdrawals);
        } catch (error) {
            console.error('Load withdrawal history error:', error);
        }
    }

    displayWithdrawalHistory(withdrawals) {
        const container = document.getElementById('withdrawal-history');
        
        if (!container) {
            console.error('Withdrawal history container not found');
            return;
        }
        
        if (withdrawals.length === 0) {
            container.innerHTML = '<div class="no-history">No withdrawals yet</div>';
            return;
        }

        container.innerHTML = withdrawals.map(w => `
            <div class="history-item">
                <div class="history-info">
                    <div class="history-amount">${w.amount} HAGD</div>
                    <div class="history-date">${new Date(w.requestedAt).toLocaleDateString()}</div>
                </div>
                <div class="status ${w.status}">${w.status}</div>
            </div>
        `).join('');
    }

    async loadReferralStats() {
        try {
            const response = await fetch('/api/user/referrals', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            this.displayReferralStats(data);
        } catch (error) {
            console.error('Load referral stats error:', error);
        }
    }

    displayReferralStats(data) {
        const botUsername = 'hagd_earning_bot'; // Replace with actual bot username
        const referralLink = `https://t.me/${botUsername}?start=${data.referralCode}`;
        
        const referralLinkElement = document.getElementById('referral-link');
        if (referralLinkElement) {
            referralLinkElement.value = referralLink;
        }
        
        const totalReferralsElement = document.getElementById('total-referrals');
        if (totalReferralsElement) {
            totalReferralsElement.textContent = data.totalReferrals;
        }
        
        const referralEarningsElement = document.getElementById('referral-earnings');
        if (referralEarningsElement) {
            referralEarningsElement.textContent = data.totalReferralEarnings;
        }
    }

    async copyReferralLink() {
        const linkInput = document.getElementById('referral-link');
        try {
            await navigator.clipboard.writeText(linkInput.value);
            this.showToast('Referral link copied!', 'success');
        } catch (err) {
            // Fallback for older browsers
            linkInput.select();
            document.execCommand('copy');
            this.showToast('Referral link copied!', 'success');
        }
    }

    startAdCooldown(remainingTime = 30) {
        const button = document.getElementById('watch-ad-btn');
        const cooldownSpan = document.getElementById('ad-cooldown');
        const btnText = button.querySelector('.btn-text');
        
        button.disabled = true;
        cooldownSpan.classList.remove('hidden');
        btnText.classList.add('hidden');
        
        const updateCooldown = () => {
            if (remainingTime <= 0) {
                button.disabled = false;
                cooldownSpan.classList.add('hidden');
                btnText.classList.remove('hidden');
                return;
            }
            
            cooldownSpan.textContent = `Wait ${remainingTime}s`;
            remainingTime--;
            setTimeout(updateCooldown, 1000);
        };
        
        updateCooldown();
    }

    startBonusCooldown(remainingTime = 3600) {
        const button = document.getElementById('bonus-btn');
        const cooldownSpan = document.getElementById('bonus-cooldown');
        const btnText = button.querySelector('.btn-text');
        
        button.disabled = true;
        cooldownSpan.classList.remove('hidden');
        btnText.classList.add('hidden');
        
        const updateCooldown = () => {
            if (remainingTime <= 0) {
                button.disabled = false;
                cooldownSpan.classList.add('hidden');
                btnText.classList.remove('hidden');
                return;
            }
            
            const hours = Math.floor(remainingTime / 3600);
            const minutes = Math.floor((remainingTime % 3600) / 60);
            const seconds = remainingTime % 60;
            
            cooldownSpan.textContent = `Wait ${hours}h ${minutes}m ${seconds}s`;
            remainingTime--;
            setTimeout(updateCooldown, 1000);
        };
        
        updateCooldown();
    }

    startCooldownTimers() {
        if (!this.user) return;

        // Check ad cooldown
        if (this.user.lastAdWatch) {
            const timeSinceAd = Date.now() - new Date(this.user.lastAdWatch).getTime();
            const adCooldown = 30000; // 30 seconds
            
            if (timeSinceAd < adCooldown) {
                const remaining = Math.ceil((adCooldown - timeSinceAd) / 1000);
                this.startAdCooldown(remaining);
            }
        }

        // Check bonus cooldown
        if (this.user.lastBonusClaim) {
            const timeSinceBonus = Date.now() - new Date(this.user.lastBonusClaim).getTime();
            const bonusCooldown = 3600000; // 1 hour
            
            if (timeSinceBonus < bonusCooldown) {
                const remaining = Math.ceil((bonusCooldown - timeSinceBonus) / 1000);
                this.startBonusCooldown(remaining);
            }
        }
    }

    async loadUserData() {
        try {
            const response = await fetch('/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const userData = await response.json();
            this.user = { ...this.user, ...userData };
            this.updateUI();
            this.startCooldownTimers();
        } catch (error) {
            console.error('Load user data error:', error);
        }
    }

    updateUI() {
        if (this.user) {
            const hagdAmount = document.getElementById('hagd-amount');
            if (hagdAmount) {
                hagdAmount.textContent = this.user.hagdBalance;
            }
            
            // Show admin button only for specific user
            if (this.user.telegramId === '7773842800') {
                const adminBtn = document.getElementById('admin-btn');
                if (adminBtn) {
                    adminBtn.classList.remove('hidden');
                }
            }
        }
    }

    updateBalance() {
        const hagdAmount = this.user.hagdBalance || 0;
        const usdtAmount = (hagdAmount / 1000).toFixed(2);
        
        // Update header balance
        const hagdAmountElement = document.getElementById('hagd-amount');
        if (hagdAmountElement) {
            hagdAmountElement.textContent = hagdAmount;
        }
        
        const usdtAmountElement = document.getElementById('usdt-amount');
        if (usdtAmountElement) {
            usdtAmountElement.textContent = usdtAmount;
        }
        
        // Update wallet balance
        const walletHagd = document.getElementById('wallet-hagd');
        if (walletHagd) {
            walletHagd.textContent = hagdAmount;
        }
        
        const walletUsdt = document.getElementById('wallet-usdt');
        if (walletUsdt) {
            walletUsdt.textContent = usdtAmount;
        }
    }

    // Admin Panel Functions
    showAdminModal() {
        document.getElementById('admin-modal').classList.remove('hidden');
    }

    hideAdminModal() {
        document.getElementById('admin-modal').classList.add('hidden');
    }

    async adminLogin() {
        const password = document.getElementById('admin-password').value;
        
        try {
            const response = await fetch('/api/auth/admin-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.token;
                this.isAdmin = true;
                document.getElementById('admin-login').classList.add('hidden');
                document.getElementById('admin-dashboard').classList.remove('hidden');
                this.loadAdminData();
                this.showToast('Admin login successful', 'success');
            } else {
                this.showToast('Invalid admin password', 'error');
            }
        } catch (error) {
            console.error('Admin login error:', error);
            this.showToast('Admin login failed', 'error');
        }
    }

    switchAdminTab(tabName) {
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        document.querySelectorAll('.admin-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const activeContent = document.getElementById(`admin-${tabName}`);
        if (activeContent) {
            activeContent.classList.add('active');
        }

        if (tabName === 'withdrawals') {
            this.loadWithdrawalRequests();
        } else if (tabName === 'users') {
            this.loadUsers();
        } else if (tabName === 'stats') {
            this.loadStats();
        }
    }

    async loadAdminData() {
        this.loadWithdrawalRequests();
    }

    async loadWithdrawalRequests() {
        try {
            const response = await fetch('/api/admin/withdrawals', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const withdrawals = await response.json();
            this.displayWithdrawalRequests(withdrawals);
        } catch (error) {
            console.error('Load withdrawal requests error:', error);
        }
    }

    displayWithdrawalRequests(withdrawals) {
        const container = document.getElementById('withdrawal-requests');
        
        if (withdrawals.length === 0) {
            container.innerHTML = '<div class="no-requests">No withdrawal requests</div>';
            return;
        }

        container.innerHTML = withdrawals.map(w => `
            <div class="request-item">
                <div class="request-info">
                    <strong>@${w.username}</strong> - ${w.amount} HAGD
                    <br>
                    <small>Binance UID: ${w.binanceUid}</small>
                    <br>
                    <small>Requested: ${new Date(w.requestedAt).toLocaleString()}</small>
                </div>
                <div class="request-actions">
                    <button onclick="hagdBot.updateWithdrawalStatus('${w._id}', 'completed')" class="approve-btn">Approve</button>
                    <button onclick="hagdBot.updateWithdrawalStatus('${w._id}', 'rejected')" class="reject-btn">Reject</button>
                </div>
            </div>
        `).join('');
    }

    async updateWithdrawalStatus(withdrawalId, status) {
        try {
            const response = await fetch(`/api/admin/withdrawals/${withdrawalId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            const data = await response.json();

            if (data.success) {
                this.showToast(`Withdrawal ${status}`, 'success');
                this.loadWithdrawalRequests();
            } else {
                this.showToast('Failed to update withdrawal', 'error');
            }
        } catch (error) {
            console.error('Update withdrawal status error:', error);
            this.showToast('Failed to update withdrawal', 'error');
        }
    }

    // Utility Functions
    showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize the app
const hagdBot = new HAGDBot();

// Make it globally accessible for admin functions
window.hagdBot = hagdBot;
