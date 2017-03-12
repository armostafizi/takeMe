import os
import re
import random
import hashlib
import hmac
import logging
import urllib
import urllib2
import urlparse
import json
import webapp2
import jinja2
import time
from datetime import datetime
from google.appengine.ext import db
from string import letters



template_dir = os.path.join(os.path.dirname(__file__), 'templates')
jinja_env = jinja2.Environment(loader = jinja2.FileSystemLoader(template_dir),
							   autoescape = True)

SECRET = 'atie'
API_KEY = 'AIzaSyBHh_0g15kFsYjOqpjNUETasu2DxXfUdvk'

DEBUG = bool(os.environ['SERVER_SOFTWARE'].startswith('Development'))
if DEBUG:
	logging.getLogger().setLevel(logging.DEBUG)

# def render_str(template, **params):
# 	t = jinja_env.get_template(template)
# 	return t.render(params)

def make_secure_val(val):
	return '%s|%s' % (val, hmac.new(SECRET, val).hexdigest())

def check_secure_val(secure_val):
	val = secure_val.split('|')[0]
	if secure_val == make_secure_val(val):
		return val

class Handler(webapp2.RequestHandler):
	def write(self, *a, **kw):
		self.response.out.write(*a, **kw)

	def render_str(self, template, **params):
		params['user'] = self.user
		t = jinja_env.get_template(template)
		return t.render(params)

	def render(self, template, **kw):
		self.write(self.render_str(template, **kw))

	def render_json(self, d):
		json_txt = json.dumps(d)
		self.response.headers['Content-Type'] = 'application/json; charset=UTF-8'
		self.write(json_txt)

	def set_secure_cookie(self, name, val):
		cookie_val = make_secure_val(val)
		self.response.headers.add_header(
			'Set-Cookie',
			'%s=%s; Path=/' % (name, cookie_val))

	def read_secure_cookie(self, name):
		cookie_val = self.request.cookies.get(name)
		return cookie_val and check_secure_val(cookie_val)

	def login(self, user):
		self.set_secure_cookie('user_id', str(user.key().id()))

	def logout(self):
		self.response.headers.add_header('Set-Cookie', 'user_id=; Path=/')

	def initialize(self, *a, **kw):
		webapp2.RequestHandler.initialize(self, *a, **kw)
		uid = self.read_secure_cookie('user_id')
		self.user = uid and User.by_id(int(uid))

		if self.request.url.endswith('.json'):
			self.format = 'json'
		else:
			self.format = 'html'


##### user stuff
def make_salt(length = 5):
	return ''.join(random.choice(letters) for x in xrange(length))

def make_pw_hash(name, pw, salt = None):
	if not salt:
		salt = make_salt()
	h = hashlib.sha256(name + pw + salt).hexdigest()
	return '%s,%s' % (salt, h)

def valid_pw(name, password, h):
	salt = h.split(',')[0]
	return h == make_pw_hash(name, password, salt)

def users_key(group = 'default'):
	return db.Key.from_path('users', group)




class User(db.Model):
	name = db.StringProperty(required = True)
	pw_hash = db.StringProperty(required = True)
	email = db.StringProperty(required = True)

	@classmethod
	def by_id(cls, uid):
		return User.get_by_id(uid, parent = users_key())

	@classmethod
	def by_name(cls, name):
		u = User.all().filter('name =', name).get()
		return u
	
	@classmethod
	def by_email(cls, email):
		u = User.all().filter('email =', email).get()
		return u

	@classmethod
	def register(cls, name, pw, email = None):
		pw_hash = make_pw_hash(name, pw)
		return User(parent = users_key(), name = name, 
										  pw_hash = pw_hash,
										  email = email)

	@classmethod
	def login(cls, name, pw):
		u = cls.by_name(name)
		if u and valid_pw(name, pw, u.pw_hash):
			return u




def offers_key(group = 'default'):
	return db.Key.from_path('offers', group)

