package test.demo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import test.demo.entity.Book;
import test.demo.entity.BorrowRecord;
import test.demo.entity.User;
import test.demo.repository.BookRepository;
import test.demo.repository.BorrowRecordRepository;
import test.demo.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;
    private final BorrowRecordRepository borrowRecordRepository;
    private final UserRepository userRepository;

    @Value("${borrow.default-days}")
    private int borrowDays;

    public List<Book> getAllBooks() {
        return bookRepository.findByIsActiveTrue();
    }

    public List<Book> getRecommendBooks() {
        return bookRepository.findByIsRecommendTrueAndIsActiveTrue();
    }

    public List<Book> getHotBooks() {
        return bookRepository.findHotBooks();
    }

    public List<Book> searchBooks(String keyword) {
        return bookRepository.searchBooks(keyword);
    }

    public List<Book> getBooksByCategory(String category) {
        return bookRepository.findByCategoryAndIsActiveTrue(category);
    }

    public Optional<Book> getBookById(Long id) {
        return bookRepository.findById(id);
    }

    @Transactional
    public Book createBook(Book book) {
        if (bookRepository.findByIsbn(book.getIsbn()).isPresent()) {
            throw new RuntimeException("ISBN已存在");
        }
        return bookRepository.save(book);
    }

    @Transactional
    public Book updateBook(Long id, Book bookDetails) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("图书不存在"));
        
        book.setName(bookDetails.getName());
        book.setCategory(bookDetails.getCategory());
        book.setPublisher(bookDetails.getPublisher());
        book.setIsRecommend(bookDetails.getIsRecommend());
        book.setIsActive(bookDetails.getIsActive());
        
        return bookRepository.save(book);
    }

    @Transactional
    public void deleteBook(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("图书不存在"));
        
        List<BorrowRecord> activeBorrows = borrowRecordRepository.findByBookAndIsReturnedFalse(book);
        if (!activeBorrows.isEmpty()) {
            throw new RuntimeException("该图书有未归还的借阅记录，无法下架");
        }
        
        book.setIsActive(false);
        bookRepository.save(book);
    }

    @Transactional
    public BorrowRecord borrowBook(Long userId, Long bookId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("图书不存在"));
        
        if (!book.getIsActive()) {
            throw new RuntimeException("该图书已下架");
        }
        
        if (borrowRecordRepository.existsByUserAndBookAndIsReturnedFalse(user, book)) {
            throw new RuntimeException("您已借阅此书");
        }
        
        if (user.getReservedBookIds().contains(bookId)) {
            user.getReservedBookIds().remove(bookId);
            userRepository.save(user);
        }
        
        BorrowRecord record = new BorrowRecord();
        record.setUser(user);
        record.setBook(book);
        record.setBorrowDate(LocalDateTime.now());
        record.setDueDate(LocalDateTime.now().plusDays(borrowDays));
        record.setIsReturned(false);
        
        book.setBorrowCount(book.getBorrowCount() + 1);
        book.setIsActive(false);
        bookRepository.save(book);
        
        return borrowRecordRepository.save(record);
    }

    @Transactional
    public BorrowRecord returnBook(Long userId, Long recordId) {
        BorrowRecord record = borrowRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("借阅记录不存在"));
        
        if (!record.getUser().getId().equals(userId)) {
            throw new RuntimeException("无权操作此记录");
        }
        
        if (record.getIsReturned()) {
            throw new RuntimeException("该书已归还");
        }
        
        record.setReturnDate(LocalDateTime.now());
        record.setIsReturned(true);
        
        return borrowRecordRepository.save(record);
    }

    @Transactional
    public BorrowRecord renewBook(Long userId, Long recordId) {
        BorrowRecord record = borrowRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("借阅记录不存在"));
        
        if (!record.getUser().getId().equals(userId)) {
            throw new RuntimeException("无权操作此记录");
        }
        
        if (record.getIsReturned()) {
            throw new RuntimeException("该书已归还");
        }
        
        record.setDueDate(record.getDueDate().plusDays(borrowDays));
        
        return borrowRecordRepository.save(record);
    }

    public List<BorrowRecord> getCurrentBorrows(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        List<BorrowRecord> records = borrowRecordRepository.findByUserAndIsReturnedFalse(user);
        
        int overdueCount = 0;
        LocalDateTime now = LocalDateTime.now();
        for (BorrowRecord record : records) {
            if (record.getDueDate().isBefore(now)) {
                overdueCount++;
            }
        }
        
        user.setOverdueCnt(overdueCount);
        userRepository.save(user);
        
        return records;
    }

    public List<BorrowRecord> getBorrowHistory(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        return borrowRecordRepository.findByUserAndIsReturnedTrueOrderByCreatedAtDesc(user);
    }

    public boolean hasOverdueBooks(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        List<BorrowRecord> records = borrowRecordRepository.findByUserAndIsReturnedFalse(user);
        LocalDateTime now = LocalDateTime.now();
        
        return records.stream().anyMatch(r -> r.getDueDate().isBefore(now));
    }

    @Transactional
    public void reserveBook(Long userId, Long bookId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("图书不存在"));
        
        if (!book.getIsActive()) {
            throw new RuntimeException("该图书已下架");
        }
        
        if (user.getReservedBookIds().contains(bookId)) {
            throw new RuntimeException("您已预约此书");
        }
        
        if (borrowRecordRepository.existsByUserAndBookAndIsReturnedFalse(user, book)) {
            throw new RuntimeException("您已借阅此书，无需预约");
        }
        
        user.getReservedBookIds().add(bookId);
        userRepository.save(user);
    }

    @Transactional
    public void cancelReservation(Long userId, Long bookId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        if (!user.getReservedBookIds().contains(bookId)) {
            throw new RuntimeException("您未预约此书");
        }
        
        user.getReservedBookIds().remove(bookId);
        userRepository.save(user);
    }

    public List<Book> getReservedBooks(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        return bookRepository.findAllById(user.getReservedBookIds());
    }
}
