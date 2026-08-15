package br.com.fiap.smarthas.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.web.config.EnableSpringDataWebSupport;

/**
 * Without spring-boot-starter-data-jpa on the classpath, Spring Boot's
 * SpringDataWebAutoConfiguration doesn't kick in on its own, so
 * {@code Pageable}/{@code Page} controller method parameters (used by
 * /api/resources and /api/users) aren't resolved automatically. This forces
 * that Spring Data Web support (PageableHandlerMethodArgumentResolver etc.)
 * explicitly - we only need Pageable/Page, not JPA repositories.
 */
@Configuration
@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
public class WebConfig {
}
