package com.tuanviet.gaminggear.exception;

import lombok.Getter;

@Getter
public class RateLimitExceededException extends RuntimeException {

    private final long retryAfterSeconds;

    public RateLimitExceededException(long retryAfterSeconds) {
        super("Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.");
        this.retryAfterSeconds = retryAfterSeconds;
    }
}
