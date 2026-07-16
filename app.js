// STATE & DATA MANAGEMENT
let users = JSON.parse(localStorage.getItem('wsu_users')) || [];
let reports = JSON.parse(localStorage.getItem('wsu_reports')) || [];
let chatMessages = JSON.parse(localStorage.getItem('wsu_chats')) || {};
let currentUser = JSON.parse(sessionStorage.getItem('wsu_current_user')) || null;

let selectedAdminReportId = null;
let currentChatReportId = null;
let currentStudentFilter = 'all';

// SEED MOCK DATA IF EMPTY
function seedDatabase() {
    // 1. Seed Users
    if (users.length === 0) {
        users = [
            { id: "221775706", name: "Sipho", email: "221775706@wsu.ac.za", password: "student", role: "student" },
            { id: "222574178", name: "Ayanda Ndlovu", email: "222574178@wsu.ac.za", password: "student", role: "student" },
            { id: "admin", name: "Facilities Manager", email: "admin@wsu.ac.za", password: "admin", role: "admin" }
        ];
        localStorage.setItem('wsu_users', JSON.stringify(users));
    }

    // 2. Seed Reports
    if (reports.length === 0) {
        reports = [
            {
                id: "TKT-10001",
                studentId: "221775706",
                studentName: "Sipho",
                title: "Leaking bathroom tap",
                category: "Plumbing",
                campus: "Potsdam",
                building: "New Residence",
                room: "RDF5.5",
                description: "The bathroom tap is leaking heavily, wasting clean water and making the floor slippery. It needs a new washer or full tap replacement.",
                priority: "High",
                status: "Pending",
                date: "2026-05-18",
                eta: "",
                photo: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400"
            },
            {
                id: "TKT-10002",
                studentId: "222574178",
                studentName: "Ayanda Ndlovu",
                title: "Broken window pane",
                category: "Structural",
                campus: "Potsdam",
                building: "Old Residence",
                room: "Block B Room 12",
                description: "A window pane broke during last night's heavy wind storm. Cold air and water enter the room, making it uncomfortable and unsafe.",
                priority: "High",
                status: "In Progress",
                date: "2026-05-17",
                eta: "1-2 Days",
                photo: "https://images.unsplash.com/photo-1509641498750-041477d7f1c8?auto=format&fit=crop&q=80&w=400"
            }
        ];
        localStorage.setItem('wsu_reports', JSON.stringify(reports));
    }

    // 3. Seed Chat Messages
    if (Object.keys(chatMessages).length === 0) {
        chatMessages = {
            "TKT-10002": [
                { sender: "System", senderName: "System", message: "Ticket #TKT-10002 created.", time: "2026-05-17 08:30" },
                { sender: "admin", senderName: "Facilities Manager", message: "Technician assigned. Please ensure the room is accessible tomorrow.", time: "2026-05-17 14:30" },
                { sender: "222574178", senderName: "Ayanda Ndlovu", message: "Thanks! I will be in the room all day tomorrow.", time: "2026-05-17 14:45" }
            ]
        };
        localStorage.setItem('wsu_chats', JSON.stringify(chatMessages));
    }
}

// INITIALIZATION
window.addEventListener('DOMContentLoaded', () => {
    seedDatabase();
    
    // Check if session exists
    if (currentUser) {
        if (currentUser.role === 'student') {
            navigateTo('student-dashboard');
        } else if (currentUser.role === 'admin') {
            navigateTo('admin-dashboard');
        }
    } else {
        navigateTo('welcome');
    }
    
    // Auto-initialize priority tag preview
    autoDeterminePriority();
    
    // Initialize Lucide Icons
    lucide.createIcons();
});

// NAVIGATION ENGINE
function navigateTo(screenId) {
    // Hide all screens
    const screens = document.querySelectorAll('.app-screen');
    screens.forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });

    let targetScreen = null;
    
    if (screenId === 'welcome') {
        targetScreen = document.getElementById('welcome-screen');
    } else if (screenId === 'student-login') {
        targetScreen = document.getElementById('student-login-screen');
        switchAuthTab('login');
    } else if (screenId === 'admin-login') {
        targetScreen = document.getElementById('admin-login-screen');
    } else if (screenId === 'student-dashboard') {
        targetScreen = document.getElementById('student-dashboard-screen');
        loadStudentDashboard();
    } else if (screenId === 'admin-dashboard') {
        targetScreen = document.getElementById('admin-dashboard-screen');
        loadAdminDashboard();
    }

    if (targetScreen) {
        targetScreen.style.display = 'flex';
        // Force reflow for transitions
        void targetScreen.offsetWidth;
        targetScreen.classList.add('active');
    }
    
    lucide.createIcons();
}

