// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const activitySelection = document.getElementById('activitySelection');
  const activityForms = document.querySelector('.activity-forms');
  const selectionColumns = document.querySelectorAll('.selection-column');
  const backButtons = document.querySelectorAll('.back-to-selection');
  const cancelButtons = document.querySelectorAll('.cancel-btn');
  const addActivityButtons = document.querySelectorAll('.add-activity');
  
  // Show activity form when column is clicked
  selectionColumns.forEach(column => {
    column.addEventListener('click', function(e) {
      // Don't trigger if the click was on the button (handled separately)
      if (e.target.classList.contains('select-category-btn')) return;
      
      const category = this.getAttribute('data-category');
      showActivityForm(category);
    });
    
    // Also handle button clicks
    const button = column.querySelector('.select-category-btn');
    button.addEventListener('click', function(e) {
      e.stopPropagation();
      const category = column.getAttribute('data-category');
      showActivityForm(category);
    });
  });
  
  // Back to selection functionality
  backButtons.forEach(button => {
    button.addEventListener('click', showActivitySelection);
  });
  
  cancelButtons.forEach(button => {
    button.addEventListener('click', showActivitySelection);
  });
  
  // Add activity functionality
  addActivityButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const category = this.getAttribute('data-category');
      addActivity(category);
    });
  });
  
  // Real-time impact calculation
  setupImpactCalculators();
  
  // User profile dropdown
  const userProfile = document.getElementById('userProfile');
  const profileMenu = document.getElementById('profileMenu');
  
  if (userProfile && profileMenu) {
    userProfile.addEventListener('click', function() {
      profileMenu.classList.toggle('active');
    });
    
    // Close dropdown when clicking elsewhere
    document.addEventListener('click', function(e) {
      if (!userProfile.contains(e.target)) {
        profileMenu.classList.remove('active');
      }
    });
  }

  // If the user is already authenticated, try to sync any pending local activities
  if (window.USER && window.USER.isAuthenticated) {
    try { syncPendingActivities(); } catch (e) { console.warn('Sync failed', e); }
    // fetch persisted data to reflect DB values
    try { fetchPersistedData(); } catch (e) { console.warn('Failed to fetch persisted data', e); }
  }
  
  // Helper functions
  // Save pending activities to localStorage for unauthenticated users
  function savePendingActivity(activity) {
    try {
      const key = 'ecotrack_pending_activities';
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      list.push(activity);
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {
      console.warn('Could not save pending activity', e);
    }
  }

  // If user logs in, sync pending activities to server
  function syncPendingActivities() {
    try {
      const key = 'ecotrack_pending_activities';
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(list) || list.length === 0) return;

      const csrftoken = getCookie('csrftoken') || document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

      // send sequentially to avoid flooding and to preserve order
      (async function() {
        for (const item of list) {
          try {
            const res = await fetch('/activity/api/add/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken || ''
              },
              body: JSON.stringify(item)
            });
            const json = await res.json();
            if (!json.success) console.warn('Sync failed for item', json);
            else {
              // reflect in UI
              const cat = item.category || item.cat || 'transportation';
              const shortCat = cat === 'transportation' ? 'transportation' : cat;
              updateActivityCount(shortCat);
            }
          } catch (err) {
            console.warn('Error syncing pending activity', err);
          }
        }
        // clear pending list after attempts
        localStorage.removeItem(key);
      })();
    } catch (e) {
      console.warn('Could not sync pending activities', e);
    }
  }

  // utility: read cookie value (for CSRF)
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  function showActivityForm(category) {
    // Hide selection, show forms
    activitySelection.style.display = 'none';
    activityForms.style.display = 'block';
    
    // Hide all forms, show only the selected one
    document.querySelectorAll('.activity-form').forEach(form => {
      form.classList.remove('active');
    });
    
    // Show only the selected form
    const selectedForm = document.getElementById(`${category}-form`);
    if (selectedForm) {
      selectedForm.classList.add('active');
    }
    
    // Update URL without reload
    history.pushState({ category }, '', `#${category}`);
  }
  
  function showActivitySelection() {
    activitySelection.style.display = 'block';
    activityForms.style.display = 'none';
    
    // Hide all forms when going back to selection
    document.querySelectorAll('.activity-form').forEach(form => {
      form.classList.remove('active');
    });
    
    history.pushState({}, '', window.location.pathname);
  }
  
  function setupImpactCalculators() {
    // Transportation impact calculator
    const transportType = document.getElementById('transportType');
    const distance = document.getElementById('distance');
    
    if (transportType && distance) {
      const updateTransportImpact = () => {
        const type = transportType.value;
        const dist = parseFloat(distance.value) || 0;
        const impact = calculateTransportImpact(type, dist);
        updateImpactPreview('transportation', impact);
      };
      
      transportType.addEventListener('change', updateTransportImpact);
      distance.addEventListener('input', updateTransportImpact);
    }
    
    // Diet impact calculator
    const mealRadios = document.querySelectorAll('input[name="mealType"]');
    mealRadios.forEach(radio => {
      radio.addEventListener('change', function() {
        if (this.checked) {
          const impact = calculateDietImpact(this.value);
          updateImpactPreview('diet', impact);
        }
      });
    });
    
    // Energy impact calculator
    const energyRadios = document.querySelectorAll('input[name="energyType"]');
    const energyAmount = document.getElementById('energyAmount');
    
    if (energyAmount) {
      const updateEnergyImpact = () => {
        const selectedEnergy = document.querySelector('input[name="energyType"]:checked');
        if (selectedEnergy) {
          const amount = parseFloat(energyAmount.value) || 0;
          const impact = calculateEnergyImpact(selectedEnergy.value, amount);
          updateImpactPreview('energy', impact);
        }
      };
      
      energyRadios.forEach(radio => {
        radio.addEventListener('change', updateEnergyImpact);
      });
      energyAmount.addEventListener('input', updateEnergyImpact);
    }
  }
  
  function updateImpactPreview(category, impact) {
    const form = document.getElementById(`${category}-form`);
    if (form) {
      const impactValue = form.querySelector('.impact-value');
      if (impactValue) {
        impactValue.textContent = `${impact} kg CO2`;
      }
    }
  }
  
  function addActivity(category) {
    let activityData = {};
    let isValid = true;
    
    switch(category) {
      case 'transportation':
        const transportType = document.getElementById('transportType');
        const distance = document.getElementById('distance');
        
        if (!transportType || !transportType.value || !distance || !distance.value || distance.value <= 0) {
          showNotification('Please fill all transportation fields correctly', 'error');
          isValid = false;
          break;
        }
        
        activityData = {
          category: 'transportation',
          type: transportType.value,
          distance: distance.value,
          date: document.getElementById('transportDate').value || new Date().toISOString().split('T')[0],
          impact: calculateTransportImpact(transportType.value, parseFloat(distance.value))
        };
        break;
        
      case 'diet':
        const mealType = document.querySelector('input[name="mealType"]:checked');
        
        if (!mealType) {
          showNotification('Please select a meal type', 'error');
          isValid = false;
          break;
        }
        
        activityData = {
          category: 'diet',
          type: mealType.value,
          date: document.getElementById('mealDate').value || new Date().toISOString().split('T')[0],
          impact: calculateDietImpact(mealType.value)
        };
        break;
        
      case 'energy':
        const energyType = document.querySelector('input[name="energyType"]:checked');
        const energyAmount = document.getElementById('energyAmount');
        
        if (!energyType || !energyAmount || !energyAmount.value || energyAmount.value <= 0) {
          showNotification('Please fill all energy fields correctly', 'error');
          isValid = false;
          break;
        }
        
        activityData = {
          category: 'energy',
          type: energyType.value,
          amount: energyAmount.value,
          date: document.getElementById('energyDate').value || new Date().toISOString().split('T')[0],
          impact: calculateEnergyImpact(energyType.value, parseFloat(energyAmount.value))
        };
        break;
    }
    
    if (!isValid) return;
    // If user is not authenticated, save locally and warn they need to log in to persist
    const isAuthed = window.USER && window.USER.isAuthenticated;
    if (!isAuthed) {
      savePendingActivity(activityData);
      updateActivityCount(category);
      showNotification('Saved locally. Log in to persist to your account.');
      resetForm(category);
      return;
    }

    // POST to backend to persist the activity
    const csrftoken = getCookie('csrftoken') || document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    fetch('/activity/api/add/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken || ''
      },
      body: JSON.stringify(activityData)
    })
    .then(res => res.json())
    .then(json => {
      if (json.success) {
        // Update activity count & UI
        updateActivityCount(category);
        showNotification('Activity added successfully!');
        // Reset form and go back to selection
        resetForm(category);
        // refresh persisted counts from server to ensure UI matches DB
        try { fetchPersistedData(); } catch (e) { console.warn('Failed to fetch persisted data', e); }
      } else {
        showNotification(json.error || 'Failed to save activity', 'error');
      }
    })
    .catch(err => {
      console.error('Failed to save activity', err);
      showNotification('Failed to save activity', 'error');
    });
    

  
  }

  // Fetch persisted totals/counts/recent from server and update the activity page UI
  function fetchPersistedData() {
    const csrftoken = getCookie('csrftoken') || document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    return fetch('/activity/api/list/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken || ''
      }
    })
    .then(res => res.json())
    .then(json => {
      if (!json.success) return;
      // update counts on activity selection columns
      const counts = json.counts || {};
      document.querySelectorAll('.selection-column').forEach(col => {
        const cat = col.getAttribute('data-category');
        const countEl = col.querySelector('.stat-count');
        if (countEl) {
          // counts keys use 'transportation','diet','energy','shopping'
          countEl.textContent = counts[cat] != null ? counts[cat] : 0;
        }
      });

      // optionally reflect recent activities somewhere on the activity page
      // (not implemented here — dashboard shows recent activities)
    })
    .catch(err => {
      console.warn('Failed to load persisted activities', err);
    });
  }
  
  function updateActivityCount(category) {
    const column = document.querySelector(`.selection-column[data-category="${category}"]`);
    if (column) {
      const countElement = column.querySelector('.stat-count');
      if (countElement) {
        let currentCount = parseInt(countElement.textContent) || 0;
        countElement.textContent = currentCount + 1;
      }
    }
  }
  
  function resetForm(category) {
    const form = document.getElementById(`${category}-form`);
    if (!form) return;
    
    switch(category) {
      case 'transportation':
        const transportType = form.querySelector('#transportType');
        const distance = form.querySelector('#distance');
        const transportDate = form.querySelector('#transportDate');
        
        if (transportType) transportType.selectedIndex = 0;
        if (distance) distance.value = '';
        if (transportDate) transportDate.value = '';
        break;
        
      case 'diet':
        const mealRadios = form.querySelectorAll('input[name="mealType"]');
        const mealDate = form.querySelector('#mealDate');
        
        mealRadios.forEach(radio => radio.checked = false);
        if (mealDate) mealDate.value = '';
        break;
        
      case 'energy':
        const energyRadios = form.querySelectorAll('input[name="energyType"]');
        const energyAmount = form.querySelector('#energyAmount');
        const energyDate = form.querySelector('#energyDate');
        
        energyRadios.forEach(radio => radio.checked = false);
        if (energyAmount) energyAmount.value = '';
        if (energyDate) energyDate.value = '';
        break;
    }
    
    // Reset impact preview
    updateImpactPreview(category, 0);
  }
  
  // Impact calculation functions
  function calculateTransportImpact(type, distance) {
    const factors = {
      car: 0.21,
      bus: 0.1,
      train: 0.04,
      bicycle: 0,
      walk: 0
    };
    
    const factor = factors[type] || 0;
    return (factor * parseFloat(distance)).toFixed(2);
  }
  
  function calculateDietImpact(type) {
    const factors = {
      vegetarian: 1.7,
      vegan: 1.5,
      meat: 6.0,
      fish: 3.5
    };
    
    return (factors[type] || 0).toFixed(2);
  }
  
  function calculateEnergyImpact(type, amount) {
    const factors = {
      electricity: 0.5,
      heating: 0.3,
      renewable: 0.05
    };
    
    const factor = factors[type] || 0;
    return (factor * parseFloat(amount)).toFixed(2);
  }
  
  function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    if (!notification || !notificationText) return;
    
    notificationText.textContent = message;
    
    // Change color based on type
    if (type === 'error') {
      notification.style.background = '#f44336';
    } else {
      notification.style.background = 'var(--primary-green)';
    }
    
    notification.classList.add('show');
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }
  
  // Handle browser back/forward buttons
  window.addEventListener('popstate', function(event) {
    if (event.state && event.state.category) {
      showActivityForm(event.state.category);
    } else {
      showActivitySelection();
    }
  });
});