class Offer(db.Model):
	origin = db.GeoPtProperty(required = True)
	destination = db.GeoPtProperty(required = True)
	start_time = db.DateTimeProperty(required = True)
	end_time = db.DateTimeProperty(required = True)
	price = db.FloatProperty(required = True)
	user_id = db.StringProperty(required = True)
	created = db.DateTimeProperty(auto_now_add = True)

	# def render(self):
	# 	self._render_text = self.content.replace('\n', '<br>')
	# 	return render_str("post.html", p = self)

	def as_dict(self):
		time_fmt = '%c'
		d = {'origin': self.origin,
			 'destination': self.destination,
			 'start_time' : self.start_time.strftime(time_fmt),
			 'end_time' : self.end_time.strftime(time_fmt),
			 'price' : self.price,
			 'user_id' : self.user_id,
			 'created': self.created.strftime(time_fmt) }
		return d


def requests_key(group = 'default'):
	return db.Key.from_path('requests', group)

class Request(db.Model):
	origin = db.GeoPtProperty(required = True)
	destination = db.GeoPtProperty(required = True)
	start_time = db.DateTimeProperty(required = True)
	end_time = db.DateTimeProperty(required = True)
	price = db.FloatProperty(required = True)
	user_id = db.StringProperty(required = True)
	created = db.DateTimeProperty(auto_now_add = True)

	# def render(self):
	# 	self._render_text = self.content.replace('\n', '<br>')
	# 	return render_str("post.html", p = self)

	def as_dict(self):
		time_fmt = '%c'
		d = {'origin': self.origin,
			 'destination': self.destination,
			 'start_time' : self.start_time.strftime(time_fmt),
			 'end_time' : self.end_time.strftime(time_fmt),
			 'price' : self.price,
			 'user_id' : self.user_id,
			 'created': self.created.strftime(time_fmt) }
		return d


class MainPage(Handler):
	def get(self):
		if self.user:
			self.render('front.html', username = self.user.name)
		else:
			self.render('front.html', username = "")


USER_RE = re.compile(r"^[a-zA-Z0-9_-]{3,20}$")
def valid_username(username):
	return username and USER_RE.match(username)

PASS_RE = re.compile(r"^.{3,20}$")
def valid_password(password):
	return password and PASS_RE.match(password)

EMAIL_RE  = re.compile(r'^[\S]+@[\S]+\.[\S]+$')
def valid_email(email):
	return email and EMAIL_RE.match(email)

	
def registeration(username, password, verify, email):
	have_error = False;
	errors = [];

	if not valid_username(username):
		errors.append('username_val')
		have_error = True
	
	if not valid_password(password):
		errors.append('password')
		have_error = True
	
	elif password != verify:
		errors.append('verify')
		have_error = True

	if not valid_email(email):
		errors.append('email_val')
		have_error = True

	if have_error:
		return errors
	else:
		u = User.by_name(username)
		if u:
			errors.append('username_exst')
		u = User.by_email(email)
		if u:
			errors.append('email_exst')
		return errors



class Signup(Handler):
	def post(self):
		username = self.request.get('username')
		password = self.request.get('password')
		verify = self.request.get('verify')
		email = self.request.get('email')

		logging.error(username)
		logging.error(password)
		logging.error(verify)
		logging.error(email)


		errors = registeration(username = username,
							   password = password,
							   verify = verify,
							   email = email)

		if errors:
			reply = dict(signed_up = False,
						 errors = errors)
			self.render_json(reply)

		else:
			u = User.register(username, password, email)
			u.put()
			time.sleep(0.5)
			self.login(u)

			reply = dict(signed_up = True,
						 username = username)
			self.render_json(reply)


class Login(Handler):
	def post(self):
		username = self.request.get('username')
		password = self.request.get('password')

		u = User.login(username, password)
		if u:
			self.login(u)
			reply = dict(logged_in = True,
						 username = username)
			self.render_json(reply)

		else:
			reply = dict(logged_in = False)
			self.render_json(reply)