// SWITCH AUTH TABS (STUDENT)
function switchAuthTab(type) {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('student-login-form');
    const formRegister = document.getElementById('student-register-form');

    if (type === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        formLogin.classList.add('active-form');
        formRegister.classList.remove('active-form');
    } else {
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
        formLogin.classList.remove('active-form');
        formRegister.classList.add('active-form');
    }
}

// STUDENT LOGIN HANDLER
function handleStudentLogin(e) {
    e.preventDefault();
    const studentId = document.getElementById('login-student-id').value.trim();
    const studentPass = document.getElementById('login-student-pass').value;

    const user = users.find(u => u.id === studentId && u.role === 'student');

    if (user && user.password === studentPass) {
        sessionStorage.setItem('wsu_current_user', JSON.stringify(user));
        currentUser = user;
        showToast('Login Successful', `Welcome back, ${user.name}!`, 'success');
        navigateTo('student-dashboard');
        
        // Reset form
        document.getElementById('student-login-form').reset();
    } else {
        showToast('Login Failed', 'Invalid Student Number or Password.', 'warn');
    }
}

// STUDENT REGISTRATION HANDLER
function handleStudentRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const studentId = document.getElementById('reg-student-id').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-pass').value;

    // Check if ID already exists
    if (users.some(u => u.id === studentId)) {
        showToast('Registration Error', 'A profile with this Student Number already exists.', 'warn');
        return;
    }

    const newUser = {
        id: studentId,
        name: name,
        email: email,
        password: pass,
        role: "student"
    };

    users.push(newUser);
    localStorage.setItem('wsu_users', JSON.stringify(users));

    sessionStorage.setItem('wsu_current_user', JSON.stringify(newUser));
    currentUser = newUser;

    showToast('Registration Complete', `Profile created successfully. Welcome, ${name}!`, 'success');
    navigateTo('student-dashboard');
    
    // Reset form
    document.getElementById('student-register-form').reset();
}

// ADMIN LOGIN HANDLER
function handleAdminLogin(e) {
    e.preventDefault();
    const adminId = document.getElementById('admin-id').value.trim();
    const adminPass = document.getElementById('admin-pass').value;

    const user = users.find(u => (u.id === adminId || u.email === adminId) && u.role === 'admin');

    if (user && user.password === adminPass) {
        sessionStorage.setItem('wsu_current_user', JSON.stringify(user));
        currentUser = user;
        showToast('Administrative Access Granted', 'Authorized session opened.', 'success');
        navigateTo('admin-dashboard');
        
        // Reset form
        document.getElementById('admin-login-form').reset();
    } else {
        showToast('Access Denied', 'Invalid administrative credentials.', 'warn');
    }
}

// LOGOUT HANDLER
function logout() {
    sessionStorage.removeItem('wsu_current_user');
    currentUser = null;
    selectedAdminReportId = null;
    currentChatReportId = null;
    showToast('Logged Out', 'Your session has been securely closed.', 'info');
    navigateTo('welcome');
}

