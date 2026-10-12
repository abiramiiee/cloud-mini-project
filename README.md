# CloudVault - Cloud-Based File Storage and Sharing System

A modern, full-stack cloud file storage, management, and sharing platform inspired by Google Drive, Dropbox, and Box. Built with a robust **Spring Boot 3 (Java 21)** REST backend and a responsive, high-performance web frontend.

---

## 🏛️ System Architecture

```text
cloud-file-storage/
│
├── frontend/
│   ├── index.html       # Landing page with feature showcases and architecture overview
│   ├── login.html       # Authentication interface with quick demo fill
│   ├── register.html    # Account registration with quota allocation
│   ├── dashboard.html   # Primary file explorer (grid/table view, modals, search)
│   ├── style.css        # Responsive styling with dark mode support
│   └── script.js        # Client logic with dual-mode (Spring Boot API + Offline Sandbox)
│
└── backend/
    └── cloud-storage/
        ├── pom.xml      # Maven dependencies (Spring Web, Security, JPA, JJWT, H2)
        ├── mvnw         # Unix Maven wrapper
        ├── mvnw.cmd     # Windows Maven wrapper
        └── src/
            ├── main/
            │   ├── java/
            │   │   └── com/
            │   │       └── cloudstorage/
            │   │           ├── CloudStorageApplication.java    # Application entry point & seed runner
            │   │           │
            │   │           ├── config/
            │   │           │   ├── SecurityConfig.java         # Spring Security 6 & CORS configuration
            │   │           │   ├── JwtUtils.java               # JJWT token creation & validation
            │   │           │   └── JwtAuthenticationFilter.java# Bearer token filter
            │   │           │
            │   │           ├── controller/
            │   │           │   ├── AuthController.java         # Auth REST endpoints (/api/auth)
            │   │           │   └── FileController.java         # File management endpoints (/api/files)
            │   │           │
            │   │           ├── entity/
            │   │           │   ├── User.java                   # User entity & quota tracker
            │   │           │   └── StoredFile.java             # File metadata & sharing entity
            │   │           │
            │   │           ├── repository/
            │   │           │   ├── UserRepository.java         # Spring Data JPA User repository
            │   │           │   └── StoredFileRepository.java   # JPA StoredFile repository
            │   │           │
            │   │           └── service/
            │   │               ├── AuthService.java            # Registration, login & password hashing
            │   │               └── FileStorageService.java     # Disk I/O, quotas, links & search
            │   │
            │   └── resources/
            │       └── application.properties                  # H2, JPA, file limits & JWT config
            │
            └── test/
                └── java/
                    └── com/
                        └── cloudstorage/
                            └── CloudStorageApplicationTests.java
```

---

## 🚀 Key Features

1. **Multi-File Uploads & Quota Management**:
   - Drag-and-drop or file picker multi-file uploads.
   - Enforces user storage limits (e.g. 2 GB default quota).
   - Dedicated, isolated file directory per user (`./uploads/{userId}/`).

2. **Public Shareable Links**:
   - Generates unique UUID share tokens (`/api/files/share/{token}`).
   - Anyone with the link can preview and download without logging in.
   - Instant copy-to-clipboard feedback.

3. **In-Browser File Previews**:
   - Instant rendering of Images (`.png`, `.jpg`, `.svg`).
   - Code & Text viewer with syntax styling (`.java`, `.js`, `.py`, `.json`, `.txt`).
   - PDF document viewing.

4. **Stateless JWT Security**:
   - Spring Security 6 filter chain with BCrypt password hashing.
   - Stateless session management.
   - Cross-Origin Resource Sharing (CORS) configured for frontend clients.

5. **Dual-Mode Frontend (Live API + Offline Sandbox)**:
   - When the Spring Boot server is running on `http://localhost:8080`, it communicates via live REST APIs.
   - If opened directly in a browser (e.g. double-clicking `index.html`), it automatically switches to **Sandbox Demo Mode** using `localStorage` and Blobs, ensuring an immediate out-of-the-box working experience!

---

## 🔌 REST API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Sign in and retrieve JWT Bearer token | No |
| `GET` | `/api/auth/me` | Fetch currently authenticated user profile | Yes (Bearer) |

### Files (`/api/files`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/files/upload` | Upload single or multiple files (`MultipartFile[]`) | Yes |
| `GET` | `/api/files` | List files with optional search `?q=` or filter `?filter=` | Yes |
| `GET` | `/api/files/{id}/download` | Download file with attachment header | Yes |
| `GET` | `/api/files/{id}/preview` | Stream file inline for browser preview | Yes |
| `DELETE` | `/api/files/{id}` | Permanently delete file and reclaim quota | Yes |
| `POST` | `/api/files/{id}/share` | Generate public sharing token & URL | Yes |
| `DELETE` | `/api/files/{id}/share` | Revoke public sharing token | Yes |
| `POST` | `/api/files/{id}/star` | Toggle favorite / starred status | Yes |
| `GET` | `/api/files/stats` | Retrieve total files, used bytes, and quota | Yes |
| `GET` | `/api/files/share/{token}` | Public file download by share token | No |
| `GET` | `/api/files/share/{token}/preview` | Public file inline preview by share token | No |

---

## 🏃 Getting Started

### 1. Run the Frontend
Simply open `frontend/index.html` or `frontend/dashboard.html` in any modern web browser (Google Chrome, Firefox, Microsoft Edge, Safari).
- You can also use VS Code's **Live Server** extension, or run:
  ```bash
  cd frontend
  python -m http.server 5500
  ```

### 2. Run the Spring Boot Backend
Ensure you have **Java 21** installed (`java -version`).
Navigate to the backend directory:
```bash
cd backend/cloud-storage
mvn spring-boot:run
```
*(Or import `backend/cloud-storage/pom.xml` into your favorite IDE like IntelliJ IDEA, VS Code, or Eclipse and run `CloudStorageApplication.java`.)*

### 3. Pre-Configured Test Accounts
When the backend starts up for the first time, it automatically provisions two default accounts:
- **Demo User**:
  - Username: `demo`
  - Password: `demo123`
  - Quota: 5 GB
- **Admin User**:
  - Username: `admin`
  - Password: `password123`
  - Quota: 20 GB

### 4. Database Console
- **H2 Web Console**: `http://localhost:8080/h2-console`
- **JDBC URL**: `jdbc:h2:file:./data/cloudstorage`
- **Username**: `sa`
- **Password**: *(leave blank)*
