package test.demo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import test.demo.entity.Book;
import test.demo.entity.BorrowRecord;
import test.demo.entity.User;
import test.demo.repository.BookRepository;
import test.demo.repository.BorrowRecordRepository;
import test.demo.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final BorrowRecordRepository borrowRecordRepository;

    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("userCount", userRepository.count());
        stats.put("bookCount", bookRepository.findByIsActiveTrue().size());
        
        List<Map<String, Object>> overdueList = new ArrayList<>();
        List<BorrowRecord> overdueRecords = borrowRecordRepository
                .findByIsReturnedFalseAndDueDateBefore(LocalDateTime.now());
        
        for (BorrowRecord record : overdueRecords) {
            Map<String, Object> item = new HashMap<>();
            User user = record.getUser();
            Book book = record.getBook();
            long overdueDays = LocalDateTime.now().until(record.getDueDate(), java.time.temporal.ChronoUnit.DAYS);
            
            item.put("studyID", user.getStudyID());
            item.put("name", user.getName());
            item.put("bookName", book.getName());
            item.put("overdueDays", Math.abs(overdueDays));
            
            overdueList.add(item);
        }
        
        stats.put("overdueList", overdueList);
        return stats;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<Book> getAllBooksAdmin() {
        return bookRepository.findAll();
    }

    public Book toggleRecommend(Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("图书不存在"));
        
        book.setIsRecommend(!book.getIsRecommend());
        return bookRepository.save(book);
    }

    public Book toggleActive(Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("图书不存在"));
        
        if (!book.getIsActive()) {
            book.setIsActive(true);
            return bookRepository.save(book);
        }
        
        List<BorrowRecord> activeBorrows = borrowRecordRepository.findByBookAndIsReturnedFalse(book);
        if (!activeBorrows.isEmpty()) {
            throw new RuntimeException("该图书有未归还的借阅记录，无法下架");
        }
        
        book.setIsActive(false);
        return bookRepository.save(book);
    }
}
