package com.example.ssedemo.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/sse")
@CrossOrigin(origins = "*")
public class SseController {

    private static final Logger logger = LoggerFactory.getLogger(SseController.class);
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    @GetMapping(value = "/connect", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter connect(@RequestParam String clientId) {
        logger.info("New SSE connection request from client: {}", clientId);
        SseEmitter emitter = new SseEmitter(0L); // 0L means no timeout
        emitters.put(clientId, emitter);

        // Send initial message
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data("Connected to SSE server"));
            logger.info("Sent initial connection message to client: {}", clientId);
        } catch (IOException e) {
            logger.error("Error sending initial message to client: {}", clientId, e);
        }

        emitter.onCompletion(() -> {
            logger.info("SSE connection completed for client: {}", clientId);
            emitters.remove(clientId);
        });
        emitter.onTimeout(() -> {
            logger.info("SSE connection timed out for client: {}", clientId);
            emitters.remove(clientId);
        });
        emitter.onError((e) -> {
            logger.error("SSE connection error for client: {}", clientId, e);
            emitters.remove(clientId);
        });

        return emitter;
    }

    @PostMapping("/send")
    public void sendEvent(@RequestParam String clientId, @RequestBody String message) {
        logger.info("Sending message to client {}: {}", clientId, message);
        SseEmitter emitter = emitters.get(clientId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name("message")
                        .data(message));
                logger.info("Message sent successfully to client: {}", clientId);
            } catch (IOException e) {
                logger.error("Error sending message to client: {}", clientId, e);
                emitters.remove(clientId);
            }
        } else {
            logger.warn("Client {} not found in active connections", clientId);
        }
    }

    @PostMapping("/broadcast")
    public void broadcast(@RequestBody String message) {
        logger.info("Broadcasting message to all clients: {}", message);
        emitters.forEach((clientId, emitter) -> {
            try {
                emitter.send(SseEmitter.event()
                        .name("message")
                        .data(message));
                logger.info("Broadcast message sent to client: {}", clientId);
            } catch (IOException e) {
                logger.error("Error broadcasting message to client: {}", clientId, e);
                emitters.remove(clientId);
            }
        });
    }
} 