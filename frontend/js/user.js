// 图书数据 - 直接定义在文件中
const BOOKS_DATA = [
    { id: 1, isbn: '9787111111111', name: '活着', category: '文学', publisher: '作家出版社', borrowCount: 156, isRecommend: true, isActive: true, status: true },
    { id: 2, isbn: '9787111222222', name: '三体', category: '科技', publisher: '重庆出版社', borrowCount: 289, isRecommend: true, isActive: true, status: true },
    { id: 3, isbn: '9787111333333', name: '人类简史', category: '历史', publisher: '中信出版社', borrowCount: 178, isRecommend: true, isActive: true, status: true },
    { id: 4, isbn: '9787111444444', name: '艺术的故事', category: '艺术', publisher: '广西美术出版社', borrowCount: 89, isRecommend: true, isActive: true, status: true },
    { id: 5, isbn: '9787111555555', name: '围城', category: '文学', publisher: '人民文学出版社', borrowCount: 123, isRecommend: false, isActive: true, status: false },
    { id: 6, isbn: '9787111666666', name: '代码大全', category: '科技', publisher: '电子工业出版社', borrowCount: 210, isRecommend: false, isActive: true, status: true },
    { id: 7, isbn: '9787111777777', name: '明朝那些事儿', category: '历史', publisher: '浙江人民出版社', borrowCount: 345, isRecommend: false, isActive: true, status: true },
    { id: 8, isbn: '9787111888888', name: '苏菲的世界', category: '哲学', publisher: '作家出版社', borrowCount: 167, isRecommend: false, isActive: true, status: true },
    { id: 9, isbn: '9787111999999', name: '红楼梦', category: '文学', publisher: '人民文学出版社', borrowCount: 423, isRecommend: false, isActive: true, status: true },
    { id: 10, isbn: '9787111000000', name: '设计心理学', category: '艺术', publisher: '中信出版社', borrowCount: 98, isRecommend: false, isActive: true, status: true },
    { id: 11, isbn: '9787111121212', name: '百年孤独', category: '文学', publisher: '南海出版公司', borrowCount: 189, isRecommend: false, isActive: true, status: true },
    { id: 12, isbn: '9787111232323', name: '算法导论', category: '科技', publisher: '机械工业出版社', borrowCount: 156, isRecommend: false, isActive: true, status: true }
];

let currentUser = null;
let currentCategory = 'all';
let loading = false;
let mockBooks = [];

let currentBorrows = [
    { id: 1, bookId: 1, bookName: '活着', publisher: '作家出版社', borrowDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
    { id: 2, bookId: 5, bookName: '围城', publisher: '人民文学出版社', borrowDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }
];

let borrowHistory = [
    { bookId: 2, bookName: '三体', publisher: '重庆出版社', borrowDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), returnDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    { bookId: 3, bookName: '人类简史', publisher: '中信出版社', borrowDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), returnDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }
];

let reservedBooks = [];

function initData() {
    console.log('初始化数据...');
    // 直接复制数据到mockBooks
    mockBooks = JSON.parse(JSON.stringify(BOOKS_DATA));
    console.log('数据初始化完成，共', mockBooks.length, '本书');
}

function userLogin() {
    if (loading) return;
    loading = true;
    
    try {
        const studyID = document.getElementById('loginStudyID').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        
        if (!studyID || !password) {
            alert('请填写完整信息');
            return;
        }
        
        if (studyID === '123' && password === '123') {
            currentUser = {
                id: 1,
                name: '测试用户',
                studyID: studyID
            };
            
            document.getElementById('loginPage').classList.add('hidden');
            document.getElementById('mainPage').classList.remove('hidden');
            
            // 初始化数据并渲染
            initData();
            renderRecommendBooks();
            renderBookList();
            checkOverdue();
            
            // 添加搜索事件监听
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('input', debounce(renderBookList, 300));
            }
        } else {
            alert('学号或密码错误');
        }
    } finally {
        loading = false;
    }
}

function userLogout() {
    currentUser = null;
    mockBooks = [];
    document.getElementById('mainPage').classList.add('hidden');
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('loginStudyID').value = '';
    document.getElementById('loginPassword').value = '';
}

