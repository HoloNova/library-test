package test.demo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import test.demo.config.JwtConfig;
import test.demo.dto.AuthResponse;
import test.demo.dto.LoginRequest;
import test.demo.dto.RegisterRequest;
import test.demo.entity.LoginAttempt;
import test.demo.entity.RefreshToken;
import test.demo.entity.User;
import test.demo.repository.BorrowRecordRepository;
import test.demo.repository.LoginAttemptRepository;
import test.demo.repository.RefreshTokenRepository;
import test.demo.repository.UserRepository;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BorrowRecordRepository borrowRecordRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final LoginAttemptRepository loginAttemptRepository;
    private final JwtConfig jwtConfig;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    public AuthResponse register(RegisterRequest request, String ipAddress) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }
        

        String ipPrefix= "";
        String[] ipParts = ipAddress.split("\\.");
        if (ipParts.length >= 2) {
            ipPrefix = ipParts[0] + "." + ipParts[1];
        } else {
            ipPrefix = ipAddress; // 如果IP地址格式不正确，直接使用原始IP
        }

        long sameIpCount = loginAttemptRepository.findByIpAddressContaining(ipPrefix).stream().count();
        
        if (sameIpCount >= 3) {
            throw new RuntimeException("同一IP注册用户过多，请稍后再试");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setOverdueCnt(0);
        user.setIsAdmin(false);
        
        user = userRepository.save(user);
        
        return createAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request, String ipAddress) {
        checkLoginAttempt(ipAddress);
        
        Optional<User> userOpt;
        userOpt = userRepository.findByUsername(request.getUsername());

        if (userOpt.isEmpty() || !passwordEncoder.matches(request.getPassword(), userOpt.get().getPassword())) {
            recordFailedAttempt(ipAddress);
            throw new RuntimeException("用户名或密码错误");
        }
        
        clearLoginAttempt(ipAddress);
        return createAuthResponse(userOpt.get());
    }

    public AuthResponse refreshToken(String refreshTokenStr) {
        Optional<RefreshToken> refreshTokenOpt = refreshTokenRepository.findByToken(refreshTokenStr);
        if (refreshTokenOpt.isEmpty()) {
            throw new RuntimeException("Refresh Token无效");
        }
        
        RefreshToken refreshToken = refreshTokenOpt.get();
        if (refreshToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new RuntimeException("Refresh Token已过期");
        }
        
        User user = refreshToken.getUser();
        String accessToken = jwtConfig.generateAccessToken(user.getId(), user.getUsername(), user.getIsAdmin());
        
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .userId(user.getId())
                .username(user.getUsername())
                .isAdmin(user.getIsAdmin())
                .build();
    }

    @Transactional
    public void logout(String refreshTokenStr) {
        refreshTokenRepository.findByToken(refreshTokenStr).ifPresent(refreshTokenRepository::delete);
    }

    public void logoff(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        boolean hasUnreturned = borrowRecordRepository.existsByUserAndIsReturnedFalse(user);
        if (hasUnreturned) {
            throw new RuntimeException("无法注销账号，请先归还所有借阅的书籍");
        }
        refreshTokenRepository.findByUser(user).ifPresent(refreshTokenRepository::delete);
        userRepository.delete(user);
    }

    private AuthResponse createAuthResponse(User user) {
        String accessToken = jwtConfig.generateAccessToken(user.getId(), user.getUsername(), user.getIsAdmin());
        String refreshTokenStr = generateRefreshToken(user);
        
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .userId(user.getId())
                .username(user.getUsername())
                .isAdmin(user.getIsAdmin())
                .build();
    }

    private String generateRefreshToken(User user) {
        refreshTokenRepository.findByUser(user).ifPresent(refreshTokenRepository::delete);
        
        String token = UUID.randomUUID().toString();
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(token);
        refreshToken.setUser(user);
        refreshToken.setExpiryDate(LocalDateTime.now().plus(refreshTokenExpiration, ChronoUnit.MILLIS));
        
        refreshTokenRepository.save(refreshToken);
        return token;
    }

    private void checkLoginAttempt(String ipAddress) {
        Optional<LoginAttempt> attemptOpt = loginAttemptRepository.findByIpAddress(ipAddress);
        if (attemptOpt.isPresent()) {
            LoginAttempt attempt = attemptOpt.get();
            if (attempt.getLastAttemptTime().isAfter(LocalDateTime.now().minusMinutes(1))) {
                if (attempt.getAttemptCount() >= 5) {
                    throw new RuntimeException("登录尝试次数过多，请1分钟后再试");
                }
            } else {
                attempt.setAttemptCount(0);
                loginAttemptRepository.save(attempt);
            }
        }
    }

    private void recordFailedAttempt(String ipAddress) {
        LoginAttempt attempt = loginAttemptRepository.findByIpAddress(ipAddress)
                .orElseGet(() -> {
                    LoginAttempt a = new LoginAttempt();
                    a.setIpAddress(ipAddress);
                    a.setAttemptCount(0);
                    return a;
                });
        
        attempt.setAttemptCount(attempt.getAttemptCount() + 1);
        attempt.setLastAttemptTime(LocalDateTime.now());
        loginAttemptRepository.save(attempt);
    }

    private void clearLoginAttempt(String ipAddress) {
        loginAttemptRepository.findByIpAddress(ipAddress).ifPresent(loginAttemptRepository::delete);
    }
}
