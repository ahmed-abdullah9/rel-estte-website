// Admin Authentication
let currentUser = null;
let authToken = null;

// Check for existing session
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');
    if (token) {
        authToken = token;
        showAdminPanel();
        loadDashboardData();
    }
});

// Login functionality
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.user.role === 'admin') {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('adminToken', authToken);
            showAdminPanel();
            loadDashboardData();
        } else {
            alert('بيانات الدخول غير صحيحة أو لا تملك صلاحيات المدير');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('حدث خطأ في تسجيل الدخول');
    }
});

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    authToken = null;
    currentUser = null;
    showLoginModal();
});

// Show/hide panels
function showAdminPanel() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
}

function showLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('adminPanel').style.display = 'none';
}

// Navigation functionality
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        
        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(btn.dataset.section + '-section');
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Load section data
        switch(btn.dataset.section) {
            case 'properties':
                loadProperties();
                break;
            case 'inquiries':
                loadInquiries();
                break;
        }
    });
});

// Load dashboard data
async function loadDashboardData() {
    loadProperties();
    loadInquiries();
}

// Properties management
async function loadProperties() {
    try {
        const response = await fetch('/api/admin/properties', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const properties = await response.json();
        displayPropertiesTable(properties);
    } catch (error) {
        console.error('Error loading properties:', error);
    }
}

function displayPropertiesTable(properties) {
    const container = document.getElementById('propertiesTable');
    
    if (properties.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem;">لا توجد عقارات مضافة بعد</p>';
        return;
    }
    
    const table = `
        <table>
            <thead>
                <tr>
                    <th>العنوان</th>
                    <th>النوع</th>
                    <th>السعر</th>
                    <th>الموقع</th>
                    <th>الحالة</th>
                    <th>تاريخ الإضافة</th>
                    <th>الإجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${properties.map(property => `
                    <tr>
                        <td>${property.title}</td>
                        <td>${getPropertyTypeLabel(property.property_type)}</td>
                        <td>${Number(property.price).toLocaleString('ar-SA')} ريال</td>
                        <td>${property.location}</td>
                        <td>${getStatusLabel(property.status)}</td>
                        <td>${new Date(property.created_at).toLocaleDateString('ar-SA')}</td>
                        <td>
                            <button class="action-btn edit-btn" onclick="editProperty(${property.id})">تعديل</button>
                            <button class="action-btn delete-btn" onclick="deleteProperty(${property.id})">حذف</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = table;
}

// Property form submission
document.getElementById('propertyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });
    
    try {
        const response = await fetch('/api/admin/properties', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            alert('تم إضافة العقار بنجاح');
            document.getElementById('propertyForm').reset();
            loadProperties();
        } else {
            alert('حدث خطأ في إضافة العقار');
        }
    } catch (error) {
        console.error('Error adding property:', error);
        alert('حدث خطأ في إضافة العقار');
    }
});

// Edit property
async function editProperty(id) {
    try {
        const response = await fetch(`/api/properties/${id}`);
        const property = await response.json();
        
        // Fill form with property data
        document.getElementById('title').value = property.title;
        document.getElementById('price').value = property.price;
        document.getElementById('property_type').value = property.property_type;
        document.getElementById('status').value = property.status;
        document.getElementById('location').value = property.location;
        document.getElementById('area').value = property.area || '';
        document.getElementById('bedrooms').value = property.bedrooms || '';
        document.getElementById('bathrooms').value = property.bathrooms || '';
        document.getElementById('image_url').value = property.image_url || '';
        document.getElementById('description').value = property.description || '';
        document.getElementById('features').value = property.features || '';
        
        // Change form to edit mode
        const form = document.getElementById('propertyForm');
        form.setAttribute('data-edit-id', id);
        form.querySelector('button[type="submit"]').textContent = 'تحديث العقار';
        
        // Switch to add property tab
        document.querySelector('[data-section="add-property"]').click();
        
    } catch (error) {
        console.error('Error loading property for edit:', error);
    }
}

// Update form submission handler for edit mode
document.getElementById('propertyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const editId = e.target.getAttribute('data-edit-id');
    const formData = new FormData(e.target);
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });
    
    try {
        const url = editId ? `/api/admin/properties/${editId}` : '/api/admin/properties';
        const method = editId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            alert(editId ? 'تم تحديث العقار بنجاح' : 'تم إضافة العقار بنجاح');
            document.getElementById('propertyForm').reset();
            document.getElementById('propertyForm').removeAttribute('data-edit-id');
            document.querySelector('#propertyForm button[type="submit"]').textContent = 'حفظ العقار';
            loadProperties();
        } else {
            alert('حدث خطأ في حفظ العقار');
        }
    } catch (error) {
        console.error('Error saving property:', error);
        alert('حدث خطأ في حفظ العقار');
    }
});

