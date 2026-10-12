package com.cloudstorage.repository;

import com.cloudstorage.entity.StoredFile;
import com.cloudstorage.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoredFileRepository extends JpaRepository<StoredFile, Long> {

    List<StoredFile> findByOwnerOrderByUploadedAtDesc(User owner);

    List<StoredFile> findByOwnerAndOriginalFileNameContainingIgnoreCaseOrderByUploadedAtDesc(User owner, String query);

    List<StoredFile> findByOwnerAndIsStarredTrueOrderByUploadedAtDesc(User owner);

    List<StoredFile> findByOwnerAndIsPublicTrueOrderByUploadedAtDesc(User owner);

    Optional<StoredFile> findByIdAndOwner(Long id, User owner);

    Optional<StoredFile> findByShareToken(String shareToken);

    long countByOwner(User owner);
}