function renderRecommendBooks() {
    const container = document.getElementById('recommendBooks');
    if (!container) {
        console.log('recommendBooks容器不存在');
        return;
    }
    
    if (mockBooks.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">暂无推荐图书</div>';
        return;
    }
    
    const recommendBooks = mockBooks.filter(b => b.isRecommend);
    const hotBooks = [...mockBooks].sort((a, b) => b.borrowCount - a.borrowCount).slice(0, 4);
    const combined = [...new Map([...recommendBooks, ...hotBooks].map(b => [b.id, b])).values()];
    
    container.innerHTML = combined.map(book => `
        <div class="book-item">
            <div class="book-title">${book.name} <span class="book-status ${book.status ? 'status-available' : 'status-unavailable'}">${book.status ? '可借' : '不可借'}</span></div>
            <div class="book-info">${book.publisher} · 借阅 ${book.borrowCount} 次</div>
            <div class="book-actions">
                <button class="btn btn-primary btn-small" onclick="borrowBook(${book.id})" ${!book.status ? 'disabled' : ''}>借阅</button>
                <button class="btn btn-success btn-small" onclick="reserveBook(${book.id})" ${!book.status ? 'disabled' : ''}>预约</button>
            </div>
        </div>
    `).join('');
}

function renderBookList() {
    const container = document.getElementById('bookList');
    if (!container) {
        console.log('bookList容器不存在');
        return;
    }
    
    console.log('渲染图书列表，当前数据量:', mockBooks.length);
    
    if (mockBooks.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">暂无图书数据</div>';
        return;
    }
    
    const searchInput = document.getElementById('searchInput');
    const searchText = searchInput ? searchInput.value.toLowerCase() : '';
    
    let books = [...mockBooks];
    
    if (currentCategory !== 'all') {
        books = books.filter(b => b.category === currentCategory);
    }
    
    if (searchText) {
        books = books.filter(b => 
            b.name.toLowerCase().includes(searchText) || 
            b.isbn.includes(searchText) || 
            b.publisher.toLowerCase().includes(searchText)
        );
        const recommendSection = document.getElementById('recommendSection');
        if (recommendSection) {
            recommendSection.classList.add('hidden');
        }
    } else {
        const recommendSection = document.getElementById('recommendSection');
        if (recommendSection) {
            recommendSection.classList.remove('hidden');
        }
    }
    
    if (books.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">未找到匹配的图书</div>';
        return;
    }
    
    container.innerHTML = books.map(book => `
        <div class="book-item">
            <div class="book-title">${book.name} <span class="book-status ${book.status ? 'status-available' : 'status-unavailable'}">${book.status ? '可借' : '不可借'}</span></div>
            <div class="book-info">${book.publisher} · 借阅 ${book.borrowCount} 次</div>
            <div class="book-actions">
                <button class="btn btn-primary btn-small" onclick="borrowBook(${book.id})" ${!book.status ? 'disabled' : ''}>借阅</button>
                <button class="btn btn-success btn-small" onclick="reserveBook(${book.id})" ${!book.status ? 'disabled' : ''}>预约</button>
            </div>
        </div>
    `).join('');
    
    console.log('图书列表渲染完成，显示', books.length, '本书');
}

function borrowBook(bookId) {
    if (loading) return;
    loading = true;
    
    try {
        const book = mockBooks.find(b => b.id === bookId);
        if (!book) return;
        
        if (currentBorrows.find(b => b.bookId === bookId)) {
            alert('您已借阅此书');
            return;
        }
        
        if (!book.status) {
            alert('此书当前不可借');
            return;
        }
        
        const borrowDate = new Date();
        const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        
        currentBorrows.push({
            id: currentBorrows.length + 1,
            bookId,
            bookName: book.name,
            publisher: book.publisher,
            borrowDate,
            dueDate
        });
        book.borrowCount++;
        book.status = false;
        
        if (reservedBooks.includes(bookId)) {
            reservedBooks = reservedBooks.filter(id => id !== bookId);
        }
        
        alert(`成功借阅《${book.name}》`);
        renderRecommendBooks();
        renderBookList();
        checkOverdue();
    } finally {
        loading = false;
    }
}

function checkOverdue() {
    const hasOverdue = currentBorrows.some(item => item.dueDate < new Date());
    const alertEl = document.getElementById('overdueAlert');
    
    if (alertEl) {
        if (hasOverdue) {
            alertEl.classList.remove('hidden');
        } else {
            alertEl.classList.add('hidden');
        }
    }
}

