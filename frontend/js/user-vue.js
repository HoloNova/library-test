// 图书管理系统 - Vue 3 版本
const API_BASE_URL = 'http://localhost:8080/api';

// Token管理器
const TokenManager = {
    getAccessToken() {
        return localStorage.getItem('accessToken');
    },
    getRefreshToken() {
        return localStorage.getItem('refreshToken');
    },
    setTokens(accessToken, refreshToken) {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
    },
    clearTokens() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
    },
    saveUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    },
    getUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    }
};

// API服务
const apiService = {
    // 基础请求方法
    async request(url, options = {}) {
        const skipAuth = options.skipAuth === true;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };
        if (!skipAuth) {
            const token = TokenManager.getAccessToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const u = TokenManager.getUser();
            if (u && u.id != null) {
                headers['X-User-Id'] = String(u.id);
            }
        }

        try {
            const response = await axios({
                url: API_BASE_URL + url,
                method: options.method || 'GET',
                data: options.body ?? null,
                headers
            });
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    return this.request(url, options);
                }
                TokenManager.clearTokens();
                //防止重复刷新逻辑
                if (!window.__libraryAuthRedirecting) {
                    window.__libraryAuthRedirecting = true;
                    window.location.reload();
                }
                return null;
            }
            throw error;
        }
    },

    // 刷新Token
    async refreshToken() {
        const refreshToken = TokenManager.getRefreshToken();
        if (!refreshToken) return false;

        try {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken: refreshToken
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.data && response.data.success) {
                TokenManager.setTokens(response.data.data.accessToken, response.data.data.refreshToken);
                return true;
            }
        } catch (error) {
            console.error('刷新Token失败:', error);
        }
        return false;
    },

    // 用户操作
    async register(username, password) {
        return this.request('/auth/register', {
            method: 'POST',
            body: { username, password },
            skipAuth: true
        });
    },

    async login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: { username, password },
            skipAuth: true
        });
    },

    async logoff(userId) {
        return this.request(`/auth/logoff/${userId}`, {
            method: 'POST'
        });
    },

    // 图书数据
    async getBooks() {
        return this.request('/books', { skipAuth: true });
    },

    async getRecommendBooks() {
        return this.request('/books/recommend', { skipAuth: true });
    },

    async getHotBooks() {
        return this.request('/books/hot', { skipAuth: true });
    },

    // 借阅操作
    async borrowBook(bookId) {
        return this.request(`/books/${bookId}/borrow`, {
            method: 'POST'
        });
    },

    async returnBook(recordId) {
        return this.request(`/books/records/${recordId}/return`, {
            method: 'POST'
        });
    },

    async renewBook(recordId) {
        return this.request(`/books/records/${recordId}/renew`, {
            method: 'POST'
        });
    },

    // 用户数据
    async getBorrowHistory() {
        const u = TokenManager.getUser();
        if (!u || u.id == null) {
            return { success: false, message: '未登录', data: [] };
        }
        return this.request(`/books/user/${u.id}/history`);
    },

    async getCurrentBorrows() {
        const u = TokenManager.getUser();
        if (!u || u.id == null) {
            return { success: false, message: '未登录', data: [] };
        }
        return this.request(`/books/user/${u.id}/current`);
    },

    async getOverdue() {
        const u = TokenManager.getUser();
        if (!u || u.id == null) {
            return { success: false, message: '未登录', data: [] };
        }
        return this.request(`/books/user/${u.id}/overdue`);
    }
};

