package com.tuanviet.gaminggear.dto.response;

import java.math.BigDecimal;

public record OrderStatisticsResponse(
        BigDecimal deliveredRevenue,
        long deliveredOrderCount
) {
}