// TOAST NOTIFICATIONS
function showToast(title, message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'burgundy' ? 'toast-burgundy' : ''}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'warn') iconName = 'alert-triangle';

    toast.innerHTML = `
        <div class="toast-icon toast-${type}"><i data-lucide="${iconName}"></i></div>
        <div class="toast-body">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    container.appendChild(toast);
    lucide.createIcons();

    // Auto-remove toast
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-in forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4500);
}

// ==========================================
// STUDENT PORTAL LOGIC
// ==========================================

// Load Student Dashboard Stats & List
function loadStudentDashboard() {
    if (!currentUser) return;
    
    document.getElementById('student-name-display').textContent = currentUser.name;
    document.getElementById('student-id-display').textContent = `ID: ${currentUser.id}`;

    // Filter reports for current student
    const studentRequests = reports.filter(r => r.studentId === currentUser.id);

    // Calculate Stats
    const total = studentRequests.length;
    const pending = studentRequests.filter(r => r.status === 'Pending').length;
    const inProgress = studentRequests.filter(r => r.status === 'In Progress').length;

    // Write Stats to UI
    document.getElementById('student-stat-total').textContent = total;
    document.getElementById('student-stat-pending').textContent = pending;
    document.getElementById('student-stat-progress').textContent = inProgress;

    renderStudentRequests(studentRequests);
}

// Auto-Prioritization Selector
function autoDeterminePriority() {
    const category = document.getElementById('req-category').value;
    const preview = document.getElementById('priority-preview');
    
    if (!preview) return;

    if (!category) {
        preview.className = "priority-tag low";
        preview.textContent = "Low Priority";
        return;
    }

    // Plumbing & Electrical & Structural window issues are High priority
    if (category === 'Plumbing' || category === 'Electrical' || category === 'Structural') {
        preview.className = "priority-tag high";
        preview.textContent = "High Priority";
    } else if (category === 'Carpentry') {
        preview.className = "priority-tag medium";
        preview.textContent = "Medium Priority";
    } else {
        preview.className = "priority-tag low";
        preview.textContent = "Low Priority";
    }
}

// Image Upload Preview Handling
let selectedImageBase64 = "";

function previewSelectedImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        selectedImageBase64 = e.target.result;
        const previewImg = document.getElementById('image-upload-preview');
        const previewContainer = document.getElementById('image-upload-preview-container');
        
        previewImg.src = selectedImageBase64;
        previewContainer.classList.remove('hide');
    };
    reader.readAsDataURL(file);
}

function clearSelectedImage() {
    selectedImageBase64 = "";
    document.getElementById('req-image').value = "";
    document.getElementById('image-upload-preview-container').classList.add('hide');
    document.getElementById('image-upload-preview').src = "";
}

// Submit New Request
function handleNewRequest(e) {
    e.preventDefault();
    if (!currentUser) return;

    const campus = document.getElementById('req-campus').value;
    const category = document.getElementById('req-category').value;
    const building = document.getElementById('req-building').value.trim();
    const room = document.getElementById('req-room').value.trim();
    const title = document.getElementById('req-title').value.trim();
    const desc = document.getElementById('req-desc').value.trim();
    
    // Priority calculation
    let priority = "Low";
    if (category === 'Plumbing' || category === 'Electrical' || category === 'Structural') {
        priority = "High";
    } else if (category === 'Carpentry') {
        priority = "Medium";
    }

    const newTicketId = `TKT-${Math.floor(10000 + Math.random() * 90000)}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const newTicket = {
        id: newTicketId,
        studentId: currentUser.id,
        studentName: currentUser.name,
        title: title,
        category: category,
        campus: campus,
        building: building,
        room: room,
        description: desc,
        priority: priority,
        status: "Pending",
        date: todayStr,
        eta: "",
        photo: selectedImageBase64 || "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=400" // Fallback mock image
    };

    reports.push(newTicket);
    localStorage.setItem('wsu_reports', JSON.stringify(reports));

    // Seed empty chat for this ticket
    chatMessages[newTicketId] = [
        { sender: "System", senderName: "System", message: `Ticket #${newTicketId} created. Status: Pending.`, time: todayStr + " " + new Date().toTimeString().slice(0,5) }
    ];
    localStorage.setItem('wsu_chats', JSON.stringify(chatMessages));

    showToast('Report Submitted', `Ticket ${newTicketId} successfully registered.`, 'success');
    
    // Reset form
    document.getElementById('new-request-form').reset();
    clearSelectedImage();
    autoDeterminePriority();

    // Reload Dashboard list
    loadStudentDashboard();
    
    // Simulated administrative receipt auto-response after 4 seconds
    setTimeout(() => {
        simulateAdminAutoAcknowledgement(newTicketId);
    }, 4000);
}

function simulateAdminAutoAcknowledgement(ticketId) {
    if (!chatMessages[ticketId]) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().slice(0,5);

    chatMessages[ticketId].push({
        sender: "admin",
        senderName: "Facilities Manager",
        message: "Thank you for reporting this issue. A maintenance coordinator will review your request shortly to assign a technician.",
        time: todayStr + " " + timeStr
    });
    localStorage.setItem('wsu_chats', JSON.stringify(chatMessages));

    // Trigger notification toast if the student is still logged in and viewing the dashboard
    if (currentUser && currentUser.role === 'student') {
        showToast('Message Received', `New update on ticket #${ticketId}`, 'burgundy');
        loadStudentDashboard();
    }
}

