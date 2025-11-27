from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from Challenges_App.models import Challenge, UserChallenge
import json


class DashboardPointsTests(TestCase):
	def setUp(self):
		User = get_user_model()
		self.user = User.objects.create_user(username='pointuser', password='pass')
		# create a challenge worth 7 points
		self.challenge = Challenge.objects.create(title='Points Challenge', description='Earn points', points=7)
		self.client = Client()

	def test_points_reflect_completed_challenges(self):
		# mark the challenge as completed for the user
		uc = UserChallenge.objects.create(user=self.user, challenge=self.challenge, completed=True)

		# login and request dashboard status
		logged_in = self.client.login(username='pointuser', password='pass')
		self.assertTrue(logged_in)
		resp = self.client.get('/dashboard/api/status/')
		self.assertEqual(resp.status_code, 200)
		data = resp.json()
		self.assertTrue(data.get('success'))
		# points should equal the challenge points (7)
		self.assertEqual(int(data.get('points', 0)), 7)
