package com.cloudstorage.controller;

import com.cloudstorage.entity.StoredFile;
import com.cloudstorage.entity.User;
import com.cloudstorage.service.AuthService;
import com.cloudstorage.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FileController {

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private AuthService authService;

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("Authentication required.");
        }
        return authService.getUserByUsername(authentication.getName());
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFiles(@RequestParam("files") MultipartFile[] files,
                                         Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            List<StoredFile> uploadedFiles = new ArrayList<>();

            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    StoredFile storedFile = fileStorageService.storeFile(file, user);
                    uploadedFiles.add(storedFile);
                }
            }

            if (uploadedFiles.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No valid files were provided for upload."));
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(uploadedFiles);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getFiles(@RequestParam(value = "q", required = false) String query,
                                      @RequestParam(value = "filter", required = false, defaultValue = "all") String filter,
                                      Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            List<StoredFile> files;

            switch (filter.toLowerCase()) {
                case "starred":
                    files = fileStorageService.getStarredFiles(user);
                    break;
                case "shared":
                    files = fileStorageService.getSharedFiles(user);
                    break;
                default:
                    files = fileStorageService.getUserFiles(user, query);
                    break;
            }

            return ResponseEntity.ok(files);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id, Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            StoredFile storedFile = fileStorageService.getFileByIdAndUser(id, user);
            Resource resource = fileStorageService.loadFileAsResource(storedFile);

            String encodedFileName = URLEncoder.encode(storedFile.getOriginalFileName(), StandardCharsets.UTF_8)
                    .replace("+", "%20");

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(storedFile.getContentType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedFileName + "\"; filename*=UTF-8''" + encodedFileName)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/preview")
    public ResponseEntity<Resource> previewFile(@PathVariable Long id, Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            StoredFile storedFile = fileStorageService.getFileByIdAndUser(id, user);
            Resource resource = fileStorageService.loadFileAsResource(storedFile);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(storedFile.getContentType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + storedFile.getOriginalFileName() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFile(@PathVariable Long id, Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            fileStorageService.deleteFile(id, user);
            return ResponseEntity.ok(Map.of("message", "File deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<?> createShareLink(@PathVariable Long id, Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            Map<String, Object> shareData = fileStorageService.generateShareLink(id, user);
            return ResponseEntity.ok(shareData);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/share")
    public ResponseEntity<?> revokeShareLink(@PathVariable Long id, Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            fileStorageService.revokeShareLink(id, user);
            return ResponseEntity.ok(Map.of("message", "Share link revoked successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/star")
    public ResponseEntity<?> toggleStar(@PathVariable Long id, Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            StoredFile updated = fileStorageService.toggleStar(id, user);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            Map<String, Object> stats = fileStorageService.getUserStorageStats(user);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Public Sharing Endpoints (No authentication needed)
    @GetMapping("/share/{token}")
    public ResponseEntity<Resource> downloadSharedFile(@PathVariable String token) {
        try {
            StoredFile storedFile = fileStorageService.getFileByShareToken(token);
            Resource resource = fileStorageService.loadFileAsResource(storedFile);

            String encodedFileName = URLEncoder.encode(storedFile.getOriginalFileName(), StandardCharsets.UTF_8)
                    .replace("+", "%20");

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(storedFile.getContentType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedFileName + "\"; filename*=UTF-8''" + encodedFileName)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/share/{token}/preview")
    public ResponseEntity<Resource> previewSharedFile(@PathVariable String token) {
        try {
            StoredFile storedFile = fileStorageService.getFileByShareToken(token);
            Resource resource = fileStorageService.loadFileAsResource(storedFile);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(storedFile.getContentType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + storedFile.getOriginalFileName() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/share/{token}/info")
    public ResponseEntity<?> getSharedFileInfo(@PathVariable String token) {
        try {
            StoredFile storedFile = fileStorageService.getFileByShareToken(token);
            Map<String, Object> info = new HashMap<>();
            info.put("fileName", storedFile.getOriginalFileName());
            info.put("size", storedFile.getSize());
            info.put("contentType", storedFile.getContentType());
            info.put("uploadedAt", storedFile.getUploadedAt());
            info.put("downloadCount", storedFile.getDownloadCount());
            return ResponseEntity.ok(info);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}