// Filter Student Requests
function filterStudentRequests(filter) {
    currentStudentFilter = filter;
    
    // UI active chips
    const chips = document.querySelectorAll('.list-filters .filter-chip');
    chips.forEach(c => c.classList.remove('active'));
    
    event.target.classList.add('active');

    const studentRequests = reports.filter(r => r.studentId === currentUser.id);
    
    if (filter === 'all') {
        renderStudentRequests(studentRequests);
    } else {
        renderStudentRequests(studentRequests.filter(r => r.status === filter));
    }
}

// Render Student Cards
function renderStudentRequests(requests) {
    const listContainer = document.getElementById('student-requests-list');
    listContainer.innerHTML = '';

    if (requests.length === 0) {
        listContainer.innerHTML = `
            <div class="no-records">
                <i data-lucide="inbox"></i>
                <p>No matching maintenance tickets found.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    // Display newest first
    requests.slice().reverse().forEach(ticket => {
        const card = document.createElement('div');
        card.className = 'ticket-card';
        
        let priorityClass = ticket.priority.toLowerCase();
        let statusClass = 'pending';
        if (ticket.status === 'In Progress') statusClass = 'progress';
        if (ticket.status === 'Completed') statusClass = 'completed';

        card.innerHTML = `
            <div class="ticket-card-header">
                <div class="ticket-info">
                    <span class="ticket-id">${ticket.id}</span>
                    <h4>${ticket.title}</h4>
                </div>
                <span class="status-badge ${statusClass}">${ticket.status}</span>
            </div>
            
            <div class="ticket-details-summary">
                <span><i data-lucide="map-pin"></i> ${ticket.campus} - ${ticket.building} (${ticket.room})</span>
                <span><i data-lucide="tag"></i> ${ticket.category}</span>
                <span><i data-lucide="calendar"></i> ${ticket.date}</span>
                ${ticket.eta ? `<span><i data-lucide="clock"></i> ETA: ${ticket.eta}</span>` : ''}
            </div>

            <div class="ticket-card-footer">
                <div class="badges-row">
                    <span class="priority-tag ${priorityClass}">${ticket.priority} Urgency</span>
                </div>
                <button class="open-chat-btn" onclick="openChat('${ticket.id}')">
                    <i data-lucide="message-square"></i> Chat Bridge
                </button>
            </div>
        `;
        
        listContainer.appendChild(card);
    });
    
    lucide.createIcons();
}

// ==========================================
// ADMINISTRATIVE PORTAL LOGIC
// ==========================================

let adminSortField = 'id';
let adminSortAsc = false;

// Load Admin Dashboard Stats, Tables
function loadAdminDashboard() {
    // 1. Calculate General stats
    const total = reports.length;
    const pending = reports.filter(r => r.status === 'Pending').length;
    const inProgress = reports.filter(r => r.status === 'In Progress').length;
    const completed = reports.filter(r => r.status === 'Completed').length;

    // Update stats elements
    document.getElementById('admin-stat-total').textContent = total;
    document.getElementById('admin-stat-pending').textContent = pending;
    document.getElementById('admin-stat-progress').textContent = inProgress;
    document.getElementById('admin-stat-completed').textContent = completed;

    filterAdminRequests();
}

// Apply searches and filters to admin table
function filterAdminRequests() {
    const searchQuery = document.getElementById('admin-search').value.toLowerCase().trim();
    const filterCampus = document.getElementById('admin-filter-campus').value;
    const filterCategory = document.getElementById('admin-filter-category').value;
    const filterStatus = document.getElementById('admin-filter-status').value;

    let filteredReports = reports.slice();

    // 1. Apply Campus Filter
    if (filterCampus !== 'all') {
        filteredReports = filteredReports.filter(r => r.campus === filterCampus);
    }

    // 2. Apply Category Filter
    if (filterCategory !== 'all') {
        filteredReports = filteredReports.filter(r => r.category === filterCategory);
    }

    // 3. Apply Status Filter
    if (filterStatus !== 'all') {
        filteredReports = filteredReports.filter(r => r.status === filterStatus);
    }

    // 4. Apply Search Input
    if (searchQuery) {
        filteredReports = filteredReports.filter(r => 
            r.id.toLowerCase().includes(searchQuery) ||
            r.studentName.toLowerCase().includes(searchQuery) ||
            r.studentId.toLowerCase().includes(searchQuery) ||
            r.building.toLowerCase().includes(searchQuery) ||
            r.room.toLowerCase().includes(searchQuery) ||
            r.title.toLowerCase().includes(searchQuery) ||
            r.description.toLowerCase().includes(searchQuery)
        );
    }

    // 5. Apply Sorting
    sortData(filteredReports);

    renderAdminTable(filteredReports);
}

// Sort field handler
function sortAdminRequests(field) {
    if (adminSortField === field) {
        adminSortAsc = !adminSortAsc; // Toggle direction
    } else {
        adminSortField = field;
        adminSortAsc = true;
    }
    filterAdminRequests();
}

// Perform data sorting logic
function sortData(dataArray) {
    dataArray.sort((a, b) => {
        let valA = a[adminSortField];
        let valB = b[adminSortField];

        // Custom prioritization mapping for correct sorting
        if (adminSortField === 'priority') {
            const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
            valA = priorityWeight[a.priority] || 0;
            valB = priorityWeight[b.priority] || 0;
        }

        if (valA < valB) return adminSortAsc ? -1 : 1;
        if (valA > valB) return adminSortAsc ? 1 : -1;
        return 0;
    });
}

// Render Admin Table Rows
function renderAdminTable(reportsList) {
    const tableBody = document.getElementById('admin-requests-table-body');
    tableBody.innerHTML = '';

    if (reportsList.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center" style="padding: 40px; text-align: center; color: var(--text-muted);">
                    <i data-lucide="search-code" style="width: 32px; height: 32px; display: block; margin: 0 auto 10px auto; opacity: 0.5;"></i>
                    No matching maintenance tickets found.
                </td>
            </tr>
        `;
        lucide.createIcons();
        return;
    }

    reportsList.forEach(ticket => {
        const row = document.createElement('tr');
        if (selectedAdminReportId === ticket.id) {
            row.className = 'selected';
        }
        
        let priorityClass = ticket.priority.toLowerCase();
        let statusClass = 'pending';
        if (ticket.status === 'In Progress') statusClass = 'progress';
        if (ticket.status === 'Completed') statusClass = 'completed';

        row.innerHTML = `
            <td class="ticket-id-cell">${ticket.id}</td>
            <td>${ticket.date}</td>
            <td class="student-cell">${ticket.studentName} <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">${ticket.studentId}</span></td>
            <td>${ticket.category}</td>
            <td>${ticket.campus} <span style="font-size: 0.75rem; color: var(--text-secondary); display: block;">${ticket.building} - Rm ${ticket.room}</span></td>
            <td><span class="priority-tag ${priorityClass}">${ticket.priority}</span></td>
            <td><span class="status-badge ${statusClass}">${ticket.status}</span></td>
            <td>
                <button class="action-row-btn" onclick="selectRequest('${ticket.id}')">Triage</button>
            </td>
        `;
        
        row.addEventListener('click', (e) => {
            // Prevent triggering if clicked button
            if (e.target.tagName !== 'BUTTON') {
                selectRequest(ticket.id);
            }
        });

        tableBody.appendChild(row);
    });

    lucide.createIcons();
}

