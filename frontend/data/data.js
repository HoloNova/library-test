const DATA = {
    books: [
        {
            "id": 1,
            "isbn": "9787111111111",
            "name": "活着",
            "category": "文学",
            "publisher": "作家出版社",
            "borrowCount": 156,
            "isRecommend": true,
            "isActive": true,
            "status": true
        },
        {
            "id": 2,
            "isbn": "9787111222222",
            "name": "三体",
            "category": "科技",
            "publisher": "重庆出版社",
            "borrowCount": 289,
            "isRecommend": true,
            "isActive": true,
            "status": true
        },
        {
            "id": 3,
            "isbn": "9787111333333",
            "name": "人类简史",
            "category": "历史",
            "publisher": "中信出版社",
            "borrowCount": 178,
            "isRecommend": true,
            "isActive": true,
            "status": true
        },
        {
            "id": 4,
            "isbn": "9787111444444",
            "name": "艺术的故事",
            "category": "艺术",
            "publisher": "广西美术出版社",
            "borrowCount": 89,
            "isRecommend": true,
            "isActive": true,
            "status": true
        },
        {
            "id": 5,
            "isbn": "9787111555555",
            "name": "围城",
            "category": "文学",
            "publisher": "人民文学出版社",
            "borrowCount": 123,
            "isRecommend": false,
            "isActive": true,
            "status": false
        },
        {
            "id": 6,
            "isbn": "9787111666666",
            "name": "代码大全",
            "category": "科技",
            "publisher": "电子工业出版社",
            "borrowCount": 210,
            "isRecommend": false,
            "isActive": true,
            "status": true
        },
        {
            "id": 7,
            "isbn": "9787111777777",
            "name": "明朝那些事儿",
            "category": "历史",
            "publisher": "浙江人民出版社",
            "borrowCount": 345,
            "isRecommend": false,
            "isActive": true,
            "status": true
        },
        {
            "id": 8,
            "isbn": "9787111888888",
            "name": "苏菲的世界",
            "category": "哲学",
            "publisher": "作家出版社",
            "borrowCount": 167,
            "isRecommend": false,
            "isActive": true,
            "status": true
        },
        {
            "id": 9,
            "isbn": "9787111999999",
            "name": "红楼梦",
            "category": "文学",
            "publisher": "人民文学出版社",
            "borrowCount": 423,
            "isRecommend": false,
            "isActive": true,
            "status": true
        },
        {
            "id": 10,
            "isbn": "9787111000000",
            "name": "设计心理学",
            "category": "艺术",
            "publisher": "中信出版社",
            "borrowCount": 98,
            "isRecommend": false,
            "isActive": true,
            "status": true
        },
        {
            "id": 11,
            "isbn": "9787111121212",
            "name": "百年孤独",
            "category": "文学",
            "publisher": "南海出版公司",
            "borrowCount": 189,
            "isRecommend": false,
            "isActive": true,
            "status": true
        },
        {
            "id": 12,
            "isbn": "9787111232323",
            "name": "算法导论",
            "category": "科技",
            "publisher": "机械工业出版社",
            "borrowCount": 156,
            "isRecommend": false,
            "isActive": true,
            "status": true
        }
    ],
    users: [
        {
            "id": 1,
            "name": "张三",
            "studyID": "2021001",
            "overdueCnt": 0
        },
        {
            "id": 2,
            "name": "李四",
            "studyID": "2021002",
            "overdueCnt": 1
        },
        {
            "id": 3,
            "name": "王五",
            "studyID": "2021003",
            "overdueCnt": 0
        },
        {
            "id": 4,
            "name": "赵六",
            "studyID": "2021004",
            "overdueCnt": 0
        },
        {
            "id": 5,
            "name": "钱七",
            "studyID": "2021005",
            "overdueCnt": 2
        }
    ],
    overdue: [
        {
            "userId": 2,
            "studyID": "2021002",
            "name": "李四",
            "bookId": 5,
            "bookName": "围城",
            "overdueDays": 10
        },
        {
            "userId": 5,
            "studyID": "2021005",
            "name": "钱七",
            "bookId": 1,
            "bookName": "活着",
            "overdueDays": 5
        },
        {
            "userId": 5,
            "studyID": "2021005",
            "name": "钱七",
            "bookId": 3,
            "bookName": "人类简史",
            "overdueDays": 3
        }
    ]
};

const API = {
    login: function(studyID, password) {
        if (studyID === '123' && password === '123') {
            return {
                success: true,
                data: {
                    accessToken: 'mock_access_token_' + Date.now(),
                    refreshToken: 'mock_refresh_token_' + Date.now(),
                    user: {
                        id: 1,
                        name: '测试用户',
                        studyID: '123'
                    }
                }
            };
        } else if (studyID === 'root' && password === '123') {
            return {
                success: true,
                data: {
                    accessToken: 'mock_admin_token_' + Date.now(),
                    refreshToken: 'mock_admin_refresh_token_' + Date.now(),
                    user: {
                        id: 2,
                        name: '管理员',
                        isAdmin: true
                    }
                }
            };
        }
        return {
            success: false,
            message: '账号或密码错误'
        };
    },
    
    getBooks: function() {
        return {
            success: true,
            data: DATA.books
        };
    },
    
    getRecommendBooks: function() {
        const recommendBooks = DATA.books.filter(b => b.isRecommend);
        const hotBooks = [...DATA.books].sort((a, b) => b.borrowCount - a.borrowCount).slice(0, 4);
        const combined = [...new Map([...recommendBooks, ...hotBooks].map(b => [b.id, b])).values()];
        return {
            success: true,
            data: combined
        };
    }
};
