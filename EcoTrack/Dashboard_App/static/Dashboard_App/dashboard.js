// Modal functionality
const openModalBtn = document.getElementById('openModal');
const modal = document.getElementById('trackingModal');
const closeModalBtn = document.querySelector('.close-modal');
const categorySelect = document.getElementById('category');
const userProfile = document.getElementById('userProfile');
const profileMenu = document.getElementById('profileMenu');
const notification = document.getElementById('notification');

// Show modal
openModalBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
});

// Hide modal
closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Hide modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Toggle profile menu
userProfile.addEventListener('click', () => {
    profileMenu.classList.toggle('active');
});

// Close profile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!userProfile.contains(e.target)) {
        profileMenu.classList.remove('active');
    }
});

// Show/hide form fields based on category selection
categorySelect.addEventListener('change', () => {
    // Hide all field groups
    document.getElementById('transportFields').style.display = 'none';
    document.getElementById('dietFields').style.display = 'none';
    document.getElementById('energyFields').style.display = 'none';
    
    // Show the relevant field group
    if (categorySelect.value === 'transport') {
        document.getElementById('transportFields').style.display = 'block';
    } else if (categorySelect.value === 'diet') {
        document.getElementById('dietFields').style.display = 'block';
    } else if (categorySelect.value === 'energy') {
        document.getElementById('energyFields').style.display = 'block';
    }
});

// Form submission
document.getElementById('trackingForm').addEventListener('submit', (e) => {
    e.preventDefault();
    // In a real app, you would process the form data here
    
    // Show notification
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
    
    modal.style.display = 'none';
    // Reset form
    document.getElementById('trackingForm').reset();
    // Hide all field groups
    document.getElementById('transportFields').style.display = 'none';
    document.getElementById('dietFields').style.display = 'none';
    document.getElementById('energyFields').style.display = 'none';
});

// Initialize Chart.js
document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('carbonChart').getContext('2d');
    const carbonChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Transport', 'Food', 'Energy'],
            datasets: [{
                data: [45, 30, 25],
                backgroundColor: [
                    '#4CAF50',
                    '#81C784',
                    '#C8E6C9'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            },
            cutout: '70%'
        }
    });
});