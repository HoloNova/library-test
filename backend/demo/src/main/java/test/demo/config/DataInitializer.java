package test.demo.config;

import lombok.RequiredArgsConstructor;
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
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            User testUser = new User();
            testUser.setName("测试用户");
            testUser.setStudyID("123");
            testUser.setPassword(passwordEncoder.encode("123"));
            testUser.setOverdueCnt(0);
            testUser.setIsAdmin(false);

            User adminUser = new User();
            adminUser.setName("root");
            adminUser.setStudyID("root");
            adminUser.setPassword(passwordEncoder.encode("123"));
            adminUser.setOverdueCnt(0);
            adminUser.setIsAdmin(true);

            userRepository.saveAll(Arrays.asList(testUser, adminUser));
            System.out.println("默认用户创建成功！");
            System.out.println("用户账号: 123 / 123");
            System.out.println("管理员账号: root / 123");
        }

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

    private Book createBook(String isbn, String name, String category, String publisher, int borrowCount, boolean isRecommend) {
        Book book = new Book();
        book.setIsbn(isbn);
        book.setName(name);
        book.setCategory(category);
        book.setPublisher(publisher);
        book.setBorrowCount(borrowCount);
        book.setIsRecommend(isRecommend);
        book.setIsActive(true);
        book.setStatus(true); // 默认可借
        return book;
    }
}
