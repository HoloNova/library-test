package test.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import test.demo.entity.BorrowRecord;
import test.demo.entity.User;
import test.demo.entity.Book;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BorrowRecordRepository extends JpaRepository<BorrowRecord, Long> {
    List<BorrowRecord> findByUserAndIsReturnedFalse(User user);
    List<BorrowRecord> findByUserAndIsReturnedTrueOrderByCreatedAtDesc(User user);
    List<BorrowRecord> findByIsReturnedFalseAndDueDateBefore(LocalDateTime date);
    boolean existsByUserAndBookAndIsReturnedFalse(User user, Book book);
    List<BorrowRecord> findByBookAndIsReturnedFalse(Book book);
}
