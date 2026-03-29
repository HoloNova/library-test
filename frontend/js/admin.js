let currentUser = null;
let loading = false;
let borrowDays = 30;

let mockBooks = [];
let mockUsers = [];
let overdueList = [];

function initData() {
    if (typeof DATA !== 'undefined') {
        mockBooks = DATA.books || [];
        mockUsers = DATA.users || [];
        overdueList = DATA.overdue || [];
    } else {
        mockBooks = [
            { id: 1, isbn: '9787111111111', name: '活着', category: '文学', publisher: '作家出版社', borrowCount: 156, isRecommend: true, isActive: true, status: true },
            { id: 2, isbn: '9787111222222', name: '三体', category: '科技', publisher: '重庆出版社', borrowCount: 289, isRecommend: true, isActive: true, status: true },
            { id: 3, isbn: '9787111333333', name: '人类简史', category: '历史', publisher: '中信出版社', borrowCount: 178, isRecommend: true, isActive: true, status: true },
            { id: 4, isbn: '9787111444444', name: '艺术的故事', category: '艺术', publisher: '广西美术出版社', borrowCount: 89, isRecommend: true, isActive: true, status: true },
            { id: 5, isbn: '9787111555555', name: '围城', category: '文学', publisher: '人民文学出版社', borrowCount: 123, isRecommend: false, isActive: true, status: false },
            { id: 6, isbn: '9787111666666', name: '代码大全', category: '科技', publisher: '电子工业出版社', borrowCount: 210, isRecommend: false, isActive: true, status: true },
            { id: 7, isbn: '9787111777777', name: '明朝那些事儿', category: '历史', publisher: '浙江人民出版社', borrowCount: 345, isRecommend: false, isActive: true, status: true },
            { id: 8, isbn: '9787111888888', name: '苏菲的世界', category: '哲学', publisher: '作家出版社', borrowCount: 167, isRecommend: false, isActive: true, status: true }
        ];
        mockUsers = [
            { id: 1, name: '张三', studyID: '2021001', overdueCnt: 0 },
            { id: 2, name: '李四', studyID: '2021002', overdueCnt: 1 },
            { id: 3, name: '王五', studyID: '2021003', overdueCnt: 0 },
            { id: 4, name: '赵六', studyID: '2021004', overdueCnt: 0 },
            { id: 5, name: '钱七', studyID: '2021005', overdueCnt: 2 }
        ];
        overdueList = [
            { userId: 2, studyID: '2021002', name: '李四', bookId: 5, bookName: '围城', overdueDays: 10 },
            { userId: 5, studyID: '2021005', name: '钱七', bookId: 1, bookName: '活着', overdueDays: 5 },
            { userId: 5, studyID: '2021005', name: '钱七', bookId: 3, bookName: '人类简史', overdueDays: 3 }
        ];
    }
}

function adminLogin() {
    if (loading) return;
    loading = true;
    
    try {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        
        if (!username || !password) {
            alert('请填写完整信息');
            return;
        }
        
        if (username === 'root' && password === '123') {
            currentUser = {
                id: 1,
                name: '管理员',
                isAdmin: true
            };
            
            document.getElementById('loginPage').classList.add('hidden');
            document.getElementById('mainPage').classList.remove('hidden');
            
            initData();
            renderAdminBookList();
            renderStats();
        } else {
            alert('用户名或密码错误');
        }
    } finally {
        loading = false;
    }
}

