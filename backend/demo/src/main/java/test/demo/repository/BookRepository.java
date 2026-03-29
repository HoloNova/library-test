package test.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import test.demo.entity.Book;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    Optional<Book> findByIsbn(String isbn);
    List<Book> findByIsActiveTrue();
    List<Book> findByIsRecommendTrueAndIsActiveTrue();
    List<Book> findByCategoryAndIsActiveTrue(String category);
    
    @Query("SELECT b FROM Book b WHERE b.isActive = true AND " +
           "(b.name LIKE %:keyword% OR b.isbn LIKE %:keyword% OR b.publisher LIKE %:keyword%)")
    List<Book> searchBooks(String keyword);
    
    @Query("SELECT b FROM Book b WHERE b.isActive = true ORDER BY b.borrowCount DESC")
    List<Book> findHotBooks();
}
