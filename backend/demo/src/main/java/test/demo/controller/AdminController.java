package test.demo.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import test.demo.dto.ApiResponse;
import test.demo.entity.Book;
import test.demo.entity.User;
import test.demo.service.AdminService;
import test.demo.service.BookService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final AdminService adminService;
    private final BookService bookService;

    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatistics() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getStatistics()));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllUsers()));
    }

    @GetMapping("/books")
    public ResponseEntity<ApiResponse<List<Book>>> getAllBooks() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllBooksAdmin()));
    }

    @PostMapping("/books")
    public ResponseEntity<ApiResponse<Book>> createBook(@RequestBody Book book) {
        try {
            Book createdBook = bookService.createBook(book);
            return ResponseEntity.ok(ApiResponse.success("添加成功", createdBook));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/books/{id}")
    public ResponseEntity<ApiResponse<Book>> updateBook(
            @PathVariable Long id,
            @RequestBody Book bookDetails) {
        try {
            Book updatedBook = bookService.updateBook(id, bookDetails);
            return ResponseEntity.ok(ApiResponse.success("更新成功", updatedBook));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/books/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBook(@PathVariable Long id) {
        try {
            bookService.deleteBook(id);
            return ResponseEntity.ok(ApiResponse.success("下架成功", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/books/{id}/recommend")
    public ResponseEntity<ApiResponse<Book>> toggleRecommend(@PathVariable Long id) {
        try {
            Book book = adminService.toggleRecommend(id);
            return ResponseEntity.ok(ApiResponse.success(book));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/books/{id}/active")
    public ResponseEntity<ApiResponse<Book>> toggleActive(@PathVariable Long id) {
        try {
            Book book = adminService.toggleActive(id);
            return ResponseEntity.ok(ApiResponse.success(book));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
