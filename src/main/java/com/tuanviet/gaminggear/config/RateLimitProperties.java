package com.tuanviet.gaminggear.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

@Getter
@Setter
@Component
@Validated
@ConfigurationProperties(prefix = "security.rate-limit")
public class RateLimitProperties {

    @Valid
    private Login login = new Login();

    @Valid
    private Register register = new Register();

    @Valid
    private Refresh refresh = new Refresh();

    @Valid
    private Upload upload = new Upload();

    @Getter
    @Setter
    public static class Login {

        @Min(1)
        private int ipLimit = 20;

        @Min(1)
        private int accountLimit = 8;

        @NotNull
        private Duration window = Duration.ofMinutes(1);
    }

    @Getter
    @Setter
    public static class Register {

        @Min(1)
        private int ipLimit = 5;

        @Min(1)
        private int accountLimit = 3;

        @NotNull
        private Duration window = Duration.ofHours(1);
    }

    @Getter
    @Setter
    public static class Refresh {

        @Min(1)
        private int ipLimit = 30;

        @NotNull
        private Duration window = Duration.ofMinutes(1);
    }

    @Getter
    @Setter
    public static class Upload {

        @Min(1)
        private int userLimit = 30;

        @Min(1)
        private int ipLimit = 60;

        @NotNull
        private Duration window = Duration.ofMinutes(1);
    }
}