function renderCurrentBorrows() {
    const tbody = document.getElementById('currentBorrowsBody');
    if (!tbody) return;
    
    tbody.innerHTML = currentBorrows.map(item => {
        const dueDate = new Date(item.dueDate);
        const daysLeft = Math.ceil((dueDate - Date.now()) / (24 * 60 * 60 * 1000));
        const isOverdue = daysLeft < 0;
        
        return `
            <tr>
                <td>${item.bookName}</td>
                <td>${item.publisher}</td>
                <td>${formatDate(dueDate)}</td>
                <td class="${isOverdue ? 'text-red' : 'text-green'}">${isOverdue ? `逾期 ${Math.abs(daysLeft)} 天` : `${daysLeft} 天`}</td>
                <td>
                    <button class="btn btn-danger btn-small" onclick="returnBook(${item.id})">归还</button>
                    <button class="btn btn-success btn-small" onclick="renewBook(${item.id})">续期</button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderBorrowHistory() {
    const tbody = document.getElementById('historyBorrowsBody');
    if (!tbody) return;
    
    tbody.innerHTML = borrowHistory.map(item => `
        <tr>
            <td>${item.bookName}</td>
            <td>${item.publisher}</td>
            <td>${formatDate(item.borrowDate)}</td>
            <td>${formatDate(item.returnDate)}</td>
        </tr>
    `).join('');
}

function returnBook(recordId) {
    if (loading) return;
    loading = true;
    
    try {
        const index = currentBorrows.findIndex(b => b.id === recordId);
        if (index === -1) return;
        
        const item = currentBorrows[index];
        borrowHistory.unshift({
            bookId: item.bookId,
            bookName: item.bookName,
            publisher: item.publisher,
            borrowDate: item.borrowDate,
            returnDate: new Date()
        });
        
        currentBorrows.splice(index, 1);
        
        const book = mockBooks.find(b => b.id === item.bookId);
        if (book) {
            book.status = true;
        }
        
        alert(`成功归还《${item.bookName}》`);
        renderCurrentBorrows();
        renderRecommendBooks();
        renderBookList();
        checkOverdue();
    } finally {
        loading = false;
    }
}

function renewBook(recordId) {
    if (loading) return;
    loading = true;
    
    try {
        const item = currentBorrows.find(b => b.id === recordId);
        if (!item) return;
        
        item.dueDate = new Date(item.dueDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        alert(`成功续期《${item.bookName}》30天`);
        renderCurrentBorrows();
        checkOverdue();
    } finally {
        loading = false;
    }
}

function reserveBook(bookId) {
    if (loading) return;
    loading = true;
    
    try {
        const book = mockBooks.find(b => b.id === bookId);
        if (!book) return;
        
        if (reservedBooks.includes(bookId)) {
            alert('您已预约此书');
            return;
        }
        
        if (currentBorrows.find(b => b.bookId === bookId)) {
            alert('您已借阅此书，无需预约');
            return;
        }
        
        reservedBooks.push(bookId);
        alert(`成功预约《${book.name}》`);
        renderRecommendBooks();
    } finally {
        loading = false;
    }
}

function cancelReservation(bookId) {
    if (loading) return;
    loading = true;
    
    try {
        if (!reservedBooks.includes(bookId)) {
            alert('您未预约此书');
            return;
        }
        
        reservedBooks = reservedBooks.filter(id => id !== bookId);
        const book = mockBooks.find(b => b.id === bookId);
        alert(`成功取消预约《${book.name}》`);
        renderRecommendBooks();
    } finally {
        loading = false;
    }
}

function switchTab(tab) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.target.classList.add('active');
    
    if (tab === 'search') {
        document.getElementById('searchTab').classList.remove('hidden');
        document.getElementById('borrowTab').classList.add('hidden');
    } else {
        document.getElementById('searchTab').classList.add('hidden');
        document.getElementById('borrowTab').classList.remove('hidden');
        renderCurrentBorrows();
        renderBorrowHistory();
        checkOverdue();
    }
}

function filterByCategory(category) {
    currentCategory = category;
    document.querySelectorAll('#categoryTags .tag').forEach(tag => tag.classList.remove('active'));
    event.target.classList.add('active');
    renderBookList();
}

function formatDate(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
