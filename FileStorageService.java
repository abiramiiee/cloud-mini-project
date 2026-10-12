package com.cloudstorage.service;

import com.cloudstorage.entity.StoredFile;
import com.cloudstorage.entity.User;
import com.cloudstorage.repository.StoredFileRepository;
import com.cloudstorage.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.*;

@Service
public class FileStorageService {

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    @Autowired
    private StoredFileRepository storedFileRepository;

    @Autowired
    private UserRepository userRepository;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        try {
            this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(this.rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize file storage directory!", e);
        }
    }

    @Transactional
    public StoredFile storeFile(MultipartFile file, User user) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload an empty file.");
        }

        String rawFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        if (rawFileName.contains("..")) {
            throw new IllegalArgumentException("Filename contains invalid path sequence: " + rawFileName);
        }

        long fileSize = file.getSize();
        if (!user.canStore(fileSize)) {
            throw new IllegalStateException("Storage quota exceeded! Maximum quota: " +
                    (user.getStorageLimitBytes() / (1024 * 1024)) + " MB.");
        }

        try {
            // User-isolated directory
            Path userDir = this.rootLocation.resolve(String.valueOf(user.getId()));
            Files.createDirectories(userDir);

            // Generate unique disk filename
            String storedFileName = UUID.randomUUID().toString() + "_" + rawFileName;
            Path destinationFile = userDir.resolve(storedFileName).normalize();

            // Save file content
            Files.copy(file.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);

            String contentType = file.getContentType();
            if (contentType == null || contentType.isBlank()) {
                contentType = "application/octet-stream";
            }

            StoredFile storedFile = new StoredFile(
                    rawFileName,
                    storedFileName,
                    contentType,
                    fileSize,
                    destinationFile.toString(),
                    user
            );

            StoredFile saved = storedFileRepository.save(storedFile);

            // Update user quota
            user.addStorage(fileSize);
            userRepository.save(user);

            return saved;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file " + rawFileName, e);
        }
    }

    public List<StoredFile> getUserFiles(User user, String searchQuery) {
        if (searchQuery != null && !searchQuery.trim().isEmpty()) {
            return storedFileRepository.findByOwnerAndOriginalFileNameContainingIgnoreCaseOrderByUploadedAtDesc(
                    user, searchQuery.trim()
            );
        }
        return storedFileRepository.findByOwnerOrderByUploadedAtDesc(user);
    }

    public List<StoredFile> getStarredFiles(User user) {
        return storedFileRepository.findByOwnerAndIsStarredTrueOrderByUploadedAtDesc(user);
    }

    public List<StoredFile> getSharedFiles(User user) {
        return storedFileRepository.findByOwnerAndIsPublicTrueOrderByUploadedAtDesc(user);
    }

    public StoredFile getFileByIdAndUser(Long fileId, User user) {
        return storedFileRepository.findByIdAndOwner(fileId, user)
                .orElseThrow(() -> new NoSuchElementException("File not found with ID: " + fileId));
    }

    public Resource loadFileAsResource(StoredFile storedFile) {
        try {
            Path filePath = Paths.get(storedFile.getStoragePath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Could not read file: " + storedFile.getOriginalFileName());
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Error reading file path: " + storedFile.getOriginalFileName(), e);
        }
    }

    @Transactional
    public void deleteFile(Long fileId, User user) {
        StoredFile storedFile = getFileByIdAndUser(fileId, user);

        try {
            Path filePath = Paths.get(storedFile.getStoragePath());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // Log and proceed with DB deletion
            System.err.println("Could not delete physical file: " + storedFile.getStoragePath());
        }

        long size = storedFile.getSize();
        storedFileRepository.delete(storedFile);

        user.releaseStorage(size);
        userRepository.save(user);
    }

    @Transactional
    public Map<String, Object> generateShareLink(Long fileId, User user) {
        StoredFile storedFile = getFileByIdAndUser(fileId, user);

        if (storedFile.getShareToken() == null || storedFile.getShareToken().isBlank()) {
            storedFile.setShareToken(UUID.randomUUID().toString().replace("-", ""));
        }
        storedFile.setPublic(true);
        storedFileRepository.save(storedFile);

        String shareUrl = baseUrl + "/api/files/share/" + storedFile.getShareToken();
        Map<String, Object> response = new HashMap<>();
        response.put("fileId", storedFile.getId());
        response.put("fileName", storedFile.getOriginalFileName());
        response.put("shareToken", storedFile.getShareToken());
        response.put("shareUrl", shareUrl);
        response.put("isPublic", true);
        return response;
    }

    @Transactional
    public void revokeShareLink(Long fileId, User user) {
        StoredFile storedFile = getFileByIdAndUser(fileId, user);
        storedFile.setPublic(false);
        storedFile.setShareToken(null);
        storedFileRepository.save(storedFile);
    }

    @Transactional
    public StoredFile toggleStar(Long fileId, User user) {
        StoredFile storedFile = getFileByIdAndUser(fileId, user);
        storedFile.setStarred(!storedFile.isStarred());
        return storedFileRepository.save(storedFile);
    }

    @Transactional
    public StoredFile getFileByShareToken(String shareToken) {
        StoredFile storedFile = storedFileRepository.findByShareToken(shareToken)
                .orElseThrow(() -> new NoSuchElementException("File not found or invalid share link."));

        if (!storedFile.isPublic()) {
            throw new IllegalStateException("This shared link has been revoked by the owner.");
        }

        storedFile.incrementDownloadCount();
        return storedFileRepository.save(storedFile);
    }

    public Map<String, Object> getUserStorageStats(User user) {
        long count = storedFileRepository.countByOwner(user);
        long usedBytes = user.getStorageUsedBytes();
        long limitBytes = user.getStorageLimitBytes();
        double percentage = limitBytes > 0 ? ((double) usedBytes / limitBytes) * 100 : 0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalFiles", count);
        stats.put("usedBytes", usedBytes);
        stats.put("limitBytes", limitBytes);
        stats.put("usedPercentage", Math.round(percentage * 10.0) / 10.0);
        return stats;
    }
}
