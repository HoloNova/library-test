// 图书管理系统 - 管理员 Vue 3 版本

const ADMIN_API_BASE_URL = 'http://localhost:8080/api';

// Token管理
const AdminTokenManager = {
    getAccessToken() {
        return localStorage.getItem('adminAccessToken');
    },
    getRefreshToken() {
        return localStorage.getItem('adminRefreshToken');
    },
    setTokens(accessToken, refreshToken) {
        localStorage.setItem('adminAccessToken', accessToken);
        localStorage.setItem('adminRefreshToken', refreshToken);
    },
    clearTokens() {
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
    },
    setUser(user) {
        localStorage.setItem('adminCurrentUser', JSON.stringify(user));
    },
    getUser() {
        const userStr = localStorage.getItem('adminCurrentUser');
        return userStr ? JSON.parse(userStr) : null;
    },
    clearUser() {
        localStorage.removeItem('adminCurrentUser');
    }
};

// API服务
const adminApiService = {
    async request(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        const accessToken = AdminTokenManager.getAccessToken();
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        try {
            const response = await fetch(`${ADMIN_API_BASE_URL}${url}`, {
                ...options,
                headers,
                credentials: 'include'
            });

            if (response.status === 401) {
                const refreshResult = await this.refreshToken();
                if (refreshResult) {
                    headers['Authorization'] = `Bearer ${AdminTokenManager.getAccessToken()}`;
                    const retryResponse = await fetch(`${ADMIN_API_BASE_URL}${url}`, {
                        ...options,
                        headers,
                        credentials: 'include'
                    });
                    return retryResponse.json();
                } else {
                    AdminTokenManager.clearTokens();
                    AdminTokenManager.clearUser();
                    throw new Error('登录已过期，请重新登录');
                }
            }

            return response.json();
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    },

    async refreshToken() {
        try {
            const refreshToken = AdminTokenManager.getRefreshToken();
            if (!refreshToken) return false;

            const response = await fetch(`${ADMIN_API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });

            const data = await response.json();
            if (data.success) {
                AdminTokenManager.setTokens(data.data.accessToken, data.data.refreshToken);
                return true;
            }
            return false;
        } catch (error) {
            console.error('刷新token失败:', error);
            return false;
        }
    },

    async login(username, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        return response;
    },

    async logout() {
        const refreshToken = AdminTokenManager.getRefreshToken();
        if (refreshToken) {
            await this.request('/auth/logout', {
                method: 'POST',
                body: JSON.stringify({ refreshToken })
            });
        }
        AdminTokenManager.clearTokens();
        AdminTokenManager.clearUser();
    },

    async getStatistics() {
        return this.request('/admin/statistics');
    },

    async getAllUsers() {
        return this.request('/admin/users');
    },

    async getAllBooks() {
        return this.request('/admin/books');
    },

    async createBook(book) {
        return this.request('/admin/books', {
            method: 'POST',
            body: JSON.stringify(book)
        });
    },

    async updateBook(id, bookDetails) {
        return this.request(`/admin/books/${id}`, {
            method: 'PUT',
            body: JSON.stringify(bookDetails)
        });
    },

    async deleteBook(id) {
        return this.request(`/admin/books/${id}`, {
            method: 'DELETE'
        });
    },

    async toggleRecommend(id) {
        return this.request(`/admin/books/${id}/recommend`, {
            method: 'POST'
        });
    },

    async toggleActive(id) {
        return this.request(`/admin/books/${id}/active`, {
            method: 'POST'
        });
    }
};

const adminApp = Vue.createApp({
    data() {
        return {
            isLoggedIn: false,
            currentUser: null,
            currentTab: 'books',
            loading: false,
            
            loginForm: {
                username: 'root',
                password: '123'
            },
            
            books: [],
            users: [],
            statistics: {},
            
            searchText: '',
            borrowDays: 30,
            
            showAddModal: false,
            showEditModal: false,
            editingBook: null,
            
            newBook: {
                isbn: '',
                name: '',
                category: '',
                publisher: ''
            }
        };
    },
    
    computed: {
        filteredBooks() {
            let filtered = this.books;
            
            if (this.searchText) {
                const searchLower = this.searchText.toLowerCase();
                filtered = filtered.filter(b => 
                    b.name.toLowerCase().includes(searchLower) || 
                    b.isbn.includes(searchLower) ||
                    b.category.toLowerCase().includes(searchLower) ||
                    b.publisher.toLowerCase().includes(searchLower)
                );
            }
            
            return filtered;
        },
        
        userCount() {
            return this.users.length;
        },
        
        bookCount() {
            return this.books.filter(b => b.isActive !== false).length;
        }
    },
    
    methods: {
        async initData() {
            this.loading = true;
            try {
                const [booksResult, usersResult, statsResult] = await Promise.all([
                    adminApiService.getAllBooks(),
                    adminApiService.getAllUsers(),
                    adminApiService.getStatistics()
                ]);
                
                if (booksResult.success) {
                    this.books = booksResult.data;
                }
                if (usersResult.success) {
                    this.users = usersResult.data;
                }
                if (statsResult.success) {
                    this.statistics = statsResult.data;
                }
            } catch (error) {
                console.error('数据加载失败:', error);
                alert('数据加载失败，请刷新页面重试');
            } finally {
                this.loading = false;
            }
        },
        
        async login() {
            if (!this.loginForm.username || !this.loginForm.password) {
                alert('请填写完整信息');
                return;
            }
            
            this.loading = true;
            try {
                const result = await adminApiService.login(this.loginForm.username, this.loginForm.password);
                if (result.success) {
                    if (!result.data.user.isAdmin) {
                        alert('该账号不是管理员账号');
                        return;
                    }
                    AdminTokenManager.setTokens(result.data.accessToken, result.data.refreshToken);
                    AdminTokenManager.setUser(result.data.user);
                    this.currentUser = result.data.user;
                    this.isLoggedIn = true;
                    await this.initData();
                } else {
                    alert(result.message || '登录失败');
                }
            } catch (error) {
                console.error('登录失败:', error);
                alert('登录失败，请稍后重试');
            } finally {
                this.loading = false;
            }
        },
        
        async logout() {
            try {
                await adminApiService.logout();
            } catch (error) {
                console.error('退出登录失败:', error);
            }
            this.isLoggedIn = false;
            this.currentUser = null;
            this.books = [];
            this.users = [];
            this.statistics = {};
        },
        
        switchTab(tab) {
            this.currentTab = tab;
        },
        
        saveBorrowDays() {
            alert(`借阅期限已设置为 ${this.borrowDays} 天`);
        },
        
        showAddBookModal() {
            this.newBook = { isbn: '', name: '', category: '', publisher: '' };
            this.showAddModal = true;
        },
        
        hideAddBookModal() {
            this.showAddModal = false;
        },
        
        async addBook() {
            if (!this.newBook.isbn || !this.newBook.name) {
                alert('请填写ISBN和书名');
                return;
            }
            
            this.loading = true;
            try {
                const result = await adminApiService.createBook({
                    ...this.newBook,
                    borrowCount: 0,
                    isRecommend: false,
                    isActive: true,
                    status: true
                });
                if (result.success) {
                    this.hideAddBookModal();
                    alert('图书入库成功');
                    await this.initData();
                } else {
                    alert(result.message || '图书入库失败');
                }
            } catch (error) {
                console.error('图书入库失败:', error);
                alert('图书入库失败，请稍后重试');
            } finally {
                this.loading = false;
            }
        },
        
        showEditBookModal(book) {
            this.editingBook = { ...book };
            this.showEditModal = true;
        },
        
        hideEditBookModal() {
            this.showEditModal = false;
            this.editingBook = null;
        },
        
        async saveEditBook() {
            if (!this.editingBook) return;
            
            this.loading = true;
            try {
                const result = await adminApiService.updateBook(this.editingBook.id, this.editingBook);
                if (result.success) {
                    this.hideEditBookModal();
                    alert('图书信息更新成功');
                    await this.initData();
                } else {
                    alert(result.message || '更新失败');
                }
            } catch (error) {
                console.error('更新失败:', error);
                alert('更新失败，请稍后重试');
            } finally {
                this.loading = false;
            }
        },
        
        async toggleRecommend(book) {
            this.loading = true;
            try {
                const result = await adminApiService.toggleRecommend(book.id);
                if (result.success) {
                    await this.initData();
                } else {
                    alert(result.message || '操作失败');
                }
            } catch (error) {
                console.error('操作失败:', error);
                alert('操作失败，请稍后重试');
            } finally {
                this.loading = false;
            }
        },
        
        async removeBook(book) {
            if (confirm(`确定要下架《${book.name}》吗？`)) {
                this.loading = true;
                try {
                    const result = await adminApiService.deleteBook(book.id);
                    if (result.success) {
                        alert(`《${book.name}》已下架`);
                        await this.initData();
                    } else {
                        alert(result.message || '下架失败');
                    }
                } catch (error) {
                    console.error('下架失败:', error);
                    alert('下架失败，请稍后重试');
                } finally {
                    this.loading = false;
                }
            }
        },
        
        checkSavedLogin() {
            const savedUser = AdminTokenManager.getUser();
            const savedAccessToken = AdminTokenManager.getAccessToken();
            if (savedUser && savedAccessToken) {
                this.currentUser = savedUser;
                this.isLoggedIn = true;
                this.initData();
            }
        }
    },

    mounted() {
        this.checkSavedLogin();
    }
});

adminApp.mount('#app');
