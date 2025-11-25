from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from .models import Challenge, UserChallenge
import json


class ChallengesApiTests(TestCase):
	def setUp(self):
		User = get_user_model()
		self.user = User.objects.create_user(username='chaltest', password='pass')
		self.challenge = Challenge.objects.create(title='Test Challenge', description='Do something', points=5)
		self.client = Client()

	def test_list_and_toggle(self):
		self.client.login(username='chaltest', password='pass')
		resp = self.client.get('/challenges/api/list/')
		self.assertEqual(resp.status_code, 200)
		data = resp.json()
		self.assertTrue(data.get('success'))
		# toggle completion on
		resp2 = self.client.post('/challenges/api/toggle/', data=json.dumps({'challenge_id': self.challenge.id, 'completed': True}), content_type='application/json')
		self.assertEqual(resp2.status_code, 200)
		self.assertTrue(resp2.json().get('success'))
		uc = UserChallenge.objects.filter(user=self.user, challenge=self.challenge).first()
		self.assertIsNotNone(uc)
		self.assertTrue(uc.completed)
		# toggle off
		resp3 = self.client.post('/challenges/api/toggle/', data=json.dumps({'challenge_id': self.challenge.id, 'completed': False}), content_type='application/json')
		self.assertEqual(resp3.status_code, 200)
		self.assertFalse(UserChallenge.objects.get(user=self.user, challenge=self.challenge).completed)