class Logout(Handler):
	def post(self):
		self.logout()
		reply = dict(logged_out = True)
		self.render_json(reply)   

def coordinates(origin, destination):
	origin_content = geo_code(origin)
	orig_coordinates = parse_json(origin_content)

	destination_content = geo_code(destination)
	dest_coordinates = parse_json(destination_content)

	return orig_coordinates, dest_coordinates

def travel_validate(travel):

	try :
		travel.start_time_formatted = datetime.strptime(travel.start_time,'%m/%d/%Y %I:%M %p')
	except:
		travel.start_time_formatted = None
	try:
		travel.end_time_formatted = datetime.strptime(travel.end_time,'%m/%d/%Y %I:%M %p')
	except:
		travel.end_time_formatted = None
	try:
		travel.price_formatted = float(travel.price)
	except:
		travel.price_formatted = None

	travel.orig_coordinates, travel.dest_coordinates = coordinates(travel.origin, travel.destination)

	have_error, errors = travel_error_check(travel)

	return have_error, errors, travel

class Travel:
	def __init__(self, origin = None,
					   orig_coordinates = None,
					   destination = None,
					   dest_coordinates = None,
					   start_time = None,
					   start_time_formatted = None,
					   end_time = None,
					   end_time_formatted = None,
					   price = None,
					   price_formatted = None):
		self.origin = origin
		self.orig_coordinates = orig_coordinates
		self.destination = destination
		self.dest_coordinates = dest_coordinates
		self.start_time = start_time
		self.start_time_formatted = start_time_formatted
		self.end_time = end_time
		self.end_time_formatted = end_time_formatted
		self.price = price
		self.price_formatted = price_formatted

		

def travel_error_check(travel):
	have_error = False
	errors = []

	if not travel.start_time_formatted:
		errors.append('start_time_val')
		have_error = True
	if not travel.end_time_formatted:
		errors.append('end_time_val')
		have_error = True
	if travel.start_time_formatted and travel.end_time_formatted and travel.end_time_formatted < travel.start_time_formatted:
		errors.append('time_order')
		have_error = True
	if not travel.price_formatted:
		errors.append('price_val')
		have_error = True
	if not travel.orig_coordinates:
		errors.append('orig_adrs_val')
		have_error = True
	if not travel.dest_coordinates:
		errors.append('dest_adrs_val')
		have_error = True

	return have_error, errors




class OfferHandler(Handler):
	def post(self):
		start_time = self.request.get('start_time')
		end_time = self.request.get('end_time')
		origin = self.request.get('origin')
		destination = self.request.get('destination')
		price = self.request.get('price')

		travel = Travel(start_time = start_time,
						end_time = end_time,
						origin = origin,
						destination = destination,
						price = price)

		have_error, errors, travel = travel_validate(travel)
		
		if have_error:
			reply = dict(travel_error = True,
						 errors = errors)
		else:
			orig_lat, orig_lon = travel.orig_coordinates
			dest_lat, dest_lon = travel.dest_coordinates
			map_url = map_api(orig_lat, orig_lon, dest_lat, dest_lon);

			reply = dict(travel_error = False,
						 start_time = start_time,
						 end_time = end_time,
						 price = price,
						 origin = origin,
						 orig_lat = orig_lat,
						 orig_lon = orig_lon,
						 destination = destination,
						 dest_lat = dest_lat,
						 dest_lon = dest_lon,
						 map_url = map_url)
		self.render_json(reply)


