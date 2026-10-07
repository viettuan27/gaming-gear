package com.tuanviet.gaminggear.service;

import com.tuanviet.gaminggear.config.RateLimitProperties;
import com.tuanviet.gaminggear.exception.RateLimitExceededException;
import com.tuanviet.gaminggear.security.custom.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class RateLimitService {

    private static final DefaultRedisScript<Long> INCREMENT_WITH_TTL = new DefaultRedisScript<>(
            "local current = redis.call('INCR', KEYS[1])\n"
                    + "if current == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end\n"
                    + "return current",
            Long.class
    );

    private final StringRedisTemplate stringRedisTemplate;
    private final RateLimitProperties properties;

    public void checkLogin(HttpServletRequest request, String email) {
        RateLimitProperties.Login rule = properties.getLogin();

        check("login:ip", getClientIp(request), rule.getIpLimit(), rule.getWindow());
        check("login:account", normalizeEmail(email), rule.getAccountLimit(), rule.getWindow());
    }

    public void checkRegister(HttpServletRequest request, String email) {
        RateLimitProperties.Register rule = properties.getRegister();

        check("register:ip", getClientIp(request), rule.getIpLimit(), rule.getWindow());
        check("register:account", normalizeEmail(email), rule.getAccountLimit(), rule.getWindow());
    }

    public void checkRefreshToken(HttpServletRequest request) {
        RateLimitProperties.Refresh rule = properties.getRefresh();

        check("refresh:ip", getClientIp(request), rule.getIpLimit(), rule.getWindow());
    }

    public void checkUpload(HttpServletRequest request) {
        RateLimitProperties.Upload rule = properties.getUpload();
        Long userId = getAuthenticatedUserId();

        if (userId != null) {
            check("upload:user", userId.toString(), rule.getUserLimit(), rule.getWindow());
        }

        check("upload:ip", getClientIp(request), rule.getIpLimit(), rule.getWindow());
    }

    private void check(String scope, String subject, int limit, Duration window) {
        long windowSeconds = Math.max(1, window.toSeconds());
        String key = "rate-limit:" + scope + ":" + sha256(subject);
        Long count = stringRedisTemplate.execute(
                INCREMENT_WITH_TTL,
                List.of(key),
                Long.toString(windowSeconds)
        );

        if (count == null || count > limit) {
            Long ttl = stringRedisTemplate.getExpire(key);
            long retryAfterSeconds = ttl != null && ttl > 0 ? ttl : windowSeconds;

            throw new RateLimitExceededException(retryAfterSeconds);
        }
    }

    private String getClientIp(HttpServletRequest request) {
        return request.getRemoteAddr();
    }

    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null
                && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            return userDetails.getUserId();
        }

        return null;
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String sha256(String value) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));

            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Không thể tạo khóa rate limit", exception);
        }
    }
}
