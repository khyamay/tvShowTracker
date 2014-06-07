var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var async = require('async');
var request = require('request');
var xml2js = require('xml2js');
var _ = require('lodash');

var showSchema = new mongoose.Schema({
	_id: Number,
	name: String,
	airsDayofWeek: String,
	airsTime: String,
	firstAired: Date,
	genre: [String],
	network: String,
	overview: String,
	rating: Number,
	ratingCount: String,
	status: String,
	poster: String,
	subscribers:[{
		type: mongoose.Schema.Types.ObjectId, ref: 'User'
	}],
	episodes:[{
		season: Number,
		episodeNumber: Number,
		episodeName: String,
		firstAired: Date,
		overview: String
	}]
});

var userSchema = new mongoose.Schema({
	email: {type: String, unique: true},
	password: String
});

userSchema.pre('save', function(next){
	var user = this;
	if(!user.isModified('password')) return next();
	bcrypt.genSalt(10, function(err, salt){
		if (err) return next(err);
		bcrypt.hash(user.password, salt, function(err, hash){
			if(err) return next(err);
			user.password = hash;
			next();
		});
	});
});

userSchema.methods.comparePassword = function(candidatePassword, cd){

	bcrypt.compare(candidatePassword, this.password, function(err, isMatch){
		if(err) return cb(err);
		cb(null, isMatch);
	})
}

var User = mongoose.model('User', userSchema);
var Show = mongoose.model('Show', showSchema);

mongoose.connect('localhost');

var app = express();

app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/shows', function(req, res, next){
	var query = Show.find();
	if(req.query.genre){
		query.where({genre: req.query.genre});
	} else if (req.query.alphabet) {
		query.where({ name: new RegExp('^' + '[' + req.query.alphabet + ']', 'i')});
	} else {
		query.limit(12);
	}

	query.exec(function(err, shows){
		if(err) return next(err);
		res.send(shows);
	})

});
app.get('/api/shows/:id', function(req, res, next) {
  Show.findById(req.params.id, function(err, show) {
    if (err) return next(err);
    res.send(show);
  });
});

app.post('/api/shows', function(req, res, next){
	var apiKey = '9EF1D1E7D28FDA0B';
	var parser = xml2js.Parser({
		explicitArray: false;
		normalizeTags: true,
	});

	var seriesName = req.body.showName
		.toLowerCase()
		.replace(/ /g,  '_')
		.replace(/[^\w-]+/g, '');;

	async.waterfall([
		function(callback){
			request.get('http://thetvdb.com/api/GetSeries.php?seriesname=' + seriesName, function(error, response, body){
				if(error) return next(error);
				parser.parseString(body, function(err, result){
					var seriesId = result.data.series.seriesid || result.data.series[0].seriesid;
					callback(err, seriesid);
				});
			});
		},

		function(seriesId, callback){
			request.get('http://thetvdb.com/api/' + apiKey + '/series' + seriesId + '/all/en.xml', function(error, response, body){
				if (error) return next(error);
				parser.parseString(body, function(err, result){
					var series = result.data.series;
					var episodes = result.data.episode;
					var show = new Show({
						_id: series.id,
						name: series.series.name,
						airsDayofWeek: series.airs_time,
						firstAired: series.firstaired,
						genre: series.genre.split('|').filter(Boolean),
						network: series.network,
						overview: series.overview,
						rating: series.rating,
						ratingCount: series.ratingcount,
						runtime: series.runtime,
						status: series.status,
						poster: series.poster,
						episdoe:[]
					});
					_.each(episodes, function(episode){
						show.episodes.push({
							season: episdoe.seasonnumber,
							episodeNumber: episode.episodenumber,
							episodeName: episode.episodename,
							firstAired: episode.firstaired,
							overview: episode.overview
						});
					});
					callback(err, show);
				});
			});
		},
		function(show, callback){
			var url = 'http://thetvdb.com/banners/' + show.poster;
			request({ url: url, encoding: null}, function(error, response, body){
				show.poster = 'data:' + response.headers['content-type'] + ';base64,' + body.toString('base64');
				callback(error, show);
			});
		}

		], function(err, show){
			if (err) return next(err);
			show.save(function(err){
				if (err) return next(err);
				res.send(200);
			});
		});
});

app.get('*', function(req, res){
	res.redirect('/#' + req.originalUrl);
});

app.use(function(err, req, res, next){
	console.log(err.stack);
	res.send(500, {message: err.message});
});

app.listen(app.get('port'), function(){
	console.log('Express server listening on port '+ app.get('port'));
});