class RequestHandler(Handler):
	def post(self):
		start_time = self.request.get('start_time')
		end_time = self.request.get('end_time')
		origin = self.request.get('origin')
		destination = self.request.get('destination')
		price = self.request.get('price')

		travel = Travel(start_time = start_time,
						end_time = end_time,
						origin = origin,
						destination = destination,
						price = price)

		have_error, errors, travel = travel_validate(travel)
		
		if have_error:
			reply = dict(travel_error = True,
						 errors = errors)
		else:
			orig_lat, orig_lon = travel.orig_coordinates
			dest_lat, dest_lon = travel.dest_coordinates
			map_url = map_api(orig_lat, orig_lon, dest_lat, dest_lon);
			
			reply = dict(travel_error = False,
						 start_time = start_time,
						 end_time = end_time,
						 price = price,
						 origin = origin,
						 orig_lat = orig_lat,
						 orig_lon = orig_lon,
						 destination = destination,
						 dest_lat = dest_lat,
						 dest_lon = dest_lon,
						 map_url = map_url)
		self.render_json(reply)


class RequestConfirm(Handler):
	def post(self):
		start_time = self.request.get('start_time')
		end_time = self.request.get('end_time')
		origin = self.request.get('origin')
		# orig_lat = self.request.get('orig_lat')
		# orig_lon = self.request.get('orig_lon')
		destination = self.request.get('destination')
		# dest_lat = self.request.get('dest_lat')
		# dest_lon = self.request.get('dest_lon')
		price = self.request.get('price')

		travel = Travel(start_time = start_time,
						end_time = end_time,
						origin = origin,
						destination = destination,
						price = price)

		have_error, errors, travel = travel_validate(travel)
		
		if have_error:
			reply = dict(request_post_succeed = False,
						 errors = errors)
		else:
			if not self.user:
				reply = dict(request_post_succeed = False,
							 errors = ['not_logged_in'])
			else:
				request = self.post_on_database(travel)
				reply = dict(request_post_succeed = True,
							 orig_lat = request.origin.lat,
							 orig_lon = request.origin.lon,

							 dest_lat = request.destination.lat,
							 dest_lon = request.destination.lon,

							 start_time = request.start_time.strftime('%c'),
							 end_time = request.end_time.strftime('%c'),
							 price = request.price)

		self.render_json(reply)


	def post_on_database(self, travel):
		user_id = str(self.user.key().id())
		ox, oy = travel.orig_coordinates
		dx, dy = travel.dest_coordinates
		r = Request(parent = requests_key(), origin = db.GeoPt(str(ox)+','+str(oy)),
											 destination = db.GeoPt(str(dx)+','+str(dy)),
											 start_time = travel.start_time_formatted,
											 end_time = travel.end_time_formatted,
											 price = travel.price_formatted,
											 user_id = user_id)
		r.put()
		time.sleep(0.5)
		return r
		#self.redirect('/request/%s' % str(r.key().id()))



class OfferConfirm(Handler):
	def post(self):
		start_time = self.request.get('start_time')
		end_time = self.request.get('end_time')
		origin = self.request.get('origin')
		# orig_lat = self.request.get('orig_lat')
		# orig_lon = self.request.get('orig_lon')
		destination = self.request.get('destination')
		# dest_lat = self.request.get('dest_lat')
		# dest_lon = self.request.get('dest_lon')
		price = self.request.get('price')

		travel = Travel(start_time = start_time,
						end_time = end_time,
						origin = origin,
						destination = destination,
						price = price)

		have_error, errors, travel = travel_validate(travel)
		
		if have_error:
			reply = dict(offer_post_succeed = False,
						 errors = errors)
		else:
			if not self.user:
				reply = dict(offer_post_succeed = False,
							 errors = ['not_logged_in'])
			else:
				offer = self.post_on_database(travel)
				reply = dict(offer_post_succeed = True,
							 orig_lat = offer.origin.lat,
							 orig_lon = offer.origin.lon,

							 dest_lat = offer.destination.lat,
							 dest_lon = offer.destination.lon,

							 start_time = offer.start_time.strftime('%c'),
							 end_time = offer.end_time.strftime('%c'),
							 price = offer.price)

		self.render_json(reply)


	def post_on_database(self, travel):
		user_id = str(self.user.key().id())
		ox, oy = travel.orig_coordinates
		dx, dy = travel.dest_coordinates
		o = Offer(parent = offers_key(), origin = db.GeoPt(str(ox)+','+str(oy)),
										 destination = db.GeoPt(str(dx)+','+str(dy)),
										 start_time = travel.start_time_formatted,
										 end_time = travel.end_time_formatted,
										 price = travel.price_formatted,
										 user_id = user_id)
		o.put()
		time.sleep(0.5)
		return o
		#self.redirect('/request/%s' % str(r.key().id()))


