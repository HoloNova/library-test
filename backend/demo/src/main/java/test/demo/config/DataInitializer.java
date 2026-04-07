package test.demo.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import test.demo.entity.Book;
import test.demo.entity.User;
import test.demo.repository.BookRepository;
import test.demo.repository.UserRepository;

import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public DataInitializer(UserRepository userRepository, BookRepository bookRepository) {
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
    }

    @Override
    public void run(String... args) {
        ensureDefaultUsers();

        if (bookRepository.count() == 0) {
            List<Book> books = Arrays.asList(
                    createBook("9787111111111", "活着", "文学", "作家出版社", 156, true),
                    createBook("9787111222222", "三体", "科技", "重庆出版社", 289, true),
                    createBook("9787111333333", "人类简史", "历史", "中信出版社", 178, true),
                    createBook("9787111444444", "艺术的故事", "艺术", "广西美术出版社", 89, true),
                    createBook("9787111555555", "围城", "文学", "人民文学出版社", 123, false),
                    createBook("9787111666666", "代码大全", "科技", "电子工业出版社", 210, false),
                    createBook("9787111777777", "明朝那些事儿", "历史", "浙江人民出版社", 345, false),
                    createBook("9787111888888", "苏菲的世界", "哲学", "作家出版社", 167, false),
                    createBook("9787111999999", "红楼梦", "文学", "人民文学出版社", 423, false),
                    createBook("9787111000000", "设计心理学", "艺术", "中信出版社", 98, false),
                    createBook("9787111121212", "百年孤独", "文学", "南海出版公司", 189, false),
                    createBook("9787111232323", "算法导论", "科技", "机械工业出版社", 156, false)
            );

            bookRepository.saveAll(books);
            System.out.println("默认图书创建成功！");
        }
    }

    /** 库中已有历史数据时 count()!=0 也会跳过旧逻辑；按 username 补全默认账号避免登录 400。 */
    private void ensureDefaultUsers() {
        if (!userRepository.existsByUsername("123")) {
            userRepository.findByName("123").ifPresentOrElse(u -> {
                u.setUsername("123");
                u.setPassword(passwordEncoder.encode("123"));
                userRepository.save(u);
                System.out.println("已补齐用户名/密码: 123 / 123");
            }, () -> {
                User testUser = new User();
                testUser.setName("123");
                testUser.setUsername("123");
                testUser.setPassword(passwordEncoder.encode("123"));
                testUser.setOverdueCnt(0);
                testUser.setIsAdmin(false);
                userRepository.save(testUser);
                System.out.println("已创建默认用户: 123 / 123");
            });
        }
        if (!userRepository.existsByUsername("root")) {
            userRepository.findByName("root").ifPresentOrElse(u -> {
                u.setUsername("root");
                u.setPassword(passwordEncoder.encode("123"));
                u.setIsAdmin(true);
                userRepository.save(u);
                System.out.println("已补齐管理员用户名/密码: root / 123");
            }, () -> {
                User adminUser = new User();
                adminUser.setName("root");
                adminUser.setUsername("root");
                adminUser.setPassword(passwordEncoder.encode("123"));
                adminUser.setOverdueCnt(0);
                adminUser.setIsAdmin(true);
                userRepository.save(adminUser);
                System.out.println("已创建管理员: root / 123");
            });
        }
    }

    private Book createBook(String isbn, String name, String category, String publisher, int borrowCount, boolean isRecommend) {
        Book book = new Book();
        book.setIsbn(isbn);
        book.setName(name);
        book.setCategory(category);
        book.setPublisher(publisher);
        book.setBorrowCount(borrowCount);
        book.setIsRecommend(isRecommend);
        book.setIsActive(true);
        book.setStatus(true);
        return book;
    }
}