// Vue 应用
const app = Vue.createApp({
    data() {
        return {
            // 登录表单
            loginForm: {
                username: '',
                password: ''
            },

            // 注册表单
            registerForm: {
                username: '',
                password: '',
                confirmPassword: ''
            },

            // 状态管理
            isLoginView: true, // true: 登录界面, false: 注册界面
            isLoggedIn: false,
            currentUser: null,//ToknenManager.getUser()获取完整信息
            currentTab: 'search',
            currentCategory: 'all',
            searchText: '',
            loading: false,// 数据加载状态

            // 分页设置
            pageNum: 1,
            pageSize: 8,
            inputPageNum: 1,

            // 图书数据
            books: [],
            recommendBooks: [],
            hotBooks: [],

            // 用户相关数据
            borrowHistory: [],
            currentBorrows: [],
            overdue: [],
            reservedBooks: []
        };
    },

    computed: {
        filteredBooks() {
            let filtered = [...this.books];
            if (this.currentCategory !== 'all') {
                filtered = filtered.filter(b => b.category === this.currentCategory);
            }
            if (this.searchText) {
                const searchLower = this.searchText.toLowerCase();
                filtered = filtered.filter(b =>
                    b.name.toLowerCase().includes(searchLower) ||
                    b.isbn.includes(searchLower) ||
                    b.publisher.toLowerCase().includes(searchLower)
                );
            }
            return filtered;
        },

        totalPage() {
            const n = this.filteredBooks.length;
            if (n === 0) {
                return 1;
            }
            return Math.ceil(n / this.pageSize);
        },

        paginatedBooks() {
            const list = this.filteredBooks;
            let page = this.pageNum;
            const tp = this.totalPage;
            if (page > tp) page = tp;
            if (page < 1) page = 1;
            const start = (page - 1) * this.pageSize;
            return list.slice(start, start + this.pageSize);
        },

        hasOverdue() {
            return this.currentBorrows.some(item => new Date(item.dueDate) < new Date());
        }
    },

    watch: {
        totalPage(tp) {
            if (this.pageNum > tp) {
                this.pageNum = tp;
            }
            if (this.pageNum < 1) {
                this.pageNum = 1;
            }
        }
    },

    mounted() {
        // 检查是否已登录
        const user = TokenManager.getUser();
        const token = TokenManager.getAccessToken();
        if (user && token) {
            this.currentUser = user;
            this.isLoggedIn = true;
        }
        // 无论是否登录都获取图书数据
        this.initData();
    },

    methods: {
        // 初始化数据
        async initData() {
            this.loading = true;
            try {
                const [booksRes, recommendsRes, hotBooksRes, borrowsRes, historyRes, overdueRes] = await Promise.allSettled([
                    apiService.getBooks(),
                    apiService.getRecommendBooks(),
                    apiService.getHotBooks(),
                    apiService.getCurrentBorrows(),
                    apiService.getBorrowHistory(),
                    apiService.getOverdue()
                ]);

                if (booksRes.status === 'fulfilled' && booksRes.value.success) this.books = booksRes.value.data || [];
                if (recommendsRes.status === 'fulfilled' && recommendsRes.value.success) this.recommendBooks = recommendsRes.value.data || [];
                if (hotBooksRes.status === 'fulfilled' && hotBooksRes.value.success) this.hotBooks = hotBooksRes.value.data || [];
                if (borrowsRes.status === 'fulfilled' && borrowsRes.value.success) this.currentBorrows = borrowsRes.value.data || [];
                if (historyRes.status === 'fulfilled' && historyRes.value.success) this.borrowHistory = historyRes.value.data || [];
                if (overdueRes.status === 'fulfilled' && overdueRes.value.success) this.overdue = overdueRes.value.data || [];

                console.log('数据加载完成:', {
                    books: this.books.length,
                    recommends: this.recommendBooks.length,
                    hotBooks: this.hotBooks.length,
                    borrows: this.currentBorrows.length
                });
            } catch (error) {
                console.error('数据加载失败:', error);
                alert('数据加载失败，请刷新页面重试');
            } finally {
                this.loading = false;
            }
        },

        // 登录
        async login() {
            if (!this.loginForm.username || !this.loginForm.password) {
                alert('请填写用户名和密码!');
                return;
            }
            
            try {
                const result = await apiService.login(this.loginForm.username, this.loginForm.password);
                if (result && result.success) {
                    TokenManager.setTokens(result.data.accessToken, result.data.refreshToken);
                    const user = {
                        id: result.data.userId,
                        username: result.data.username,
                        isAdmin: result.data.isAdmin
                    };
                    TokenManager.saveUser(user);
                    this.currentUser = user;
                    this.isLoggedIn = true;
                    alert('登录成功');
                    this.initData();
                }
            } catch (error) {
                alert(`登录失败: ${error.response?.data?.message || error.message || '请检查网络连接'}`);
            }
        },

        // 注册
        async register() {
            if (!this.registerForm.username || !this.registerForm.password || !this.registerForm.confirmPassword) {
                alert('请填写完整信息');
                return;
            }

            if (this.registerForm.password !== this.registerForm.confirmPassword) {
                alert('两次输入的密码不一致');
                return;
            }

            try {
                const result = await apiService.register(this.registerForm.username, this.registerForm.password);
                if (result.success) {
                    alert('注册成功，请登录');
                    this.isLoginView = true;
                    this.registerForm = { username: '', password: '', confirmPassword: '' };
                } else {
                    alert(result.message || '注册失败');
                }
            } catch (error) {
                console.error('注册失败:', error);
                alert(`注册失败: ${error.response?.data?.message || error.message || '请检查网络连接'}`);
            }
        },

        // 退出
        logout() {
            TokenManager.clearTokens();
            this.isLoggedIn = false;
            this.currentUser = null;
            this.pageNum = 1;
            this.inputPageNum = 1;
            this.books = [];
            this.recommendBooks = [];
            this.hotBooks = [];
            this.loginForm = { username: '', password: '' };
            this.borrowHistory = [];
            this.currentBorrows = [];
            this.overdue = [];
        },

        async logoff() {
            if (confirm('确定要注销账号吗？此操作不可恢复！')) {
                try {
                    const result = await apiService.logoff(this.currentUser.id);
                    TokenManager.clearTokens();
                    this.isLoggedIn = false;
                    this.currentUser = null;
                    this.loginForm = { username: '', password: '' };
                    this.borrowHistory = [];
                    this.currentBorrows = [];
                    this.overdue = [];
                    alert('账号注销成功');
                } catch (error) {
                    console.error('注销失败:', error);
                    alert(`账号注销失败: ${error.response?.data?.message || error.message || '请检查网络连接'}`);
                }
            }
        },

        // 切换标签页
        switchTab(tab) {
            this.currentTab = tab;
            if (tab === 'borrow') {
                this.refreshBorrows();
            }
        },

        // 刷新借阅数据
        async refreshBorrows() {
            try {
                const [booksRes,borrowsRes, historyRes] = await Promise.all([
                    apiService.getBooks(),
                    apiService.getCurrentBorrows(),
                    apiService.getBorrowHistory()
                ]);
                if (booksRes.success) this.books = booksRes.data || [];
                if (borrowsRes.success) this.currentBorrows = borrowsRes.data || [];
                if (historyRes.success) this.borrowHistory = historyRes.data || [];
            } catch (error) {
                console.error('刷新借阅数据失败:', error);
            }
        },

        // 按类别过滤
        filterByCategory(category) {
            this.currentCategory = category;
            this.pageNum = 1;
        },

        // 分页逻辑
        prevPage() {
            if (this.pageNum > 1) {
                this.pageNum--;
            }
        },

        nextPage() {
            if (this.pageNum < this.totalPage) {
                this.pageNum++;
            }
        },

        toPage() {
            if (this.inputPageNum >= 1 && this.inputPageNum <= this.totalPage) {
                this.pageNum = this.inputPageNum;
            } else {
                alert('请输入有效的页码');
            }
        },

        resetPage() {
            this.pageNum = 1;
        },

        // 借阅图书
        async borrowBook(bookId) {
            const book = this.books.find(b => b.id === bookId);
            if (!book) return;

            if (!book.status) {
                alert('此书当前不可借');
                return;
            }

            try {
                const result = await apiService.borrowBook(bookId);
                if (result.success) {
                    alert(`成功借阅《${book.name}》`);
                    book.borrowCount++;
                    book.status = false;
                    this.refreshBorrows();
                } else {
                    alert(result.message || '借阅失败');
                }
            } catch (error) {
                console.error('借阅失败:', error);
                alert('借阅失败，请重试');
            }
        },

        // 归还图书
        async returnBook(recordId) {
            const item = this.currentBorrows.find(b => b.recordId === recordId);
            if (!item) return;

            try {
                const result = await apiService.returnBook(recordId);
                if (result.success) {
                    alert(`成功归还《${item.bookName}》`);
                    const book = this.books.find(b => b.id === item.bookId);
                    if (book) {
                        book.status = true;
                    }
                    this.refreshBorrows();
                } else {
                    alert(result.message || '归还失败');
                }
            } catch (error) {
                console.error('归还失败:', error);
                alert('归还失败，请重试');
            }
        },

        // 续期
        async renewBook(recordId) {
            const item = this.currentBorrows.find(b => b.recordId === recordId);
            if (!item) return;

            try {
                const result = await apiService.renewBook(recordId);
                if (result.success) {
                    alert(`成功续期《${item.bookName}》30天`);
                    this.refreshBorrows();
                } else {
                    alert(result.message || '续期失败');
                }
            } catch (error) {
                console.error('续期失败:', error);
                alert('续期失败，请重试');
            }
        },

        // 预约图书
        reserveBook(bookId) {
            const book = this.books.find(b => b.id === bookId);
            if (!book) return;

            if (this.reservedBooks.includes(bookId)) {
                alert('您已预约此书');
                return;
            }

            if (this.currentBorrows.find(b => b.bookId === bookId)) {
                alert('您已借阅此书，无需预约');
                return;
            }

            this.reservedBooks.push(bookId);
            alert(`成功预约《${book.name}》`);
        },

        // 取消预约
        cancelReservation(bookId) {
            if (!this.reservedBooks.includes(bookId)) {
                alert('您未预约此书');
                return;
            }

            this.reservedBooks = this.reservedBooks.filter(id => id !== bookId);
            const book = this.books.find(b => b.id === bookId);
            alert(`成功取消预约《${book.name}》`);
        },

        // 格式化日期
        formatDate(date) {
            if (!date) return '-';
            const d = new Date(date);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        },

        // 计算剩余天数
        getDaysLeft(dueDate) {
            if (!dueDate) return 0;
            const daysLeft = Math.ceil((new Date(dueDate) - Date.now()) / (24 * 60 * 60 * 1000));
            return daysLeft;
        },

        // 检查是否逾期
        isOverdue(dueDate) {
            if (!dueDate) return false;
            return new Date(dueDate) < new Date();
        }
    }
});

// 挂载应用
app.mount('#app');
