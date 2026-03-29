package test.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import test.demo.entity.LoginAttempt;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {
    Optional<LoginAttempt> findByIpAddress(String ipAddress);
    List<LoginAttempt> findByLastAttemptTimeBefore(LocalDateTime time);
    List<LoginAttempt> findByIpAddressContaining(String ipPattern);
}