// Select a request to view details
function selectRequest(ticketId) {
    selectedAdminReportId = ticketId;
    
    // Highlight row
    const rows = document.querySelectorAll('.admin-table tbody tr');
    // Reload table rows to reapply selection class
    filterAdminRequests();

    const ticket = reports.find(r => r.id === ticketId);
    if (!ticket) return;

    // Show details card
    document.getElementById('admin-no-selection').classList.add('hide');
    const detailCard = document.getElementById('admin-detail-card');
    detailCard.classList.remove('hide');

    // Fill details
    document.getElementById('detail-id').textContent = ticket.id;
    document.getElementById('detail-title').textContent = ticket.title;
    document.getElementById('detail-campus').textContent = ticket.campus;
    document.getElementById('detail-location').textContent = `${ticket.building}, Room ${ticket.room}`;
    document.getElementById('detail-student').textContent = `${ticket.studentName} (ID: ${ticket.studentId})`;
    
    const priorityTag = document.getElementById('detail-priority');
    priorityTag.textContent = `${ticket.priority} Urgency`;
    priorityTag.className = `priority-tag ${ticket.priority.toLowerCase()}`;

    document.getElementById('detail-desc').textContent = ticket.description;

    // Set selectors
    document.getElementById('detail-status-select').value = ticket.status;
    document.getElementById('detail-eta-select').value = ticket.eta;

    // Photo
    const photoContainer = document.getElementById('detail-photo-container');
    if (ticket.photo) {
        document.getElementById('detail-photo').src = ticket.photo;
        photoContainer.classList.remove('hide');
    } else {
        photoContainer.classList.add('hide');
    }

    // Set chat bridge action
    const chatHeaderBtn = document.querySelector('.chat-bridge-header');
    chatHeaderBtn.onclick = () => openChat(ticket.id);
}

