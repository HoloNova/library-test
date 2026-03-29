package test.demo.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import test.demo.dto.ApiResponse;
import test.demo.entity.Book;
import test.demo.entity.BorrowRecord;
import test.demo.service.BookService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BookController {

    private final BookService bookService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Book>>> getAllBooks() {
        return ResponseEntity.ok(ApiResponse.success(bookService.getAllBooks()));
    }

    @GetMapping("/recommend")
    public ResponseEntity<ApiResponse<List<Book>>> getRecommendBooks() {
        return ResponseEntity.ok(ApiResponse.success(bookService.getRecommendBooks()));
    }

    @GetMapping("/hot")
    public ResponseEntity<ApiResponse<List<Book>>> getHotBooks() {
        return ResponseEntity.ok(ApiResponse.success(bookService.getHotBooks()));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<Book>>> searchBooks(@RequestParam String keyword) {
        return ResponseEntity.ok(ApiResponse.success(bookService.searchBooks(keyword)));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<List<Book>>> getBooksByCategory(@PathVariable String category) {
        return ResponseEntity.ok(ApiResponse.success(bookService.getBooksByCategory(category)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Book>> getBookById(@PathVariable Long id) {
        return bookService.getBookById(id)
                .map(book -> ResponseEntity.ok(ApiResponse.success(book)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{bookId}/borrow")
    public ResponseEntity<ApiResponse<Map<String, Object>>> borrowBook(
            @PathVariable Long bookId,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            BorrowRecord record = bookService.borrowBook(userId, bookId);
            Map<String, Object> result = new HashMap<>();
            result.put("recordId", record.getId());
            result.put("dueDate", record.getDueDate());
            return ResponseEntity.ok(ApiResponse.success("借阅成功", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/records/{recordId}/return")
    public ResponseEntity<ApiResponse<Void>> returnBook(
            @PathVariable Long recordId,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            bookService.returnBook(userId, recordId);
            return ResponseEntity.ok(ApiResponse.success("归还成功", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/records/{recordId}/renew")
    public ResponseEntity<ApiResponse<Map<String, Object>>> renewBook(
            @PathVariable Long recordId,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            BorrowRecord record = bookService.renewBook(userId, recordId);
            Map<String, Object> result = new HashMap<>();
            result.put("dueDate", record.getDueDate());
            return ResponseEntity.ok(ApiResponse.success("续期成功", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}/current")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCurrentBorrows(
            @PathVariable Long userId) {
        try {
            List<BorrowRecord> records = bookService.getCurrentBorrows(userId);
            List<Map<String, Object>> result = records.stream().map(record -> {
                Map<String, Object> item = new HashMap<>();
                item.put("recordId", record.getId());
                item.put("bookId", record.getBook().getId());
                item.put("bookName", record.getBook().getName());
                item.put("publisher", record.getBook().getPublisher());
                item.put("borrowDate", record.getBorrowDate());
                item.put("dueDate", record.getDueDate());
                return item;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}/history")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getBorrowHistory(
            @PathVariable Long userId) {
        try {
            List<BorrowRecord> records = bookService.getBorrowHistory(userId);
            List<Map<String, Object>> result = records.stream().map(record -> {
                Map<String, Object> item = new HashMap<>();
                item.put("bookId", record.getBook().getId());
                item.put("bookName", record.getBook().getName());
                item.put("publisher", record.getBook().getPublisher());
                item.put("borrowDate", record.getBorrowDate());
                item.put("returnDate", record.getReturnDate());
                return item;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}/overdue")
    public ResponseEntity<ApiResponse<Boolean>> hasOverdueBooks(@PathVariable Long userId) {
        try {
            boolean hasOverdue = bookService.hasOverdueBooks(userId);
            return ResponseEntity.ok(ApiResponse.success(hasOverdue));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{bookId}/reserve")
    public ResponseEntity<ApiResponse<Void>> reserveBook(
            @PathVariable Long bookId,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            bookService.reserveBook(userId, bookId);
            return ResponseEntity.ok(ApiResponse.success("预约成功", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{bookId}/cancel-reserve")
    public ResponseEntity<ApiResponse<Void>> cancelReservation(
            @PathVariable Long bookId,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            bookService.cancelReservation(userId, bookId);
            return ResponseEntity.ok(ApiResponse.success("取消预约成功", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}/reserved")
    public ResponseEntity<ApiResponse<List<Book>>> getReservedBooks(@PathVariable Long userId) {
        try {
            List<Book> reservedBooks = bookService.getReservedBooks(userId);
            return ResponseEntity.ok(ApiResponse.success(reservedBooks));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
