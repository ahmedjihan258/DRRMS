# Disaster Risk & Resource Management System (DRRMS) - Project Report

## 1. Project Title
**Disaster Risk & Resource Management System (DRRMS)**

## 2. Team Information
*   **Member 1 Name:** [Name] - [ID]
*   **Member 2 Name:** [Name] - [ID]
*   **Member 3 Name:** [Name] - [ID]
*   *(Fill in your team details here)*

## 3. Links
*   **Video Demonstration:** [Insert YouTube Link]
*   **GitHub Repository:** [Insert GitHub Link]

---

## 4. Introduction / Overview
The **Disaster Risk & Resource Management System (DRRMS)** is a comprehensive web-based platform designed to streamline the coordination of disaster relief efforts. It serves as a centralized hub for managing incidents, resources (stock & warehouses), shelters, and volunteer workforces. The system connects multiple stakeholders—Admins, Authorities, Dispatchers, Volunteers, and Citizens—providing them with real-time tools to report incidents, track relief supplies, and manage evacuation centers efficiently.

**Key Objectives:**
*   Minimize response times during disasters.
*   Ensure accurate tracking of relief inventory across multiple warehouses.
*   Facilitate efficient volunteer deployment based on skills and location.
*   Provide real-time situational awareness through interactive maps.

## 5. Motivation
Disaster management in many regions still relies on fragmented communication channels (phone calls, spreadsheets) which lead to data silos, delayed responses, and resource misallocation. We chose this project to solve the critical "logistics" problem of disaster relief. By digitizing the workflow, we can ensure that the right resources reach the right people at the right time, potentially saving lives and reducing economic loss.

## 6. Related or Similar Projects
*   **Sahana Eden:** An open-source disaster management platform. While powerful, it is often complex to set up. DRRMS focuses on a streamlined, user-friendly UI for immediate local deployment.
*   **Google Crisis Response:** Provides maps and alerts but lacks the specific *resource inventory* and *volunteer assignment* granulatrity that local authorities need.

## 7. Benchmark Analysis
| Feature | Traditional/Manual Systems | Existing Generic Tools | **DRRMS (Our Solution)** |
| :--- | :--- | :--- | :--- |
| **Real-time Inventory** | No (Spreadsheets) | Yes (ERP) | **Yes (Multi-Warehouse)** |
| **Volunteer Tracking** | Phone/SMS | Social Media | **Skill & Availability Based** |
| **Access Control** | None | Basic | **Role-Based (5 Levels)** |
| **User Interface** | N/A | Generic/Cluttered | **Modern, Responsive (React)** |

## 8. Complete Feature List
1.  **Authentication & Security**: Secure JWT-based login with hashed passwords and role-based protection (Admin, Authority, Dispatcher, Volunteer, Citizen).
2.  **Incident Management**:
    *   Report new incidents with geolocation.
    *   Track status (Reported, In Progress, Resolved).
    *   View incidents on an interactive map.
3.  **Resource & Warehouse Management**:
    *   **Multi-Warehouse Support**: Create and manage multiple storage locations.
    *   **Inventory Tracking**: Live tracking of stock levels (Food, Water, Medical) per warehouse.
    *   **Normalization**: resources are linked to specific warehouses via ID.
4.  **Shelter Management**:
    *   Track evacuation center capacity and current occupancy.
    *   Log residents in/out.
5.  **Volunteer Coordination**:
    *   Volunteer profiles with specific skill sets (First Aid, Rescue, etc.).
    *   Availability status toggling.
    *   Task assignment by Dispatchers.
6.  **Notifications**: Real-time in-app alerts for system updates or emergencies.

## 9. Database Design Approach
We utilized a **Relational Database Management System (RDBMS)** using MySQL. The design follows **Normalization** principles (up to 3NF) to reduce redundancy and ensure data integrity.
*   **Separation of Concerns**: Users are separated from their Roles/Profiles (Volunteers).
*   **Inventory Normalization**: Instead of storing location strings in the stock table, we implemented a `warehouses` table, linking stocks via `warehouse_id`.
*   **Constraint Enforcement**: Foreign keys enforce referential integrity (e.g., you cannot delete a warehouse that still contains stock).

## 10. Entity-Relationship Diagram (ERD) Overview
*(You can use a tool like draw.io to draw this based on the schema below)*
*   **Users** (1) ---- (M) **Incidents** (Reported By)
*   **Users** (1) ---- (1) **Volunteers**
*   **Resources** (1) ---- (M) **Resource_Stocks**
*   **Warehouses** (1) ---- (M) **Resource_Stocks**
*   **Resource_Stocks** (1) ---- (M) **Resource_Deployments**
*   **Incidents** (1) ---- (M) **Resource_Deployments**
*   **Incidents** (1) ---- (M) **Assignments** (Volunteer Assignments)

## 11. Schema Diagram
**Key Tables:**
*   `users`: `id (PK), user_name, email, password, role`
*   `warehouses`: `id (PK), name`
*   `resources`: `id (PK), resource_name, unit, type`
*   `resource_stocks`: `id (PK), resource_id (FK), warehouse_id (FK), quantity`
*   `incidents`: `id (PK), title, disaster_type, status, latitude, longitude`
*   `shelters`: `id (PK), name, capacity, occupancy`

## 12. Queries for Feature Implementation
**A. Inventory with Warehouse Location:**
```sql
SELECT rs.id, r.resource_name, rs.quantity, w.name as warehouse_location
FROM resource_stocks rs
JOIN resources r ON rs.resource_id = r.id
JOIN warehouses w ON rs.warehouse_id = w.id
ORDER BY w.name;
```

**B. Available Volunteers with Skills:**
```sql
SELECT v.id, u.user_name, v.skills
FROM volunteers v
JOIN users u ON v.user_id = u.id
WHERE v.availability = 'AVAILABLE';
```

**C. Warehouse Safety Check (Before Delete):**
```sql
SELECT COUNT(*) FROM resource_stocks WHERE warehouse_id = ?;
```

## 13. Limitations
*   **Offline Mode**: The system currently requires active internet connection; no offline syncing for remote areas yet.
*   **Real-time Push**: Notifications are currently polled; WebSockets are not yet implemented for instant push.

## 14. Future Work
*   **Mobile App**: Develop a dedicated React Native app for field volunteers.
*   **AI Analytics**: Predict resource needs based on incident type and severity.
*   **Offline Sync**: Implement PWA capabilities for low-connectivity usage.

## 15. Conclusion
The DRRMS project successfully digitizes the chaos of disaster management. By implementing a robust database schema and a modern frontend, we have created a tool that provides clarity and control to authorities while empowering volunteers. The system is scalable and ready for future extensions.
