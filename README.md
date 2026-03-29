项目逻辑：
    1.使用html,css,js分离组建frontend，Spring Boot+MySQL组件backend
    2.登录记录IP防止重复注册和多次登录造成的DDOS
    3.使用Access Token and Refresh Token实现登录状态保持和CSRF防护
    4.密码在后端使用加密存储
    5.推荐按照热度和手动推荐实现
    6.使用Spring Data JPA实现SQL注入防护
    7.测试：{studyID:123 password:123}和{root:123 password:123}
    8.假数据保存在JSON文件中

前端：
1.User
登录->主页面{热门推荐(预约)、图书操作{借阅、归还、续期}、逾期通知、}
    同一IP5次/min
    验证合法(错误提示)
    密码加密
    重复注册验证->

页面：
    检索书库
    逾期通知/red
    推荐
    --------
    <class>
    name-出版社-借阅cnt
    \\\\\\\\\\\\\\\\\\
    借阅
    当前借阅
    --------
    name-出版社-到期时间-距今-[归还/red]-[续期/green]
    ---------
    历史借阅
JS:
    注册前端验证合法(防SQL注入)
    登录次数限制
    防止重复注册(拿到ip)
    防SQL注入
    发往后端{验证name唯一->storge}
    

Style:
    简约式设计，参考夸克风格，纯白页面，点击有响应动画，阴影，响应式设计
    

2.root
    图书入库、编辑、下架、检索、推荐
    设置归还期限

页面：
    登录
    \\\\\\\\\\\
    入库-检索-数据
    设置期限
    \\\\\\\\\\\
    ----------
    name-edit-推荐-下架
    \\\\\\\\\\\
    注册人数-图书数量
    已逾期：
    studyID-天数


3.后端：
    防SQL注入
    实现CSRF保护
    使用双token保证在线状态


4.MYSQL:
图书ID、ISBN号、书名、类别、出版社、借阅记录{user ID、借阅时间、归还时间}
User{id,name,studyID,借阅图书,逾期cnt}
登录IP{}


INPUT:
version: 0.1
现在做一个图书管理系统，使用html{user,root},style,js分离，后端使用MYSQL to storge the data,use Spring Boot进行架构(文件夹已有demo为后端文件夹)
在user文件夹添加User.html,root->root.html，style均为{简约式设计，参考夸克风格，纯白页面，点击有响应动画，阴影，响应式设计}；
定义：
    图书ID、ISBN号、书名、类别、出版社、借阅记录{user ID、借阅时间、归还时间}
    User{id,name,studyID,借阅图书,逾期cnt，AT,RT}
    登录IP{}
    
User页面：
        登录
        \\\\\\\\\\\\\\\\\\
        检索书库
        逾期通知/red
        推荐
        --------
        类别(使用小按钮设计)
        name-出版社-借阅cnt
        \\\\\\\\\\\\\\\\\\
        借阅
        当前借阅
        --------
        name-出版社-到期时间-距今-[归还/red]-[续期/green]
        ---------
        历史借阅
root页面：
        登录
        \\\\\\\\\\\
        入库-检索-数据
        设置期限
        \\\\\\\\\\\
        ----------
        name-edit-推荐-下架
        \\\\\\\\\\\
        注册人数-图书数量
        已逾期：
        studyID-天数
先做前端页面，先用假数据渲染

version: 0.2
现在完善JS和后端逻辑：
    更新MySQL{User{id,name,studyID,借阅图书,逾期cnt，AT,RT}}
    登录：
    1.同一IP5次/min
      验证合法(错误提示){use flask-wtf to 实现csrf保护}
      密码加密
      重复注册验证->检查数据库IP信息，若有3个重复IP信息，拒绝注册
      打包发往后端{验证name唯一->storge}
      登录次数限制-5次
    2.user and root使用双token保存登录信息referashToken(简称RT)设置7天有效期，Access Token(AT)有效期2h,登录成功返回Access Token，当AT失效时访问服务器RT是否有效，是则更新AT
    
    页面：
    user:获取热门书籍信息，拿到用户借阅信息，判断是否逾期，是则提示在首页，否则该盒子隐藏，点击检索，输入name返回匹配图书信息；进入主页拿到借阅信息自动判断状态并显示；
    root:auto

现在加一个{studyID:123 password:123}的默认用户账号测试，和一个{root:123 password:123}管理员账号


version: 0.3
增加推荐预约功能：
    推荐页的书籍栏尾部加一个预约按钮/green
    mysql中user.add{预约图书}

完善防护和体验逻辑：
    前端加loading逻辑防止超卖，数据库使用原子更新


version: 0.4
体验更新：
    检索时不再显示推荐
    在MySQL的图书表中增加status字段，表示当前可借状态。
    在前端页面（用户/管理员）的图书信息展示中，明确标出状态。
    借阅/预约/归还/下架操作需同步更新此状态
    去除不必要的emoji简化页面