// Delete property
async function deleteProperty(id) {
    if (!confirm('هل أنت متأكد من حذف هذا العقار؟')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/properties/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            alert('تم حذف العقار بنجاح');
            loadProperties();
        } else {
            alert('حدث خطأ في حذف العقار');
        }
    } catch (error) {
        console.error('Error deleting property:', error);
        alert('حدث خطأ في حذف العقار');
    }
}

// Inquiries management
async function loadInquiries() {
    try {
        const response = await fetch('/api/admin/inquiries', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const inquiries = await response.json();
        displayInquiriesTable(inquiries);
    } catch (error) {
        console.error('Error loading inquiries:', error);
    }
}

function displayInquiriesTable(inquiries) {
    const container = document.getElementById('inquiriesTable');
    
    if (inquiries.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem;">لا توجد استفسارات جديدة</p>';
        return;
    }
    
    const table = `
        <table>
            <thead>
                <tr>
                    <th>الاسم</th>
                    <th>البريد الإلكتروني</th>
                    <th>الهاتف</th>
                    <th>نوع الاستفسار</th>
                    <th>العقار</th>
                    <th>الحالة</th>
                    <th>التاريخ</th>
                    <th>الإجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${inquiries.map(inquiry => `
                    <tr>
                        <td>${inquiry.name}</td>
                        <td>${inquiry.email}</td>
                        <td>${inquiry.phone || '-'}</td>
                        <td>${inquiry.inquiry_type || '-'}</td>
                        <td>${inquiry.property_title || '-'}</td>
                        <td class="status-${inquiry.status}">${getInquiryStatusLabel(inquiry.status)}</td>
                        <td>${new Date(inquiry.created_at).toLocaleDateString('ar-SA')}</td>
                        <td>
                            <button class="action-btn status-btn" onclick="updateInquiryStatus(${inquiry.id}, '${getNextStatus(inquiry.status)}')">${getStatusActionLabel(inquiry.status)}</button>
                            <button class="action-btn edit-btn" onclick="viewInquiry(${inquiry.id}, '${inquiry.message.replace(/'/g, "\\'")}')">عرض</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = table;
}

// Update inquiry status
async function updateInquiryStatus(id, status) {
    try {
        const response = await fetch(`/api/admin/inquiries/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            alert('تم تحديث حالة الاستفسار');
            loadInquiries();
        } else {
            alert('حدث خطأ في تحديث حالة الاستفسار');
        }
    } catch (error) {
        console.error('Error updating inquiry status:', error);
    }
}

// View inquiry message
function viewInquiry(id, message) {
    alert(`رسالة الاستفسار:\n\n${message}`);
}

// Helper functions
function getPropertyTypeLabel(type) {
    const types = {
        'apartment': 'شقة',
        'villa': 'فيلا',
        'office': 'مكتب',
        'land': 'أرض'
    };
    return types[type] || type;
}

function getStatusLabel(status) {
    const statuses = {
        'for_sale': 'للبيع',
        'for_rent': 'للإيجار'
    };
    return statuses[status] || status;
}

function getInquiryStatusLabel(status) {
    const statuses = {
        'new': 'جديد',
        'in_progress': 'قيد المعالجة',
        'completed': 'مكتمل'
    };
    return statuses[status] || status;
}

function getNextStatus(status) {
    const nextStatus = {
        'new': 'in_progress',
        'in_progress': 'completed',
        'completed': 'new'
    };
    return nextStatus[status] || 'new';
}

function getStatusActionLabel(status) {
    const actions = {
        'new': 'بدء المعالجة',
        'in_progress': 'إكمال',
        'completed': 'إعادة فتح'
    };
    return actions[status] || 'تحديث';
}

// Auto-refresh inquiries every 30 seconds
setInterval(() => {
    if (authToken && document.getElementById('inquiries-section').classList.contains('active')) {
        loadInquiries();
    }
}, 30000);

// Add real-time notifications for new inquiries (if WebSocket is implemented)
function checkForNewInquiries() {
    // This would connect to WebSocket for real-time updates
    // For now, we'll use polling every 30 seconds
}

// Initialize admin panel
if (localStorage.getItem('adminToken')) {
    showAdminPanel();
    loadDashboardData();
}