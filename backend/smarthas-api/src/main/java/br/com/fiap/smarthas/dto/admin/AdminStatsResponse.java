package br.com.fiap.smarthas.dto.admin;

import java.util.Map;

public record AdminStatsResponse(
        long totalUsers,
        long totalResources,
        long totalMessages,
        Map<String, Long> resourcesByCategory
) {
}