// Deselect request details view
function deselectRequest() {
    selectedAdminReportId = null;
    document.getElementById('admin-detail-card').classList.add('hide');
    document.getElementById('admin-no-selection').classList.remove('hide');
    
    // Reload table highlights
    filterAdminRequests();
}

// Update Status from Admin detail
function updateSelectedRequestStatus(status) {
    if (!selectedAdminReportId) return;

    const ticket = reports.find(r => r.id === selectedAdminReportId);
    if (ticket) {
        const oldStatus = ticket.status;
        ticket.status = status;
        localStorage.setItem('wsu_reports', JSON.stringify(reports));
        
        // Add log message to chat
        const todayStr = new Date().toISOString().split('T')[0];
        const timeStr = new Date().toTimeString().slice(0,5);
        
        chatMessages[ticket.id].push({
            sender: "System",
            senderName: "System",
            message: `Ticket status updated from ${oldStatus} to ${status}.`,
            time: todayStr + " " + timeStr
        });
        localStorage.setItem('wsu_chats', JSON.stringify(chatMessages));

        showToast('Ticket Updated', `Status of ticket ${ticket.id} is now ${status}.`, 'success');
        
        // Reload dashboard
        loadAdminDashboard();
    }
}

// Update ETA from Admin detail
function updateSelectedRequestETA(eta) {
    if (!selectedAdminReportId) return;

    const ticket = reports.find(r => r.id === selectedAdminReportId);
    if (ticket) {
        ticket.eta = eta;
        localStorage.setItem('wsu_reports', JSON.stringify(reports));

        // Add log message to chat
        const todayStr = new Date().toISOString().split('T')[0];
        const timeStr = new Date().toTimeString().slice(0,5);
        
        chatMessages[ticket.id].push({
            sender: "System",
            senderName: "System",
            message: eta ? `ETA set for repair: ${eta}.` : "ETA cleared for repair.",
            time: todayStr + " " + timeStr
        });
        localStorage.setItem('wsu_chats', JSON.stringify(chatMessages));

        showToast('ETA Assigned', `ETA set to ${eta || 'None'}.`, 'info');
        
        // Reload dashboard
        loadAdminDashboard();
    }
}

// Term Clean-up: Archive/Delete completed reports
function archiveCompletedReports() {
    const completedCount = reports.filter(r => r.status === 'Completed').length;
    
    if (completedCount === 0) {
        showToast('Clean-up Terminated', 'There are no completed tickets to archive.', 'warn');
        return;
    }

    if (confirm(`Are you sure you want to archive and clear all ${completedCount} completed maintenance reports from the database? This keeps the database fast for the next semester.`)) {
        reports = reports.filter(r => r.status !== 'Completed');
        localStorage.setItem('wsu_reports', JSON.stringify(reports));
        
        deselectRequest();
        loadAdminDashboard();
        showToast('Term Clean-up Done', `Successfully archived ${completedCount} completed reports.`, 'success');
    }
}

// ==========================================
// COMMUNICATION BRIDGE CHAT LOGIC
// ==========================================

function openChat(ticketId) {
    currentChatReportId = ticketId;
    const ticket = reports.find(r => r.id === ticketId);
    if (!ticket) return;

    document.getElementById('chat-ticket-id').textContent = ticket.id;
    document.getElementById('chat-ticket-title').textContent = `${ticket.title} - ${ticket.category}`;
    document.getElementById('chat-ticket-location').textContent = `${ticket.campus}, ${ticket.building} Rm ${ticket.room}`;

    document.getElementById('chat-modal').classList.add('active');
    
    renderChatMessages();
}

function closeChat() {
    currentChatReportId = null;
    document.getElementById('chat-modal').classList.remove('active');
}

