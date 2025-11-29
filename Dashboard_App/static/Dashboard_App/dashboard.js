document.addEventListener('DOMContentLoaded', function() {
    
    const categorySelect = document.getElementById('category');
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    const recentActivities = document.getElementById('recentActivities');

    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutModal');
    const cancelLogout = logoutModal.querySelector('.btn-logout-cancel');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logoutModal.style.display = 'flex';
        });
    }
    
    if (cancelLogout) {
        cancelLogout.addEventListener('click', function() {
            logoutModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === logoutModal) {
            logoutModal.style.display = 'none';
        }
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === logoutModal) {
            logoutModal.style.display = 'none';
        }
    });

    // UI elements for analytics
    const scoreValueEl = document.getElementById('scoreValue');
    const scoreLabelEl = document.getElementById('scoreLabel');
    const transportValueEl = document.getElementById('transportValue');
    const dietValueEl = document.getElementById('dietValue');
    const energyValueEl = document.getElementById('energyValue');
    const shoppingValueEl = document.getElementById('shoppingValue');
    const progressValueEl = document.getElementById('progressValue');
    const progressKgEl = document.getElementById('progressKg');

    // form elements
    const trackingForm = document.getElementById('trackingForm');
    const transportFields = document.getElementById('transportFields');
    const dietFields = document.getElementById('dietFields');
    const energyFields = document.getElementById('energyFields');
    const shoppingFields = document.getElementById('shoppingFields');

    // transport inputs
    const transportType = document.getElementById('transportType');
    const distanceInput = document.getElementById('distance');

    // diet input
    const mealType = document.getElementById('mealType');

    // energy inputs
    const energyType = document.getElementById('energyType');
    const energyAmount = document.getElementById('energyAmount');

    // shopping inputs
    const shoppingDesc = document.getElementById('shoppingDesc');
    const shoppingImpact = document.getElementById('shoppingImpact');

    // User profile dropdown
    const userProfile = document.getElementById('userProfile');
    const profileMenu = document.getElementById('profileMenu');
    if (userProfile && profileMenu) {
        userProfile.addEventListener('click', function(e) {
            // Prevent toggle if clicking directly on the link (to avoid two-click issue)
            if (e.target.closest('a')) {
                return; // Let the link handle the click (redirect)
            }
            profileMenu.classList.toggle('active');
        });
        
        // Close dropdown when clicking elsewhere
        document.addEventListener('click', function(e) {
            if (!userProfile.contains(e.target)) {
                profileMenu.classList.remove('active');
            }
        });
    }
    
    // state
    const state = {
        breakdown: { transport: 0, diet: 0, energy: 0, shopping: 0 },
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
            state.breakdown.shopping = Number(bd.shopping || 0) || 0;

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
                    } else {
                        activityForList.category = r.category || 'shopping';
                        activityForList.shoppingDesc = r.subtype || '';
                        activityForList.shoppingImpact = r.amount || r.impact || 0;
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
                state.breakdown.shopping = Number(bd.shopping || 0) || 0;

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
                    } else {
                        activityForList.category = r.category || 'shopping';
                        activityForList.shoppingDesc = r.subtype || '';
                        activityForList.shoppingImpact = r.amount || r.impact || 0;
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
                    .catch(() => {});
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

    // Initialize Chart.js with 4 segments
    const ctx = document.getElementById('carbonChart').getContext('2d');
    const carbonChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Transport', 'Food', 'Energy', 'Shopping'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: [
                    '#4CAF50',
                    '#81C784',
                    '#C8E6C9',
                    '#A5D6A7'
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
        state.breakdown = { transport: 0, diet: 0, energy: 0, shopping: 0 };
        state.activities = [];
        updateUI();
        recentActivities.innerHTML = '';
    }

    function updateUI() {
        const totals = state.breakdown;
        const totalAbs = Math.abs(totals.transport) + Math.abs(totals.diet) + Math.abs(totals.energy) + Math.abs(totals.shopping);
        const total = totals.transport + totals.diet + totals.energy + totals.shopping;

        // Show total as kg CO2 (one decimal)
        scoreValueEl.textContent = total.toFixed(1);
        scoreLabelEl.textContent = 'kg CO2';

        // Update chart with absolute contributions (so negatives still appear proportionally)
        carbonChart.data.datasets[0].data = [
            Math.abs(totals.transport),
            Math.abs(totals.diet),
            Math.abs(totals.energy),
            Math.abs(totals.shopping)
        ];
        carbonChart.update();

        // Update detail percentages
        function pct(value) {
            return totalAbs ? Math.round((Math.abs(value) / totalAbs) * 100) + '%' : '0%';
        }
        transportValueEl.textContent = pct(totals.transport);
        dietValueEl.textContent = pct(totals.diet);
        energyValueEl.textContent = pct(totals.energy);
        shoppingValueEl.textContent = pct(totals.shopping);

        // progress toward a sample daily target (3.0 kg)
        const dailyTarget = 3.0;
        const achieved = Math.min(Math.max(total, 0), dailyTarget);
        const percent = Math.round((achieved / dailyTarget) * 100);
        progressValueEl.textContent = percent + '%';
        progressKgEl.textContent = total.toFixed(1) + ' kg of ' + dailyTarget.toFixed(1) + ' kg target';
    }

    // initial reset on load
    resetAnalytics();

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
        shoppingFields.style.display = 'none';

        if (categorySelect.value === 'transport') transportFields.style.display = 'block';
        if (categorySelect.value === 'diet') dietFields.style.display = 'block';
        if (categorySelect.value === 'energy') energyFields.style.display = 'block';
        if (categorySelect.value === 'shopping') shoppingFields.style.display = 'block';
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
            case 'shopping': {
                // shoppingImpact entered as estimated kg CO2
                return Number(activity.shoppingImpact) || 0;
            }
            default:
                return 0;
        }
    }

    function addActivityToList(activity, impactKg) {
        const li = document.createElement('li');
        li.className = 'activity-item';
        const icon = {
            transport: '<i class="fas fa-car"></i>',
            diet: '<i class="fas fa-utensils"></i>',
            energy: '<i class="fas fa-bolt"></i>',
            shopping: '<i class="fas fa-shopping-bag"></i>'
        }[activity.category] || '<i class="fas fa-circle"></i>';

        const description = (activity.category === 'transport')
            ? `${activity.transportType || ''} (${(Number(activity.distance) || 0).toFixed(1)} km)`
            : (activity.category === 'diet')
                ? `${activity.mealType || ''} meal`
                : (activity.category === 'energy')
                    ? `${(Number(activity.energyAmount) || 0).toFixed(1)} kWh`
                    : (activity.category === 'shopping')
                        ? (activity.shoppingDesc || 'Shopping')
                        : 'Activity';

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
        } else if (category === 'shopping') {
            activity.shoppingDesc = shoppingDesc.value;
            activity.shoppingImpact = Number(shoppingImpact.value) || 0;
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
        shoppingFields.style.display = 'none';
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
        if(!el) return;
        if (state.badges[badgeKey].earned) {
            el.classList.remove('locked');
            el.classList.add('earned');
            // update tooltip to show earned
            const tt = el.querySelector('.badge-tooltip');
            if(tt) tt.innerHTML = `${prettyName(badgeKey)}<br><small class="earned-text">Badge earned</small>`;
        } else {
            el.classList.remove('earned');
            el.classList.add('locked');
            const tt = el.querySelector('.badge-tooltip');
            if(tt) {
                // show prereq stored in data attribute
                const prereq = el.getAttribute('data-prereq') || '';
                tt.innerHTML = `${prettyName(badgeKey)}<br><small class="prereq">${prereq}</small>`;
            }
        }
    }

    function prettyName(key){
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
        const total = totals.transport + totals.diet + totals.energy + totals.shopping;
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
            } else if (category === 'shopping') {
                activity.shoppingDesc = shoppingDesc.value;
                activity.shoppingImpact = Number(shoppingImpact.value) || 0;
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
            } else if (category === 'shopping') {
                const desc = (activity.shoppingDesc || '').toLowerCase();
                if (desc.includes('recycle') || desc.includes('recycling') || desc.includes('reused') || desc.includes('upcycle')) {
                    state.badges.recycling_champion.recycle_actions += 1;
                }
            } else if (category === 'energy') {
                if ((activity.energyType || '').toLowerCase() === 'renewable') {
                    state.badges.energy_saver.renewable_uses += 1;
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
            shoppingFields.style.display = 'none';
        });
    }

    // ensure resetAnalytics also resets badges
    const originalReset = resetAnalytics;
    resetAnalytics = function() {
        originalReset();
        resetBadges();
    };

    // initial badge UI setup
    Object.keys(state.badges).forEach(updateBadgeUI);

    // ...existing code below...
});