class RequestRenderer(Handler):
	def get(self, request_id):
		key = db.Key.from_path('Request', int(request_id), parent=requests_key())
		request = db.get(key)

		if not request:
			self.error(404)
			return

		user_id = request.user_id
		origin = request.origin
		destination = request.destination
		start_time = request.start_time.strftime('%c')
		end_time = request.end_time.strftime('%c')
		price = request.price

		key = db.Key.from_path('User', int(user_id), parent = users_key())
		user = db.get(key)

		username = user.name


		if self.format == 'html':
			self.render('submitted-request.html', username = username,
												  origin = origin,
												  destination = destination,
												  start_time = start_time,
												  end_time = end_time,
												  price = price,
												  user_id = user_id)
		# 	self.render("permalink.html", post = post)
		# else:
		# 	self.response.headers['Content-Type'] = 'application/json; charset=UTF-8'
		# 	self.write(origin_content)
		# 	self.render_json(post.as_dict())

class OfferRenderer(Handler):
	def get(self, offer_id):
		key = db.Key.from_path('Offer', int(offer_id), parent=offers_key())
		offer = db.get(key)

		if not offer:
			self.error(404)
			return

		user_id = offer.user_id
		origin = offer.origin
		destination = offer.destination
		start_time = offer.start_time.strftime('%c')
		end_time = offer.end_time.strftime('%c')
		price = offer.price

		key = db.Key.from_path('User', int(user_id), parent = users_key())
		user = db.get(key)

		username = user.name


		if self.format == 'html':
			self.render('submitted-offer.html', username = username,
												origin = origin,
												destination = destination,
												start_time = start_time,
												end_time = end_time,
												price = price,
												user_id = user_id)
			#self.render("permalink.html", post = post)
		# else:
		# 	self.render_json(post.as_dict())

def parse_json(text):
	if text:
		content = json.loads(text)
		if content['status'] == 'OK' :
			result = content['results']
			result = result[0]
			result = result['geometry']
			location = result['location']
			lat = location['lat'];
			lon = location['lng'];

			return lat, lon


MAP_API_URL = "https://www.google.com/maps/embed/v1/directions?"
def map_api(orig_lat,
			orig_lon,
			dest_lat,
			dest_lon):
	url = MAP_API_URL + 'key=%s' % API_KEY + '&'
	url = url + 'origin=%s,%s' % (orig_lat, orig_lon) + '&'
	url = url + 'destination=%s,%s' % (dest_lat, dest_lon) + '&'
	url = url + 'mode=driving'

	return url




GEOCODE_API_URL = "https://maps.googleapis.com/maps/api/geocode/json?"
def geo_code(address):
	address = address.replace(" ", "+")
	url = GEOCODE_API_URL + 'address=%s' % address + '&'
	url = url + 'key=' + API_KEY

	try:
		content = urllib2.urlopen(url).read()
	except URLError:
		return

	return content



app = webapp2.WSGIApplication([('/', MainPage),
							   #('/?(?:.json)?', MainPage),
							   #('/([0-9]+)(?:.json)?', PostPage),
							   #('/request/([0-9]+)', RequestRenderer),
							   #('/offer/([0-9]+)', OfferRenderer),
							   ('/signup', Signup),
							   ('/login', Login),
							   ('/logout', Logout),
							   ('/offer', OfferHandler),
							   ('/offer/confirm', OfferConfirm),
							   ('/request', RequestHandler),
							   ('/request/confirm', RequestConfirm)],
							   debug=DEBUG)
