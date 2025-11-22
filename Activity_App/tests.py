from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
import json
import time

from django.contrib.staticfiles.testing import StaticLiveServerTestCase

try:
	from selenium import webdriver
	from selenium.webdriver.common.by import By
	from selenium.webdriver.chrome.options import Options
	from selenium.webdriver.support.ui import WebDriverWait
	from selenium.webdriver.support import expected_conditions as EC
	from webdriver_manager.chrome import ChromeDriverManager
	from selenium.webdriver.chrome.service import Service as ChromeService
	SELENIUM_AVAILABLE = True
except Exception:
	SELENIUM_AVAILABLE = False


class ActivityApiSmokeTests(TestCase):
	def setUp(self):
		User = get_user_model()
		self.user = User.objects.create_user(username='testuser', password='password')
		self.client = Client()

	def test_add_diet_activity_and_list(self):
		# login first
		logged = self.client.login(username='testuser', password='password')
		self.assertTrue(logged)

		add_url = reverse('Activity_App:add_activity')
		list_url = reverse('Activity_App:list_activities')

		# simulate selecting a meal option (vegan)
		payload = {
			'category': 'diet',
			'type': 'vegan',
			'date': '2025-11-22',
			'impact': '1.50'
		}

		resp = self.client.post(add_url, data=json.dumps(payload), content_type='application/json')
		self.assertEqual(resp.status_code, 200)
		data = resp.json()
		self.assertTrue(data.get('success'))

		# now list activities and ensure counts reflect the new entry
		resp2 = self.client.get(list_url)
		self.assertEqual(resp2.status_code, 200)
		data2 = resp2.json()
		self.assertTrue(data2.get('success'))
		counts = data2.get('counts') or {}
		# diet count should be at least 1
		self.assertGreaterEqual(int(counts.get('diet', 0)), 1)

	def test_add_energy_activity_and_list(self):
		self.client.login(username='testuser', password='password')
		add_url = reverse('Activity_App:add_activity')
		list_url = reverse('Activity_App:list_activities')

		payload = {
			'category': 'energy',
			'type': 'electricity',
			'amount': '5.0',
			'date': '2025-11-22',
			'impact': '2.50'
		}

		resp = self.client.post(add_url, data=json.dumps(payload), content_type='application/json')
		self.assertEqual(resp.status_code, 200)
		self.assertTrue(resp.json().get('success'))

		resp2 = self.client.get(list_url)
		self.assertEqual(resp2.status_code, 200)
		self.assertTrue(resp2.json().get('success'))
		counts = resp2.json().get('counts') or {}
		self.assertGreaterEqual(int(counts.get('energy', 0)), 1)


class ActivityUiSelectionSmokeTest(StaticLiveServerTestCase):
	"""Headless browser smoke test to ensure visual selection is cleared after adding."""
	@classmethod
	def setUpClass(cls):
		super().setUpClass()
		if not SELENIUM_AVAILABLE:
			raise RuntimeError('Selenium not available')
		chrome_options = Options()
		chrome_options.add_argument('--headless=new')
		chrome_options.add_argument('--disable-gpu')
		chrome_options.add_argument('--no-sandbox')
		chrome_options.add_argument('--window-size=1200,800')
		service = ChromeService(ChromeDriverManager().install())
		cls.driver = webdriver.Chrome(service=service, options=chrome_options)
		cls.driver.implicitly_wait(5)

	@classmethod
	def tearDownClass(cls):
		try:
			cls.driver.quit()
		except Exception:
			pass
		super().tearDownClass()

	def test_selection_cleared_after_add_meal(self):
		# Open the activity page
		url = f"{self.live_server_url}{reverse('Activity_App:activity')}"
		self.driver.get(url)

		# Click the Diet column to open the diet form
		diet_col = self.driver.find_element(By.CSS_SELECTOR, '.selection-column[data-category="diet"]')
		diet_col.click()

		# Wait for diet form to be visible
		WebDriverWait(self.driver, 5).until(
			EC.visibility_of_element_located((By.ID, 'diet-form'))
		)

		# Click the first meal option card
		meal_card = self.driver.find_element(By.CSS_SELECTOR, '#diet-form .radio-option.large')
		meal_card.click()

		# ensure it has 'selected' class
		classes = meal_card.get_attribute('class')
		self.assertIn('selected', classes)

		# Click the Add button (unauthenticated path should save locally and call resetForm)
		add_btn = self.driver.find_element(By.CSS_SELECTOR, '#diet-form .add-activity')
		add_btn.click()

		# small wait for JS to run and clear selection
		time.sleep(0.8)

		# the meal card should no longer have 'selected'
		classes_after = meal_card.get_attribute('class')
		self.assertNotIn('selected', classes_after)

