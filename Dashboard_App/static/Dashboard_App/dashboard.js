document.addEventListener('DOMContentLoaded', function () {
    // --- Carbon Footprint Line Chart ---
    let cfLineChart = null;
    const cfLineChartEl = document.getElementById('cfLineChart');
    const cfTimeRange = document.getElementById('cfTimeRange');

    function fetchAndRenderCFLineChart(range) {
        fetch('/dashboard/api/carbon-timeseries/')
            .then(r => r.json())
            .then(data => {
                if (!data.success) return;
                let chartData = data[range] || [];
                let labels = [];
                let values = [];
                if (range === 'yearly') {
                    labels = chartData.map(d => d.year ? d.year.substring(0, 4) : '');
                } else if (range === 'monthly') {
                    labels = chartData.map(d => d.month ? d.month.substring(0, 7) : '');
                } else {
                    labels = chartData.map(d => d.day ? d.day.substring(0, 10) : '');
                }
                values = chartData.map(d => d.total ? Number(d.total) : 0);
                renderCFLineChart(labels, values, range);
            });
    }

    function renderCFLineChart(labels, values, range) {
        if (!cfLineChartEl) return;
        if (cfLineChart) {
            cfLineChart.destroy();
        }
        // If only one data point, duplicate it to make a visible line
        let chartLabels = labels.slice();
        let chartValues = values.slice();
        if (chartLabels.length === 1) {
            chartLabels = [chartLabels[0], chartLabels[0]];
            chartValues = [chartValues[0], chartValues[0]];
        }
        // If no data, show a zero baseline
        if (chartLabels.length === 0) {
            chartLabels = ['No Data'];
            chartValues = [0];
        }
        cfLineChart = new Chart(cfLineChartEl.getContext('2d'), {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Total Carbon Footprint (kg CO2)',
                    data: chartValues,
                    borderColor: '#4A90E2',
                    backgroundColor: 'rgba(76,175,80,0.08)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    pointBackgroundColor: '#4A90E2',
                    spanGaps: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    title: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return ` ${context.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg CO2`;
                            }
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: range.charAt(0).toUpperCase() + range.slice(1) } },
                    y: { title: { display: true, text: 'kg CO2' }, beginAtZero: true }
                }
            }
        });
    }

    if (cfTimeRange) {
        cfTimeRange.addEventListener('change', function () {
            fetchAndRenderCFLineChart(cfTimeRange.value);
        });
        // Initial load
        fetchAndRenderCFLineChart(cfTimeRange.value);
    }

    // Update chart after activity add
    function updateCFLineChartAfterActivity() {
        if (cfTimeRange) fetchAndRenderCFLineChart(cfTimeRange.value);
    }

    const categorySelect = document.getElementById('category');
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    const recentActivities = document.getElementById('recentActivities');

    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutModal');
    const cancelLogout = logoutModal.querySelector('.btn-logout-cancel');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            logoutModal.style.display = 'flex';
        });
    }

    if (cancelLogout) {
        cancelLogout.addEventListener('click', function () {
            logoutModal.style.display = 'none';
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', function (e) {
        if (e.target === logoutModal) {
            logoutModal.style.display = 'none';
        }
    });

    // Close modal when clicking outside
    window.addEventListener('click', function (e) {
        if (e.target === logoutModal) {
            logoutModal.style.display = 'none';
        }
    });

    // UI elements for analytics
    const scoreValueEl = document.getElementById('scoreValue');
    const scoreLabelEl = document.getElementById('scoreLabel');
    const scoreTimerEl = document.getElementById('scoreTimer');
    const transportValueEl = document.getElementById('transportValue');
    const dietValueEl = document.getElementById('dietValue');
    const energyValueEl = document.getElementById('energyValue');
    const progressValueEl = document.getElementById('progressValue');
    const progressKgEl = document.getElementById('progressKg');

    // form elements
    const trackingForm = document.getElementById('trackingForm');
    const transportFields = document.getElementById('transportFields');
    const dietFields = document.getElementById('dietFields');
    const energyFields = document.getElementById('energyFields');

    // transport inputs
    const transportType = document.getElementById('transportType');
    const distanceInput = document.getElementById('distance');

    // diet input
    const mealType = document.getElementById('mealType');

    // energy inputs
    const energyType = document.getElementById('energyType');
    const energyAmount = document.getElementById('energyAmount');

    // User profile dropdown
    const userProfile = document.getElementById('userProfile');
    const profileMenu = document.getElementById('profileMenu');
    if (userProfile && profileMenu) {
        userProfile.addEventListener('click', function (e) {
            // Prevent toggle if clicking directly on the link (to avoid two-click issue)
            if (e.target.closest('a')) {
                return; // Let the link handle the click (redirect)
            }
            profileMenu.classList.toggle('active');
        });

        // Close dropdown when clicking elsewhere
        document.addEventListener('click', function (e) {
            if (!userProfile.contains(e.target)) {
                profileMenu.classList.remove('active');
            }
        });
    }

    // state
    const state = {
        breakdown: { transport: 0, diet: 0, energy: 0 },
        activities: []
    };

    // If the server provided initial data, use it to populate the state
    if (window.INIT_DATA) {
        try {
            const bd = window.INIT_DATA.breakdown || {};
            // map server category keys to local keys used by this script
            state.breakdown.transport = Number(bd.transportation || bd.transport || 0) || 0;
            state.breakdown.diet = Number(bd.diet || 0) || 0;
            state.breakdown.energy = Number(bd.energy || 0) || 0;

            // recent activities list from server
            const recent = window.INIT_DATA.recent || [];
            // keep a copy in state (full objects) but only display up to 5
            state.activities = recent.map(r => ({ ...r }));
            // render recent activities into UI (limit to 5)
            if (Array.isArray(recent) && recent.length) {
                recent.slice(0, 5).reverse().forEach(r => {
                    const impact = Number(r.impact) || 0;
                    // map server category names to expected keys in addActivityToList
                    let activityForList = {};
                    if (r.category === 'transportation' || r.category === 'transport') {
                        activityForList.category = 'transport';
                        activityForList.transportType = r.subtype || '';
                        activityForList.distance = r.distance || 0;
                    } else if (r.category === 'diet') {
                        activityForList.category = 'diet';
                        activityForList.mealType = r.subtype || '';
                    } else if (r.category === 'energy') {
                        activityForList.category = 'energy';
                        activityForList.energyAmount = r.amount || r.energyAmount || 0;
                    }
                    addActivityToList(activityForList, impact);
                });
            }
            // Update UI now that we populated state
            updateUI();
            // If the server included badge counters/earned flags, initialize them
            if (window.INIT_DATA.badges) {
                try {
                    const b = window.INIT_DATA.badges;
                    // copy counters and earned flags into state.badges
                    if (b.eco_commuter) {
                        state.badges.eco_commuter.bike_walk_trips = Number(b.eco_commuter.bike_walk_trips || 0);
                        state.badges.eco_commuter.bike_walk_km = Number(b.eco_commuter.bike_walk_km || 0);
                        state.badges.eco_commuter.earned = Boolean(b.eco_commuter.earned);
                    }
                    if (b.green_eater) {
                        state.badges.green_eater.veg_meals = Number(b.green_eater.veg_meals || 0);
                        state.badges.green_eater.earned = Boolean(b.green_eater.earned);
                    }
                    if (b.recycling_champion) {
                        state.badges.recycling_champion.recycle_actions = Number(b.recycling_champion.recycle_actions || 0);
                        state.badges.recycling_champion.earned = Boolean(b.recycling_champion.earned);
                    }
                    if (b.energy_saver) {
                        state.badges.energy_saver.renewable_uses = Number(b.energy_saver.renewable_uses || 0);
                        state.badges.energy_saver.earned = Boolean(b.energy_saver.earned);
                    }
                    if (b.carbon_neutral) {
                        state.badges.carbon_neutral.earned = Boolean(b.carbon_neutral.earned);
                    }
                } catch (e) {
                    console.warn('Failed to initialize badges from INIT_DATA', e);
                }
            }
            // Initialize points from server if provided
            try {
                const pts = Number(window.INIT_DATA.points || 0);
                const ptsEl = document.getElementById('userPoints');
                if (ptsEl) ptsEl.textContent = pts;
            } catch (e) {
                /* ignore */
            }
            evaluateBadges();
            // Ensure the badge elements reflect authoritative INIT_DATA earned flags
            try { Object.keys(state.badges).forEach(updateBadgeUI); } catch (e) { /* ignore */ }
        } catch (e) {
            console.warn('Failed to parse INIT_DATA', e);
        }
    }

    // Fetch latest persisted data from server to ensure we display up-to-date values
    function refreshFromServer() {
        fetch('/activity/api/list/', { credentials: 'same-origin' })
            .then(r => r.json())
            .then(json => {
                if (!json.success) return;
                const bd = json.breakdown || {};
                state.breakdown.transport = Number(bd.transportation || bd.transport || 0) || 0;
                state.breakdown.diet = Number(bd.diet || 0) || 0;
                state.breakdown.energy = Number(bd.energy || 0) || 0;

                // rebuild recent list
                document.getElementById('recentActivities').innerHTML = '';
                (json.recent || []).slice(0, 5).reverse().forEach(r => {
                    const impact = Number(r.impact) || 0;
                    let activityForList = {};
                    if (r.category === 'transportation' || r.category === 'transport') {
                        activityForList.category = 'transport';
                        activityForList.transportType = r.subtype || '';
                        activityForList.distance = r.distance || 0;
                    } else if (r.category === 'diet') {
                        activityForList.category = 'diet';
                        activityForList.mealType = r.subtype || '';
                    } else if (r.category === 'energy') {
                        activityForList.category = 'energy';
                        activityForList.energyAmount = r.amount || r.energyAmount || 0;
                    }
                    addActivityToList(activityForList, impact);
                });

                updateUI();
                evaluateBadges();

                // Also refresh points and authoritative badge earned flags from dashboard API
                fetch('/dashboard/api/status/', { credentials: 'same-origin' })
                    .then(r2 => r2.json())
                    .then(js2 => {
                        if (!js2.success) return;
                        try {
                            const pts = Number(js2.points || 0);
                            const ptsEl = document.getElementById('userPoints');
                            if (ptsEl) ptsEl.textContent = pts;

                            // Merge server badges into client state and update UI
                            if (js2.badges) {
                                const b = js2.badges;
                                if (b.eco_commuter) {
                                    state.badges.eco_commuter.bike_walk_trips = Number(b.eco_commuter.bike_walk_trips || 0);
                                    state.badges.eco_commuter.bike_walk_km = Number(b.eco_commuter.bike_walk_km || 0);
                                    state.badges.eco_commuter.earned = Boolean(b.eco_commuter.earned);
                                }
                                if (b.green_eater) {
                                    state.badges.green_eater.veg_meals = Number(b.green_eater.veg_meals || 0);
                                    state.badges.green_eater.earned = Boolean(b.green_eater.earned);
                                }
                                if (b.recycling_champion) {
                                    state.badges.recycling_champion.recycle_actions = Number(b.recycling_champion.recycle_actions || 0);
                                    state.badges.recycling_champion.earned = Boolean(b.recycling_champion.earned);
                                }
                                if (b.energy_saver) {
                                    state.badges.energy_saver.renewable_uses = Number(b.energy_saver.renewable_uses || 0);
                                    state.badges.energy_saver.earned = Boolean(b.energy_saver.earned);
                                }
                                if (b.carbon_neutral) {
                                    state.badges.carbon_neutral.earned = Boolean(b.carbon_neutral.earned);
                                }
                                // Update badge UI now that we pulled authoritative earned flags
                                Object.keys(state.badges).forEach(updateBadgeUI);
                            }
                        } catch (e) { /* ignore */ }
                    })
                    .catch(() => { });
            })
            .catch(err => console.warn('Failed to refresh dashboard data', err));
    }

    // Try to refresh from server on load (keeps client in sync if server rendering missed anything)
    try { refreshFromServer(); } catch (e) { console.warn('refreshFromServer failed', e); }

    // Emission factors (kg CO2 per unit)
    const EMISSION_FACTORS = {
        transport: {
            car: 0.192,    // kg CO2 per km
            bus: 0.105,
            train: 0.041,
            bicycle: 0.0,
            walk: 0.0
        },
        energy_kwh: 0.233, // kg CO2 per kWh
        diet: {
            vegetarian: -1.2, // relative impact per meal (kg)
            vegan: -1.6,
            meat: 2.0,
            fish: 0.5
        }
    };

    // Initialize Chart.js with 3 segments
    const ctx = document.getElementById('carbonChart').getContext('2d');
    const carbonChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Transport', 'Food', 'Energy'],
            datasets: [{
                data: [0, 0, 0],
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
                legend: { position: 'bottom' }
            },
            cutout: '70%'
        }
    });

    // helpers
    function resetAnalytics() {
        state.breakdown = { transport: 0, diet: 0, energy: 0 };
        state.activities = [];
        updateUI();
        recentActivities.innerHTML = '';
        // Store the last reset time in localStorage
        try {
            localStorage.setItem('carbon_last_reset', Date.now().toString());
        } catch (e) { }
    }

    function updateUI() {
        const totals = state.breakdown;
        const totalAbs = Math.abs(totals.transport) + Math.abs(totals.diet) + Math.abs(totals.energy);
        const total = totals.transport + totals.diet + totals.energy;

        // Show total as kg CO2 (one decimal)
        scoreValueEl.textContent = total.toFixed(1);
        scoreLabelEl.textContent = 'kg CO2';
        // Timer update handled separately



        // Update chart with absolute contributions (so negatives still appear proportionally)
        carbonChart.data.datasets[0].data = [
            Math.abs(totals.transport),
            Math.abs(totals.diet),
            Math.abs(totals.energy)
        ];
        carbonChart.update();

        // Update detail percentages
        function pct(value) {
            return totalAbs ? Math.round((Math.abs(value) / totalAbs) * 100) + '%' : '0%';
        }
        transportValueEl.textContent = pct(totals.transport);
        dietValueEl.textContent = pct(totals.diet);
        energyValueEl.textContent = pct(totals.energy);

        // progress toward a sample daily target (13.0 kg)
        const dailyTarget = 13.0;
        const achieved = Math.min(Math.max(total, 0), dailyTarget);
        const percentDisplay = Math.round((achieved / dailyTarget) * 100);
        progressValueEl.textContent = percentDisplay + '%';
        progressKgEl.textContent = total.toFixed(1) + ' kg of ' + dailyTarget.toFixed(1) + ' kg target';
    }


    // --- Daily Reset Timer Logic ---
    function pad(n) { return n < 10 ? '0' + n : n; }
    function getNextResetTime() {
        // Reset at the same time every day (e.g., midnight local time)
        const now = new Date();
        const next = new Date(now);
        next.setHours(0, 0, 0, 0);
        if (now >= next) next.setDate(next.getDate() + 1);
        return next;
    }

    function getLastResetTime() {
        let last = null;
        try {
            last = parseInt(localStorage.getItem('carbon_last_reset'), 10);
        } catch (e) { }
        return last || 0;
    }

    function checkAndResetIfNeeded() {
        const now = Date.now();
        const last = getLastResetTime();
        const nextReset = getNextResetTime().getTime();
        if (!last || now >= nextReset) {
            resetAnalytics();
        }
    }

    function updateTimerDisplay() {
        const now = new Date();
        const next = getNextResetTime();
        let diff = Math.floor((next - now) / 1000);
        if (diff < 0) diff = 0;
        const h = pad(Math.floor(diff / 3600));
        const m = pad(Math.floor((diff % 3600) / 60));
        const s = pad(diff % 60);
        if (scoreTimerEl) {
            scoreTimerEl.textContent = `${h}:${m}:${s}`;
        }
    }

    // On load, check if reset is needed
    checkAndResetIfNeeded();
    updateTimerDisplay();
    setInterval(() => {
        checkAndResetIfNeeded();
        updateTimerDisplay();
    }, 1000);
    // --- End Daily Reset Timer Logic ---

    // initial reset on load if no reset time exists
    if (!getLastResetTime()) {
        resetAnalytics();
    }

    // Modal handlers
    openModalBtn && openModalBtn.addEventListener('click', () => { modal.style.display = 'flex'; });
    closeModalBtn && closeModalBtn.addEventListener('click', () => { modal.style.display = 'none'; });

    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    userProfile && userProfile.addEventListener('click', () => {
        profileMenu.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (userProfile && !userProfile.contains(e.target)) {
            profileMenu.classList.remove('active');
        }
    });

    // show/hide fields based on category
    categorySelect && categorySelect.addEventListener('change', () => {
        transportFields.style.display = 'none';
        dietFields.style.display = 'none';
        energyFields.style.display = 'none';

        if (categorySelect.value === 'transport') transportFields.style.display = 'block';
        if (categorySelect.value === 'diet') dietFields.style.display = 'block';
        if (categorySelect.value === 'energy') energyFields.style.display = 'block';
    });

    // compute emissions for an activity (kg)
    function computeEmissions(activity) {
        switch (activity.category) {
            case 'transport': {
                const type = activity.transportType || 'car';
                const distance = Number(activity.distance) || 0;
                const factor = EMISSION_FACTORS.transport[type] ?? 0.192;
                return distance * factor;
            }
            case 'diet': {
                const meal = activity.mealType || 'meat';
                return EMISSION_FACTORS.diet[meal] ?? 0;
            }
            case 'energy': {
                const kwh = Number(activity.energyAmount) || 0;
                return kwh * EMISSION_FACTORS.energy_kwh;
            }
            default:
                return 0;
        }
    }

    function addActivityToList(activity, impactKg) {
        updateCFLineChartAfterActivity();
        const li = document.createElement('li');
        li.className = 'activity-item';
        const icon = {
            transport: '<i class="fas fa-car"></i>',
            diet: '<i class="fas fa-utensils"></i>',
            energy: '<i class="fas fa-bolt"></i>'
        }[activity.category] || '<i class="fas fa-circle"></i>';


        // Helper to camel case and add thousand separators
        function toCamelCase(str) {
            if (!str) return '';
            return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
        }
        function formatNumber(n, decimals = 1) {
            return Number(n).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        }
        let description = '';
        if (activity.category === 'transport') {
            description = `${toCamelCase(activity.transportType || '')} (${formatNumber(activity.distance || 0)} km)`;
        } else if (activity.category === 'diet') {
            description = `${toCamelCase(activity.mealType || '')} Meal`;
        } else if (activity.category === 'energy') {
            description = `${formatNumber(activity.energyAmount || 0)} kWh`;
        } else {
            description = toCamelCase(activity.subtype || 'Activity');
        }

        li.innerHTML = `
            <div class="activity-category">
              <div class="category-icon">${icon}</div>
              <span>${description}</span>
            </div>
            <div class="activity-impact">${impactKg > 0 ? '+' : ''}${impactKg.toFixed(1)} kg</div>
        `;
        // prepend so newest appears first
        recentActivities.prepend(li);
        // keep only the 5 most recent items in the UI
        while (recentActivities.children.length > 5) {
            recentActivities.removeChild(recentActivities.lastChild);
        }
    }

    // form submission: calculate emissions and update analytics
    trackingForm && trackingForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const category = categorySelect.value;
        if (!category) {
            notificationText.textContent = 'Please select a category.';
            notification.classList.add('show');
            setTimeout(() => notification.classList.remove('show'), 2000);
            return;
        }

        const activity = { category };

        if (category === 'transport') {
            activity.transportType = transportType.value;
            activity.distance = Number(distanceInput.value) || 0;
        } else if (category === 'diet') {
            activity.mealType = mealType.value;
        } else if (category === 'energy') {
            activity.energyType = energyType.value;
            activity.energyAmount = Number(energyAmount.value) || 0;
        }

        const impactKg = computeEmissions(activity);

        // update state
        state.breakdown[category] += impactKg;
        state.activities.push({ ...activity, impactKg, timestamp: Date.now() });

        updateUI();
        addActivityToList(activity, impactKg);

        // Show positive/negative notification
        notificationText.textContent = impactKg >= 0
            ? `Activity added (+${impactKg.toFixed(1)} kg CO2)`
            : `Activity added (${impactKg.toFixed(1)} kg CO2)`;
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 3000);

        // close modal & reset form
        modal.style.display = 'none';
        trackingForm.reset();
        transportFields.style.display = 'none';
        dietFields.style.display = 'none';
        energyFields.style.display = 'none';
    });

    // reset button via double-click on score card (developer convenience)
    const scoreCard = document.querySelector('.score-card');
    scoreCard && scoreCard.addEventListener('dblclick', () => {
        resetAnalytics();
        notificationText.textContent = 'Analytics reset to 0.';
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 2000);
    });

    state.badges = {
        eco_commuter: { earned: false, bike_walk_trips: 0, bike_walk_km: 0 },
        green_eater: { earned: false, veg_meals: 0 },
        recycling_champion: { earned: false, recycle_actions: 0 },
        energy_saver: { earned: false, renewable_uses: 0 },
        carbon_neutral: { earned: false }
    };

    // badge elements map
    const badgeEls = {
        eco_commuter: document.getElementById('badge-eco_commuter'),
        green_eater: document.getElementById('badge-green_eater'),
        recycling_champion: document.getElementById('badge-recycling_champion'),
        energy_saver: document.getElementById('badge-energy_saver'),
        carbon_neutral: document.getElementById('badge-carbon_neutral'),
    };

    // thresholds / prerequisites
    const BADGE_RULES = {
        eco_commuter: { trips: 5, km: 50 },
        green_eater: { meals: 7 },
        recycling_champion: { actions: 5 },
        energy_saver: { uses: 5 },
        carbon_neutral: { maxKg: 0.5 }
    };

    function resetBadges() {
        Object.keys(state.badges).forEach(key => {
            const b = state.badges[key];
            // reset counters
            if (key === 'eco_commuter') {
                b.bike_walk_trips = 0;
                b.bike_walk_km = 0;
            } else if (key === 'green_eater') {
                b.veg_meals = 0;
            } else if (key === 'recycling_champion') {
                b.recycle_actions = 0;
            } else if (key === 'energy_saver') {
                b.renewable_uses = 0;
            }
            b.earned = false;
            updateBadgeUI(key);
        });
    }

    function updateBadgeUI(badgeKey) {
        const el = badgeEls[badgeKey];
        if (!el) return;
        if (state.badges[badgeKey].earned) {
            el.classList.remove('locked');
            el.classList.add('badge-unlocked');
            // update tooltip to show earned
            const tt = el.querySelector('.badge-tooltip');
            if (tt) tt.innerHTML = `${prettyName(badgeKey)}<br><small class="earned-text">Badge earned</small>`;
        } else {
            el.classList.remove('badge-unlocked');
            el.classList.add('locked');
            const tt = el.querySelector('.badge-tooltip');
            if (tt) {
                // show prereq stored in data attribute
                const prereq = el.getAttribute('data-prereq') || '';
                tt.innerHTML = `${prettyName(badgeKey)}<br><small class="prereq">${prereq}</small>`;
            }
        }
    }

    function prettyName(key) {
        return {
            eco_commuter: 'Eco Commuter',
            green_eater: 'Green Eater',
            recycling_champion: 'Recycling Champion',
            energy_saver: 'Energy Saver',
            carbon_neutral: 'Carbon Neutral'
        }[key] || key;
    }

    function evaluateBadges() {
        const totals = state.breakdown;
        // eco commuter: bike/walk trips or km
        const eco = state.badges.eco_commuter;
        if (!eco.earned && (eco.bike_walk_trips >= BADGE_RULES.eco_commuter.trips || eco.bike_walk_km >= BADGE_RULES.eco_commuter.km)) {
            eco.earned = true;
            notifyBadge('Eco Commuter earned!');
            updateBadgeUI('eco_commuter');
        }

        // green eater
        const green = state.badges.green_eater;
        if (!green.earned && green.veg_meals >= BADGE_RULES.green_eater.meals) {
            green.earned = true;
            notifyBadge('Green Eater earned!');
            updateBadgeUI('green_eater');
        }

        // recycling champion
        const recycle = state.badges.recycling_champion;
        if (!recycle.earned && recycle.recycle_actions >= BADGE_RULES.recycling_champion.actions) {
            recycle.earned = true;
            notifyBadge('Recycling Champion earned!');
            updateBadgeUI('recycling_champion');
        }

        // energy saver
        const energyB = state.badges.energy_saver;
        if (!energyB.earned && energyB.renewable_uses >= BADGE_RULES.energy_saver.uses) {
            energyB.earned = true;
            notifyBadge('Energy Saver earned!');
            updateBadgeUI('energy_saver');
        }

        // carbon neutral: check total footprint
        const carbon = state.badges.carbon_neutral;
        const total = totals.transport + totals.diet + totals.energy;
        if (!carbon.earned && total <= BADGE_RULES.carbon_neutral.maxKg) {
            carbon.earned = true;
            notifyBadge('Carbon Neutral earned!');
            updateBadgeUI('carbon_neutral');
        }
    }

    function notifyBadge(text) {
        notificationText.textContent = text;
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 3000);
    }

    // integrate badge updates into addActivity processing
    // modify compute & form handling section: after computing impactKg update badge counters
    // We'll wrap original form submit handler to include badge logic (existing handler below overwritten)

    // remove existing trackingForm listener if present - safe guard (ignored if none)
    // add enhanced handler
    if (trackingForm) {
        trackingForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const category = categorySelect.value;
            if (!category) {
                // keep original behaviour for missing category
                notificationText.textContent = 'Please select a category.';
                notification.classList.add('show');
                setTimeout(() => notification.classList.remove('show'), 2000);
                return;
            }

            const activity = { category };

            if (category === 'transport') {
                activity.transportType = transportType.value;
                activity.distance = Number(distanceInput.value) || 0;
            } else if (category === 'diet') {
                activity.mealType = mealType.value;
            } else if (category === 'energy') {
                activity.energyType = energyType.value;
                activity.energyAmount = Number(energyAmount.value) || 0;
            }

            const impactKg = computeEmissions(activity);

            // update state breakdown
            state.breakdown[category] += impactKg;

            // badge counter updates
            if (category === 'transport') {
                if (activity.transportType === 'bicycle' || activity.transportType === 'walk') {
                    state.badges.eco_commuter.bike_walk_trips += 1;
                    state.badges.eco_commuter.bike_walk_km += Number(activity.distance) || 0;
                }
            } else if (category === 'diet') {
                if (activity.mealType === 'vegetarian' || activity.mealType === 'vegan') {
                    state.badges.green_eater.veg_meals += 1;
                }
            }

            state.activities.push({ ...activity, impactKg, timestamp: Date.now() });

            updateUI();
            addActivityToList(activity, impactKg);

            // Notification: show success + kg CO2 added/subtracted
            let msg;
            if (impactKg > 0) {
                msg = `Activity added (+${impactKg.toFixed(1)} kg CO2)`;
            } else if (impactKg < 0) {
                msg = `Activity added (${impactKg.toFixed(1)} kg CO2)`; // negative shown with minus sign
            } else {
                msg = 'Activity added (0.0 kg CO2)';
            }
            notificationText.textContent = msg;
            notification.classList.add('show');
            setTimeout(() => notification.classList.remove('show'), 3000);

            // evaluate badges after state changed
            evaluateBadges();

            // close modal & reset form
            modal.style.display = 'none';
            trackingForm.reset();
            transportFields.style.display = 'none';
            dietFields.style.display = 'none';
            energyFields.style.display = 'none';
        });
    }

    // ensure resetAnalytics also resets badges
    const originalReset = resetAnalytics;
    resetAnalytics = function () {
        originalReset();
        resetBadges();
    };

    // initial badge UI setup
    Object.keys(state.badges).forEach(updateBadgeUI);

    // Listen for dashboard updates from history page (activity deletions)
    function handleDashboardUpdate(data) {
        if (!data) return;

        // Update breakdown
        const bd = data.breakdown || {};
        state.breakdown.transport = Number(bd.transportation || bd.transport || 0) || 0;
        state.breakdown.diet = Number(bd.diet || 0) || 0;
        state.breakdown.energy = Number(bd.energy || 0) || 0;

        // Update recent activities display
        const recent = data.recent || [];
        if (recentActivities) {
            recentActivities.innerHTML = '';
            recent.forEach(activity => {
                const li = document.createElement('li');
                li.className = 'activity-item';
                li.setAttribute('data-activity-id', activity.id);

                const icon = {
                    transportation: '<i class="fas fa-car"></i>',
                    transport: '<i class="fas fa-car"></i>',
                    diet: '<i class="fas fa-utensils"></i>',
                    energy: '<i class="fas fa-bolt"></i>'
                }[activity.category] || '<i class="fas fa-circle"></i>';

                let description = '';

                function toCamelCase(str) {
                    if (!str) return '';
                    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
                }
                function formatNumber(n, decimals = 1) {
                    return Number(n).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
                }
                if (activity.category === 'transportation' || activity.category === 'transport') {
                    description = `${toCamelCase(activity.subtype || 'Transport')} (${formatNumber(activity.distance || 0)} km)`;
                } else if (activity.category === 'diet') {
                    description = `${toCamelCase(activity.subtype || 'Meal')} Meal`;
                } else if (activity.category === 'energy') {
                    description = `${formatNumber(activity.amount || 0)} kWh`;
                } else {
                    description = toCamelCase(activity.subtype || 'Activity');
                }

                const impactKg = Number(activity.impact) || 0;
                li.innerHTML = `
                    <div class="activity-category">
                      <div class="category-icon">${icon}</div>
                      <span>${description}</span>
                    </div>
                    <div class="activity-impact">${impactKg > 0 ? '+' : ''}${impactKg.toFixed(1)} kg</div>
                `;
                recentActivities.appendChild(li);
            });

            // Show "No activities" message if empty
            if (recent.length === 0) {
                const emptyLi = document.createElement('li');
                emptyLi.className = 'activity-item';
                emptyLi.style.justifyContent = 'center';
                emptyLi.style.color = '#999';
                emptyLi.innerHTML = '<span>No recent activities</span>';
                recentActivities.appendChild(emptyLi);
            }
        }

        // Update UI with new breakdown
        updateUI();

        // Re-evaluate badges based on new data
        evaluateBadges();
    }

    // Listen for custom event (same tab)
    window.addEventListener('dashboardUpdate', function (e) {
        handleDashboardUpdate(e.detail);
    });

    // Listen for localStorage changes (cross-tab)
    window.addEventListener('storage', function (e) {
        if (e.key === 'dashboard_updated' && e.newValue) {
            try {
                const updateInfo = JSON.parse(e.newValue);
                handleDashboardUpdate(updateInfo.data);
            } catch (err) {
                console.error('Error parsing dashboard update:', err);
            }
        }
    });

    // Check for updates on page load
    try {
        const stored = localStorage.getItem('dashboard_updated');
        if (stored) {
            const updateInfo = JSON.parse(stored);
            // Only use if recent (within last 5 seconds)
            if (updateInfo.timestamp && (Date.now() - updateInfo.timestamp < 5000)) {
                handleDashboardUpdate(updateInfo.data);
            }
            // Clear the stored update after reading
            localStorage.removeItem('dashboard_updated');
        }
    } catch (err) {
        console.error('Error checking for dashboard updates:', err);
    }

    // ...existing code below...
});