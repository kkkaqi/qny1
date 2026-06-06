package com.moying.config;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.time.Duration;

@Configuration
public class AiConfig {

    @Value("${langchain4j.open-ai.chat-model.api-key}")
    private String apiKey;

    @Value("${langchain4j.open-ai.chat-model.model-name:gpt-4o}")
    private String modelName;

    @Value("${langchain4j.open-ai.chat-model.temperature:0.7}")
    private Double temperature;

    @Value("${langchain4j.open-ai.chat-model.max-tokens:4096}")
    private Integer maxTokens;

    @Value("${langchain4j.open-ai.chat-model.timeout:120s}")
    private Duration timeout;

    @Value("${langchain4j.open-ai.chat-model.base-url:#{null}}")
    private String baseUrl;

    @Bean
    public ChatLanguageModel chatLanguageModel() {
        if (baseUrl == null || baseUrl.isBlank()) {
            return OpenAiChatModel.builder().apiKey(apiKey).modelName(modelName).temperature(temperature).maxTokens(maxTokens).timeout(timeout).build();
        }
        return OpenAiChatModel.builder().baseUrl(baseUrl).apiKey(apiKey).modelName(modelName).temperature(temperature).maxTokens(maxTokens).timeout(timeout).build();
    }
}