function renderChatMessages() {
    const chatContainer = document.getElementById('chat-messages');
    chatContainer.innerHTML = '';

    if (!currentChatReportId) return;

    const messages = chatMessages[currentChatReportId] || [];

    if (messages.length === 0) {
        chatContainer.innerHTML = `
            <div class="text-center" style="color: var(--text-muted); padding: 40px 0; text-align: center;">
                No messages. Start the conversation with Facilities Maintenance.
            </div>
        `;
        return;
    }

    messages.forEach(msg => {
        if (msg.sender === 'System') {
            const systemLog = document.createElement('div');
            systemLog.style.textAlign = 'center';
            systemLog.style.fontSize = '0.75rem';
            systemLog.style.color = 'var(--text-muted)';
            systemLog.style.margin = '5px 0';
            systemLog.style.fontStyle = 'italic';
            systemLog.textContent = `[${msg.time.split(' ')[1] || msg.time}] ${msg.message}`;
            chatContainer.appendChild(systemLog);
            return;
        }

        const isMe = msg.sender === currentUser.id;
        
        const wrapper = document.createElement('div');
        wrapper.className = `msg-wrapper ${isMe ? 'sent' : 'received'}`;

        wrapper.innerHTML = `
            <span class="msg-sender">${isMe ? 'Me' : msg.senderName}</span>
            <div class="msg-bubble">${msg.message}</div>
            <span class="msg-time">${msg.time.split(' ')[1] || msg.time}</span>
        `;
        
        chatContainer.appendChild(wrapper);
    });

    // Auto-scroll chat body
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Send chat message
function handleSendChatMessage(e) {
    e.preventDefault();
    if (!currentUser || !currentChatReportId) return;

    const input = document.getElementById('chat-input-text');
    const msgText = input.value.trim();
    if (!msgText) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().slice(0,5);

    const newMsg = {
        sender: currentUser.id,
        senderName: currentUser.name,
        message: msgText,
        time: todayStr + " " + timeStr
    };

    if (!chatMessages[currentChatReportId]) {
        chatMessages[currentChatReportId] = [];
    }

    chatMessages[currentChatReportId].push(newMsg);
    localStorage.setItem('wsu_chats', JSON.stringify(chatMessages));

    input.value = '';
    renderChatMessages();

    // If student sent, schedule automatic technician status simulation responses
    if (currentUser.role === 'student') {
        // Mock response from Maintenance Team after 3.5 seconds
        setTimeout(() => {
            simulateAdminReply(currentChatReportId, msgText);
        }, 3500);
    }
}

// Automated conversational responder to make student DM feel alive
function simulateAdminReply(ticketId, studentMsg) {
    // Check if the chat is still open/active and if user is student
    if (!chatMessages[ticketId]) return;

    let responseText = "We have received your message regarding this issue. A maintenance coordinator has been updated.";
    
    // Simple keyword parser for conversational interactivity
    const msg = studentMsg.toLowerCase();
    if (msg.includes('when') || msg.includes('time') || msg.includes('long') || msg.includes('hour') || msg.includes('eta')) {
        responseText = "We are currently checking availability. A technician will update the ticket ETA shortly. Keep checking your dashboard notifications.";
    } else if (msg.includes('water') || msg.includes('leak') || msg.includes('flood') || msg.includes('pipe')) {
        responseText = "Understood. Because this is a plumbing emergency, a technician has been dispatched for urgent repair. Please stand by.";
    } else if (msg.includes('hello') || msg.includes('hi') || msg.includes('morning') || msg.includes('afternoon')) {
        responseText = "Hello! WSU Facilities Maintenance here. How can we assist you with this reported ticket?";
    } else if (msg.includes('thank') || msg.includes('thanks') || msg.includes('ok') || msg.includes('cool')) {
        responseText = "You're welcome! Let us know if anything else breaks in the meantime.";
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().slice(0,5);

    chatMessages[ticketId].push({
        sender: "admin",
        senderName: "Facilities Manager",
        message: responseText,
        time: todayStr + " " + timeStr
    });
    localStorage.setItem('wsu_chats', JSON.stringify(chatMessages));

    // If the student has this chat open right now, refresh messages
    if (currentChatReportId === ticketId) {
        renderChatMessages();
    } else if (currentUser && currentUser.role === 'student') {
        // If chat closed, display a toast message notification
        showToast('Facilities Response', `Update on ticket #${ticketId}: "${responseText.slice(0, 45)}..."`, 'burgundy');
        loadStudentDashboard();
    }
}