function adminLogout() {
    currentUser = null;
    document.getElementById('mainPage').classList.add('hidden');
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

function renderAdminBookList() {
    const tbody = document.getElementById('adminBookList');
    
    tbody.innerHTML = mockBooks.map(book => `
        <tr>
            <td>${book.name}</td>
            <td>${book.isbn}</td>
            <td>${book.category}</td>
            <td>${book.publisher}</td>
            <td>${book.borrowCount}</td>
            <td><span class="book-status ${book.status ? 'status-available' : 'status-unavailable'}">${book.status ? '可借' : '不可借'}</span></td>
            <td>
                <button class="btn btn-small" onclick="editBook(${book.id})">编辑</button>
                <button class="btn btn-small ${book.isRecommend ? 'btn-success' : ''}" onclick="toggleRecommend(${book.id})">
                    ${book.isRecommend ? '取消推荐' : '推荐'}
                </button>
                <button class="btn btn-danger btn-small" onclick="toggleActive(${book.id})">
                    ${book.isActive ? '下架' : '上架'}
                </button>
            </td>
        </tr>
    `).join('');
}

function renderStats() {
    document.getElementById('userCount').textContent = mockUsers.length;
    document.getElementById('bookCount').textContent = mockBooks.filter(b => b.isActive).length;
    
    const tbody = document.getElementById('overdueList');
    tbody.innerHTML = overdueList.map(item => `
        <tr>
            <td>${item.studyID}</td>
            <td>${item.name}</td>
            <td>${item.bookName}</td>
            <td class="text-red">${item.overdueDays} 天</td>
        </tr>
    `).join('');
}

function showAddBookModal() {
    document.getElementById('addBookModal').classList.remove('hidden');
}

function hideAddBookModal() {
    document.getElementById('addBookModal').classList.add('hidden');
    document.getElementById('newISBN').value = '';
    document.getElementById('newBookName').value = '';
    document.getElementById('newCategory').value = '';
    document.getElementById('newPublisher').value = '';
}

function addBook() {
    if (loading) return;
    loading = true;
    
    try {
        const isbn = document.getElementById('newISBN').value.trim();
        const name = document.getElementById('newBookName').value.trim();
        const category = document.getElementById('newCategory').value.trim();
        const publisher = document.getElementById('newPublisher').value.trim();
        
        if (!isbn || !name || !category || !publisher) {
            alert('请填写完整信息');
            return;
        }
        
        if (mockBooks.some(book => book.isbn === isbn)) {
            alert('ISBN已存在');
            return;
        }
        
        const newBook = {
            id: mockBooks.length + 1,
            isbn,
            name,
            category,
            publisher,
            borrowCount: 0,
            isRecommend: false,
            isActive: true,
            status: true
        };
        
        mockBooks.push(newBook);
        alert('添加成功');
        hideAddBookModal();
        renderAdminBookList();
        renderStats();
    } finally {
        loading = false;
    }
}

function showEditBookModal(bookId) {
    if (loading) return;
    const book = mockBooks.find(b => b.id === bookId);
    if (!book) return;
    
    document.getElementById('editBookId').value = book.id;
    document.getElementById('editISBN').value = book.isbn;
    document.getElementById('editBookName').value = book.name;
    document.getElementById('editCategory').value = book.category;
    document.getElementById('editPublisher').value = book.publisher;
    document.getElementById('editBookModal').classList.remove('hidden');
}

function hideEditBookModal() {
    document.getElementById('editBookModal').classList.add('hidden');
}

function saveEditBook() {
    if (loading) return;
    loading = true;
    
    try {
        const bookId = parseInt(document.getElementById('editBookId').value);
        const isbn = document.getElementById('editISBN').value.trim();
        const name = document.getElementById('editBookName').value.trim();
        const category = document.getElementById('editCategory').value.trim();
        const publisher = document.getElementById('editPublisher').value.trim();
        
        if (!isbn || !name || !category || !publisher) {
            alert('请填写完整信息');
            return;
        }
        
        const book = mockBooks.find(b => b.id === bookId);
        if (!book) return;
        
        book.isbn = isbn;
        book.name = name;
        book.category = category;
        book.publisher = publisher;
        
        alert('修改成功');
        hideEditBookModal();
        renderAdminBookList();
    } finally {
        loading = false;
    }
}

function editBook(bookId) {
    showEditBookModal(bookId);
}

function toggleRecommend(bookId) {
    if (loading) return;
    loading = true;
    
    try {
        const book = mockBooks.find(b => b.id === bookId);
        if (book) {
            book.isRecommend = !book.isRecommend;
            renderAdminBookList();
        }
    } finally {
        loading = false;
    }
}

function toggleActive(bookId) {
    if (loading) return;
    loading = true;
    
    try {
        const book = mockBooks.find(b => b.id === bookId);
        if (book) {
            book.isActive = !book.isActive;
            book.status = book.isActive;
            renderAdminBookList();
            renderStats();
        }
    } finally {
        loading = false;
    }
}

function adminSearchBook() {
    if (loading) return;
    loading = true;
    
    try {
        const keyword = document.getElementById('adminSearchInput').value.toLowerCase();
        let books = mockBooks;
        
        if (keyword) {
            books = books.filter(b => 
                b.name.toLowerCase().includes(keyword) || 
                b.isbn.includes(keyword) || 
                b.publisher.toLowerCase().includes(keyword)
            );
        }
        
        const tbody = document.getElementById('adminBookList');
        tbody.innerHTML = books.map(book => `
            <tr>
                <td>${book.name}</td>
                <td>${book.isbn}</td>
                <td>${book.category}</td>
                <td>${book.publisher}</td>
                <td>${book.borrowCount}</td>
                <td><span class="book-status ${book.status ? 'status-available' : 'status-unavailable'}">${book.status ? '可借' : '不可借'}</span></td>
                <td>
                    <button class="btn btn-small" onclick="editBook(${book.id})">编辑</button>
                    <button class="btn btn-small ${book.isRecommend ? 'btn-success' : ''}" onclick="toggleRecommend(${book.id})">
                        ${book.isRecommend ? '取消推荐' : '推荐'}
                    </button>
                    <button class="btn btn-danger btn-small" onclick="toggleActive(${book.id})">
                        ${book.isActive ? '下架' : '上架'}
                    </button>
                </td>
            </tr>
        `).join('');
    } finally {
        loading = false;
    }
}

function saveBorrowDays() {
    const days = parseInt(document.getElementById('borrowDays').value);
    if (days > 0) {
        borrowDays = days;
        alert(`借阅期限已设置为 ${days} 天`);
    } else {
        alert('请输入有效的天数');
    }
}

function switchTab(tab) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.target.classList.add('active');
    
    if (tab === 'books') {
        document.getElementById('booksTab').classList.remove('hidden');
        document.getElementById('statsTab').classList.add('hidden');
    } else {
        document.getElementById('booksTab').classList.add('hidden');
        document.getElementById('statsTab').classList.remove('hidden');
        renderStats();
    }
}
