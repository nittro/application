_context.invoke('Utils', function (undefined) {

    var DateInterval = function (interval) {
        this._ = {
            initialized: false,
            interval: interval
        };
    };

    DateInterval.from = function (interval) {
        return new DateInterval(interval);

    };

    var intervalNames = [
        'year',
        'month',
        'week',
        'day',
        'hour',
        'minute',
        'second',
        'millisecond'
    ];

    var intervalLengths = [
        31536000000,
        604800000,
        2678400000,
        86400000,
        3600000,
        60000,
        1000,
        1
    ];

    var intervalHelpers = [
        { pattern: /^y(?:ears?)?$/, toString: function(n) { return n === 1 ? 'year' : 'years' } },
        { pattern: /^mon(?:ths?)?$/, toString: function(n) { return n === 1 ? 'month' : 'months' } },
        { pattern: /^w(?:eeks?)?$/, toString: function(n) { return n === 1 ? 'week' : 'weeks' } },
        { pattern: /^d(?:ays?)?$/, toString: function(n) { return n === 1 ? 'day' : 'days' } },
        { pattern: /^h(?:ours?)?$/, toString: function(n) { return n === 1 ? 'hour' : 'hours' } },
        { pattern: /^min(?:utes?)?$/, toString: function(n) { return n === 1 ? 'minute' : 'minutes' } },
        { pattern: /^s(?:ec(?:onds?)?)?$/, toString: function(n) { return n === 1 ? 'second' : 'seconds' } },
        { pattern: /^millis(?:econds?)?$|^ms$/, toString: function(n) { return n === 1 ? 'millisecond' : 'milliseconds' } }
    ];


    var separators = [', ', ' and '];


    DateInterval.setHelpers = function (helpers) {
        // @todo check helpers are valid
        intervalHelpers = helpers;

    };

    DateInterval.setSeparators = function (separator, last) {
        separators = [separator, last];

    };

    function getValue(interval) {
        if (typeof interval === 'number') {
            return interval;
        } else if (interval instanceof DateInterval) {
            return interval.getLength();
        } else {
            return DateInterval.from(interval).getLength();
        }
    }

    DateInterval.prototype.add = function (interval) {
        this._initialize();
        this._.interval += getValue(interval);
        return this;

    };

    DateInterval.prototype.subtract = function (interval) {
        this._initialize();
        this._.interval -= getValue(interval);
        return this;

    };

    DateInterval.prototype.isNegative = function () {
        this._initialize();
        return this._.interval < 0;

    };

    DateInterval.prototype.getLength = function () {
        this._initialize();
        return this._.interval;

    };

    DateInterval.prototype.valueOf = function () {
        return this.getLength();

    };


    function formatAuto(interval, precision) {
        if (precision === true) {
            precision = intervalNames.length;

        } else if (!precision) {
            precision = 2;

        }

        var i, v, str = [], last, sign = '';

        if (interval < 0) {
            sign = '-';
            interval = -interval;

        }

        for (i = 0; i < intervalNames.length; i++) {
            if (interval >= intervalLengths[i]) {
                precision--;
                v = interval / intervalLengths[i];
                v = precision === 0 ? Math.round(v) : Math.floor(v);
                str.push(v + ' ' + intervalHelpers[i].toString(v));
                interval -= v * intervalLengths[i];

                if (precision === 0) {
                    break;

                }
            }
        }

        if (str.length > 2) {
            last = str.pop();
            return sign + str.join(separators[0]) + (separators[1] || separators[0]) + last;

        } else {
            return sign + str.join(separators[1] || separators[0]);

        }
    }

    function format(interval, pattern) {
        var sign = interval < 0 ? '-' : '+';
        interval = Math.abs(interval);

        return (pattern + '').replace(/%(.)/g, function (m, f) {
            var v, pad = false;

            switch (f) {
                case '%':
                    return '%';

                case 'y':
                    m = intervalLengths[0];
                    break;

                case 'w':
                    m = intervalLengths[1];
                    break;

                case 'm':
                    pad = true;
                case 'n':
                    m = intervalLengths[2];
                    break;

                case 'd':
                    pad = true;
                case 'j':
                    m = intervalLengths[3];
                    break;

                case 'H':
                    pad = true;
                case 'G':
                    m = intervalLengths[4];
                    break;

                case 'i':
                    pad = true;
                case 'I':
                    m = intervalLengths[5];
                    break;

                case 's':
                    pad = true;
                case 'S':
                    m = intervalLengths[6];
                    break;

                case '-':
                    return sign === '-' ? sign : '';

                case '+':
                    return sign;

                default:
                    throw new Error('Unknown format modifier: %' + f);

            }

            v = Math.floor(interval / m);
            interval -= m * v;
            return pad && v < 10 ? '0' + v : v;

        });
    }

    DateInterval.prototype.format = function (pattern) {
        this._initialize();

        if (typeof pattern === 'boolean' || typeof pattern === 'number' || !pattern) {
            return formatAuto(this._.interval, pattern);

        } else {
            return format(this._.interval, pattern);

        }
    };

    DateInterval.prototype._initialize = function () {
        if (this._.initialized) {
            return;
        }

        this._.initialized = true;

        if (typeof this._.interval === 'number') {
            return;

        }

        var interval = this._.interval;

        if (interval instanceof DateInterval) {
            this._.interval = interval.getLength();

        } else if (typeof interval === 'string') {
            if (interval.match(/^\s*(?:\+|-)?\s*\d+\s*$/)) {
                this._.interval = parseInt(interval.trim());

            } else {
                var res = 0,
                    sign = 1,
                    rest;

                rest = interval.replace(/\s*(\+|-)?\s*(\d+)\s+(\S+)\s*/g, function (m, s, n, k) {
                    if (s !== undefined) {
                        sign = s === '+' ? 1 : -1;

                    }

                    k = k.toLowerCase();
                    n = parseInt(n) * sign;
                    m = null;

                    for (var i = 0; i < intervalHelpers.length; i++) {
                        if (intervalHelpers[i].pattern.test(k)) {
                            m = intervalLengths[i];
                            break;
                        }
                    }

                    if (m === null) {
                        throw new Error('Unknown keyword: "' + k + '"');

                    }

                    res += n * m;

                    return '';

                });

                if (rest.length) {
                    throw new Error('Invalid interval specification "' + interval + '", didn\'t understand "' + rest + '"');

                }

                this._.interval = res;

            }
        } else {
            throw new Error('Invalid interval specification, expected string, number or a DateInterval instance');

        }
    };

    _context.register(DateInterval, 'DateInterval');

});
;
_context.invoke('Utils', function(Strings, Arrays, DateInterval, undefined) {

	var DateTime = function(d) {
		this._ = {
			initialized: false,
			date: d || new Date()
		};
	};

    DateTime.keywords = {
        weekdays: {
            abbrev: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            full: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        },
        months: {
            abbrev: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            full: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        },
        relative: {
            now: 'now',
            today: 'today',
            tomorrow: 'tomorrow',
            yesterday: 'yesterday',
            noon: 'noon',
            midnight: 'midnight',
            at: 'at'
        }
    };

	DateTime.from = function(s) {
		return new DateTime(s);

	};

	DateTime.now = function () {
		return new DateTime();
	};

	DateTime.isDateObject = function(o) {
		return typeof o === 'object' && o && o.date !== undefined && o.timezone !== undefined && o.timezone_type !== undefined;

	};

	DateTime.isLeapYear = function(y) {
		return y % 4 === 0 && y % 100 !== 0 || y % 400 === 0;

	};

    DateTime.isModifyString = function (str) {
        var kw = DateTime.keywords.relative,
            re = new RegExp('(?:^(?:' + [kw.now, kw.yesterday, kw.tomorrow, kw.today].map(Strings.escapeRegex).join('|') + '))|' + Strings.escapeRegex(kw.noon) + '|' + Strings.escapeRegex(kw.midnight) + '|\\d?\\d(?::\\d\\d|\\s*(?:am|pm))(?:\\d\\d)?(?:\\s*(?:am|pm))?|(?:[-+]\\s*)?\\d+\\s+[^\\d\\s]', 'i');
        return re.test(str);
    };

	DateTime.getDaysInMonth = function(m, y) {
		return m === 2 ? (DateTime.isLeapYear(y) ? 29 : 28) : (m in {4:1,6:1,9:1,11:1} ? 30 : 31);

	};

	var ni = function() { throw new Error('Not implemented!'); },
		pad = function(n) {
			return (n < 10) ? '0' + n : n;
		};

	var formatTz = function (offset) {
		if ((typeof offset === 'string' || offset instanceof String) && offset.match(/(\+|-)\d\d:\d\d/)) {
			return offset;

		}

		if (typeof offset !== 'number') {
			offset = parseInt(offset);

		}

		return (offset < 0 ? '+' : '-') + pad(parseInt(Math.abs(offset) / 60)) + ':' + pad(Math.abs(offset) % 60)

	};

	DateTime.getLocalTzOffset = function () {
		return formatTz(new Date().getTimezoneOffset());

	};

	DateTime.formatModifiers = {
		d: function(d, u) { return pad(u ? d.getUTCDate() : d.getDate()); },
		D: function(d, u) { return DateTime.keywords.weekdays.abbrev[u ? d.getUTCDay() : d.getDay()]; },
		j: function(d, u) { return u ? d.getUTCDate() : d.getDate(); },
		l: function(d, u) { return DateTime.keywords.weekdays.full[u ? d.getUTCDay() : d.getDay()]; },
		N: function(d, u, n) { n = u ? d.getUTCDay() : d.getDay(); return n === 0 ? 7 : n; },
		S: function(d, u, n) { n = u ? d.getUTCDate() : d.getDate(); n %= 10; return n === 0 || n > 3 ? 'th' : ['st', 'nd', 'rd'][n - 1]; },
		w: function(d, u) { return u ? d.getUTCDay() : d.getDay(); },
		z: function(d, u, n, m, y, M) { n = u ? d.getUTCDate() : d.getDate(); n--; y = u ? d.getUTCFullYear() : d.getFullYear(); m = 0; M = u ? d.getUTCMonth() : d.getMonth(); while (m < M) n += DateTime.getDaysInMonth(m++, y); return n; },
		W: ni,
		F: function(d, u) { return DateTime.keywords.months.full[u ? d.getUTCMonth() : d.getMonth()]; },
		m: function(d, u) { return pad((u ? d.getUTCMonth() : d.getMonth()) + 1); },
		M: function(d, u) { return DateTime.keywords.months.abbrev[u ? d.getUTCMonth() : d.getMonth()]; },
		n: function(d, u) { return (u ? d.getUTCMonth() : d.getMonth()) + 1; },
		t: function(d, u) { return DateTime.getDaysInMonth(u ? d.getUTCMonth() : d.getMonth(), u ? d.getUTCFullYear() : d.getFullYear()); },
		L: function(d, u) { return DateTime.isLeapYear(u ? d.getUTCFullYear() : d.getFullYear()) ? 1 : 0; },
		o: ni,
		Y: function(d, u) { return u ? d.getUTCFullYear() : d.getFullYear(); },
		y: function(d, u) { return (u ? d.getUTCFullYear() : d.getFullYear()).toString().substr(-2); },
		a: function(d, u, h) { h = u ? d.getUTCHours() : d.getHours(); return h >= 0 && h < 12 ? 'am' : 'pm'; },
		A: function(d, u) { return DateTime.formatModifiers.a(d, u).toUpperCase(); },
		g: function(d, u, h) { h = u ? d.getUTCHours() : d.getHours(); return h === 0 ? 12 : (h > 12 ? h - 12 : h); },
		G: function(d, u) { return u ? d.getUTCHours() : d.getHours(); },
		h: function(d, u) { return pad(DateTime.formatModifiers.g(d, u)); },
		H: function(d, u) { return pad(u ? d.getUTCHours() : d.getHours()); },
		i: function(d, u) { return pad(u ? d.getUTCMinutes() : d.getMinutes()); },
		s: function(d, u) { return pad(u ? d.getUTCSeconds() : d.getSeconds()); },
		u: function(d, u) { return (u ? d.getUTCMilliseconds() : d.getMilliseconds()) * 1000; },
		e: ni,
		I: ni,
		O: function (d, u) { return DateTime.formatModifiers.P(d, u).replace(':', ''); },
		P: function (d, u) { return u ? '+00:00' : formatTz(d.getTimezoneOffset()); },
		T: ni,
		Z: function (d, u) { return u ? 0 : d.getTimezoneOffset() * -60; },
		c: function (d, u) { return DateTime.from(d).format('Y-m-d\\TH:i:sP', u); },
		r: function (d, u) { return DateTime.from(d).format('D, n M Y G:i:s O', u); },
		U: function(d) { return Math.round(d.getTime() / 1000); }
	};

	DateTime.prototype.format = function(f, utc) {
		this._initialize();

		var d = this._.date,
			pattern = Strings.escapeRegex(Arrays.getKeys(DateTime.formatModifiers).join(',')).replace(/,/g, '|'),
			re = new RegExp('(\\\\*)(' + pattern + ')', 'g');

		return f.replace(re, function(s, c, m) {
			if (c.length % 2) {
				return c.substr(1) + m;

			}

			return c + '' + (DateTime.formatModifiers[m](d, utc));

		});

	};

	[
        'getTime',
        'getDate', 'getDay', 'getMonth', 'getFullYear',
        'getHours', 'getMinutes', 'getSeconds', 'getMilliseconds', 'getTimezoneOffset',
        'getUTCDate', 'getUTCDay', 'getUTCMonth', 'getUTCFullYear',
        'getUTCHours', 'getUTCMinutes', 'getUTCSeconds', 'getUTCMilliseconds',
        'toDateString', 'toISOString', 'toJSON',
        'toLocaleDateString', 'toLocaleFormat', 'toLocaleTimeString',
        'toString', 'toTimeString', 'toUTCString'
    ].forEach(function (method) {
        DateTime.prototype[method] = function () {
            this._initialize();
            return this._.date[method].apply(this._.date, arguments);

        };
    });

    [
        'setTime',
        'setDate', 'setMonth', 'setFullYear',
        'setHours', 'setMinutes', 'setSeconds', 'setMilliseconds',
        'setUTCDate', 'setUTCMonth', 'setUTCFullYear',
        'setUTCHours', 'setUTCMinutes', 'setUTCSeconds', 'setUTCMilliseconds'
    ].forEach(function (method) {
        DateTime.prototype[method] = function () {
            this._initialize();
            this._.date[method].apply(this._.date, arguments);
            return this;

        };
    });

	DateTime.prototype.getTimestamp = function() {
		this._initialize();
		return Math.round(this._.date.getTime() / 1000);

	};

	DateTime.prototype.getDateObject = function () {
		this._initialize();
		return this._.date;

	};

	DateTime.prototype.valueOf = function () {
		return this.getTimestamp();

	};

	DateTime.prototype.modify = function(s) {
		this._initialize();
		var t = this._.date.getTime(), r,
            re, kw = DateTime.keywords.relative;

        if (s instanceof DateInterval) {
            this._.date = new Date(t + s.getLength());
            return this;

        }

		s = s.toLowerCase();

        re = new RegExp('^(' + [kw.yesterday, kw.tomorrow, kw.now, kw.today].map(Strings.escapeRegex).join('|') + ')\\s*(?:' + Strings.escapeRegex(kw.at) + '\\s*)?');

		if (r = s.match(re)) {
			s = s.substr(r[0].length);

			switch (r[1]) {
				case kw.now:
				case kw.today:
					t = Date.now();
					break;

				case kw.yesterday:
					t -= 86400000;
					break;

				case kw.tomorrow:
					t += 86400000;
					break;

			}
		}

        re = new RegExp('^(' + Strings.escapeRegex(kw.noon) + '|' + Strings.escapeRegex(kw.midnight) + '|\\d\\d?(?::\\d\\d|\\s*(?:am|pm))(?::\\d\\d)?(?:\\s*(?:am|pm))?)\\s*');

        if (r = s.match(re)) {
			s = s.substr(r[0].length);

			t = new Date(t);

			if (r[1] === kw.noon) {
				t.setHours(12, 0, 0, 0);

			} else if (r[1] === kw.midnight) {
				t.setHours(0, 0, 0, 0);

			} else {
				r = r[1].match(/^(\d\d?)(?::(\d\d))?(?::(\d\d))?(?:\s*(am|pm))?$/);
				r[1] = parseInt(r[1]);
				r[2] = r[2] ? parseInt(r[2]) : 0;
				r[3] = r[3] ? parseInt(r[3]) : 0;

				if (r[4]) {
					if (r[4] === 'am' && r[1] === 12) {
						r[1] = 0;

					} else if (r[4] === 'pm' && r[1] < 12) {
						r[1] += 12;

					}
				}

				t.setHours(r[1], r[2], r[3], 0);

			}

			t = t.getTime();

		}

        if (s.length && !s.match(/^\s+$/)) {
            t += DateInterval.from(s).getLength();

        }

		this._.date = new Date(t);
		return this;

	};

	DateTime.prototype.modifyClone = function(s) {
		return DateTime.from(this).modify(s);

	};

	DateTime.prototype._initialize = function() {
		if (this._.initialized) {
			return;

		}

		this._.initialized = true;

		if (typeof this._.date === 'string') {
			var m;

			if (m = this._.date.match(/^@(\d+)$/)) {
				this._.date = new Date(m[1] * 1000);

			} else if (m = this._.date.match(/^(\d\d\d\d-\d\d-\d\d)[ T](\d\d:\d\d(?::\d\d(?:\.\d+)?)?)([-+]\d\d:?\d\d)?$/)) {
				this._.date = new Date(m[1] + 'T' + m[2] + (m[3] || ''));

			} else if (DateTime.isModifyString(this._.date)) {
				var s = this._.date;
				this._.date = new Date();
				this.modify(s);

			} else {
				this._.date = new Date(this._.date);

			}
		} else if (typeof this._.date === 'number') {
			this._.date = new Date(this._.date);

		} else if (DateTime.isDateObject(this._.date)) {
			var s = this._.date.date;

			if (this._.date.timezone_type !== 3 || this._.date.timezone === 'UTC') {
				s += ' ' + this._.date.timezone;

			}

			this._.date = new Date(s);

		} else if (this._.date instanceof DateTime) {
			this._.date = new Date(this._.date.getTime());

		}
	};

    _context.register(DateTime, 'DateTime');

});
;
_context.invoke('Nittro.Utils', function(Nittro, Strings, Arrays, HashMap, undefined) {

    var Tokenizer = _context.extend(function(patterns, matchCase) {
        var types = false;

        if (!Arrays.isArray(patterns)) {
            if (patterns instanceof HashMap) {
                types = patterns.getKeys();
                patterns = patterns.getValues();

            } else {
                var tmp = patterns, type;
                types = [];
                patterns = [];

                for (type in tmp) {
                    if (tmp.hasOwnProperty(type)) {
                        types.push(type);
                        patterns.push(tmp[type]);

                    }
                }
            }
        }

        this._ = {
            pattern: '(' + patterns.join(')|(') + ')',
            types: types,
            matchCase: matchCase
        };
    }, {
        STATIC: {
            getCoordinates: function(text, offset) {
                text = text.substr(0, offset);
                var m = text.match(/\n/g);

                return [(m ? m.length : 0) + 1, offset - ("\n" + text).lastIndexOf("\n") + 1];

            }
        },

        tokenize: function(input) {
            var re, tokens, pos, n;

            if (this._.types) {
                re = new RegExp(this._.pattern, 'gm' + (this._.matchCase ? '' : 'i'));
                tokens = [];
                pos = 0;
                n = this._.types.length;

                input.replace(re, function () {
                    var ofs = arguments[n + 1],
                        i;

                    if (ofs > pos) {
                        tokens.push([input.substr(pos, ofs - pos), pos, null]);

                    }

                    for (i = 1; i <= n; i++) {
                        if (arguments[i] !== undefined) {
                            tokens.push([arguments[i], ofs, this._.types[i - 1]]);
                            pos = ofs + arguments[0].length;
                            return;

                        }
                    }

                    throw new Error('Unknown token type: ' + arguments[0]);

                }.bind(this));

                if (pos + 1 < input.length) {
                    tokens.push([input.substr(pos), pos, null]);

                }
            } else {
                tokens = Strings.split(input, new RegExp(this._.pattern, 'm' + (this._.matchCase ? '' : 'i')), true, true, true);

            }

            return tokens;

        }
    });

    _context.register(Tokenizer, 'Tokenizer');

}, {
    Strings: 'Utils.Strings',
    Arrays: 'Utils.Arrays',
    HashMap: 'Utils.HashMap'
});
;
_context.invoke('Nittro.Neon', function(Nittro, HashMap, Tokenizer, Strings, Arrays, DateTime, undefined) {

    var Neon = _context.extend(function() {
        this._cbStr = this._cbStr.bind(this);

    }, {
        STATIC: {
            patterns: [
                '\'[^\'\\n]*\'|"(?:\\\\.|[^"\\\\\\n])*"', //string
                '(?:[^#"\',:=[\\]{}()\x00-\x20!`-]|[:-][^"\',\\]})\\s])(?:[^,:=\\]})(\x00-\x20]|:(?![\\s,\\]})]|$)|[ \\t]+[^#,:=\\]})(\x00-\x20])*', // literal / boolean / integer / float
                '[,:=[\\]{}()-]', // symbol
                '?:#.*', // comment
                '\\n[\\t ]*', // new line + indent
                '?:[\\t ]+' // whitespace
            ],

            brackets: {
                '{' : '}',
                '[' : ']',
                '(' : ')'
            },

            consts: {
                'true': true, 'True': true, 'TRUE': true, 'yes': true, 'Yes': true, 'YES': true, 'on': true, 'On': true, 'ON': true,
                'false': false, 'False': false, 'FALSE': false, 'no': false, 'No': false, 'NO': false, 'off': false, 'Off': false, 'OFF': false,
                'null': null, 'Null': null, 'NULL': null
            },

            indent: '    ',

            BLOCK: 1,

            encode: function(data, options) {
                var tmp, s, isList;

                if (data instanceof DateTime) {
                    return data.format('Y-m-d H:i:s O');

                } else if (data instanceof NeonEntity) {
                    tmp = Neon.encode(data.attributes);
                    return Neon.encode(data.value) + '(' + tmp.substr(1, tmp.length - 2) + ')';

                }

                if (data && typeof data === 'object') { // array or object literal
                    s = [];
                    isList = Arrays.isArray(data);

                    if (options & Neon.BLOCK) {
                        Arrays.walk(data, function(k, v) {
                            v = Neon.encode(v, Neon.BLOCK);
                            s.push(isList ? '-' : (Neon.encode(k) + ':'), Strings.contains(v, "\n") ? "\n" + Neon.indent + v.replace(/\n/g, "\n" + Neon.indent) : (' ' + v), "\n");

                        });

                        return s.length ? s.join('') : '[]';

                    } else {
                        Arrays.walk(data, function(k, v) {
                            s.push(isList ? '' : (Neon.encode(k) + ': '), Neon.encode(v), ', ');

                        });

                        s.pop(); // remove last ', '
                        return (isList ? '[' : "{") + s.join('') + (isList ? ']' : '}');

                    }
                } else if (typeof data === 'string' && !Strings.isNumeric(data)
                    && !data.match(/[\x00-\x1F]|^\d{4}|^(true|false|yes|no|on|off|null)$/i)
                    && data.match(new RegExp('^' + Neon.patterns[1] + '$'))) {

                    return data;

                } else {
                    return JSON.stringify(data);

                }
            },

            decode: function(input) {
                if (typeof input !== 'string') {
                    throw new Error('Invalid argument, must be a string');

                }

                if (!Neon.tokenizer) {
                    Neon.tokenizer = new Tokenizer(Neon.patterns);

                }

                input = input.replace(/\r/g, '');

                var parser = new Neon(),
                    res;

                parser.input = input;
                parser.tokens = Neon.tokenizer.tokenize(input);

                res = parser.parse(0, new HashMap());

                while (parser.tokens[parser.n] !== undefined) {
                    if (parser.tokens[parser.n][0].charAt(0) === "\n") {
                        parser.n++;

                    } else {
                        parser.error();

                    }
                }

                return res;

            }
        },

        input: null,
        tokens: null,
        n: 0,
        indentTabs: null,

        parse: function(indent, result) {
            indent === undefined && (indent = null);
            result === undefined && (result = new HashMap());

            var inlineParser = (indent === null),
                value = null, key = null, entity = null,
                hasValue = false, hasKey = false,
                t;

            for (; this.n < this.tokens.length; this.n++) {
                t = this.tokens[this.n][0];

                if (t === ',') {
                    if ((!hasKey && !hasValue) || !inlineParser) {
                        this.error();

                    }

                    this.addValue(result, hasKey, key, hasValue ? value : null);
                    hasKey = hasValue = false;

                } else if (t === ':' || t === '=') {
                    if (hasKey || !hasValue) {
                        this.error();

                    }

                    if (typeof value !== 'string' && typeof value !== 'number') {
                        this.error('Unacceptable key');

                    }

                    key = Strings.toString(value);
                    hasKey = true;
                    hasValue = false;

                } else if (t === '-') {
                    if (hasKey || hasValue || inlineParser) {
                        this.error();

                    }

                    key = null;
                    hasKey = true;

                } else if (Neon.brackets[t] !== undefined) {
                    if (hasValue) {
                        if (t !== '(') {
                            this.error();

                        }

                        this.n++;

                        entity = new NeonEntity();
                        entity.value = value;
                        entity.attributes = this.parse(null, new HashMap());
                        value = entity;

                    } else {
                        this.n++;
                        value = this.parse(null, new HashMap());

                    }

                    hasValue = true;

                    if (this.tokens[this.n] === undefined || this.tokens[this.n][0] !== Neon.brackets[t]) {
                        this.error();

                    }

                } else if (t === '}' || t === ']' || t === ')') {
                    if (!inlineParser) {
                        this.error();

                    }

                    break;

                } else if (t.charAt(0) === "\n") {
                    if (inlineParser) {
                        if (hasKey || hasValue) {
                            this.addValue(result, hasKey, key, hasValue ? value : null);
                            hasKey = hasValue = false;

                        }
                    } else {
                        while (this.tokens[this.n + 1] !== undefined && this.tokens[this.n + 1][0].charAt(0) === "\n") {
                            this.n++;

                        }

                        if (this.tokens[this.n + 1] === undefined) {
                            break;

                        }

                        var newIndent = this.tokens[this.n][0].length - 1;
                        if (indent === null) {
                            indent = newIndent;

                        }

                        if (newIndent) {
                            if (this.indentTabs === null) {
                                this.indentTabs = this.tokens[this.n][0].charAt(1) === "\t";

                            }

                            if (Strings.contains(this.tokens[this.n][0], this.indentTabs ? ' ' : "\t")) {
                                this.n++;
                                this.error('Either tabs or spaces may be used for indentation, not both');

                            }
                        }

                        if (newIndent > indent) {
                            if (hasValue || !hasKey) {
                                this.n++;
                                this.error('Unexpected indentation');

                            } else {
                                this.addValue(result, key !== null, key, this.parse(newIndent, new HashMap()));

                            }

                            newIndent = this.tokens[this.n] !== undefined ? this.tokens[this.n][0].length - 1 : 0;
                            hasKey = false;

                        } else {
                            if (hasValue && !hasKey) {
                                break;

                            } else if (hasKey) {
                                this.addValue(result, key !== null, key, hasValue ? value : null);
                                hasKey = hasValue = false;

                            }
                        }

                        if (newIndent < indent) {
                            return result;

                        }
                    }
                } else {
                    if (hasValue) {
                        this.error();

                    }

                    if (t.charAt(0) === '"') {
                        value = t.substr(1, t.length - 2).replace(/\\(?:u[0-9a-f]{4}|x[0-9a-f]{2}|.)/gi, this._cbStr);

                    } else if (t.charAt(0) === "'") {
                        value = t.substr(1, t.length - 2);

                    } else if (Neon.consts[t] !== undefined) {
                        value = Neon.consts[t];

                    } else if (Strings.isNumeric(t)) {
                        value = parseFloat(t);

                    } else if (t.match(/^\d\d\d\d-\d\d?-\d\d?(?:(?:[Tt]| +)\d\d?:\d\d(?::\d\d(?:\.\d*)?)? *(?:Z|[-+]\d\d?(?::?\d\d)?)?)?$/)) {
                        value = DateTime.from(t);

                    } else {
                        value = t;

                    }

                    hasValue = true;

                }
            }

            if (inlineParser) {
                if (hasKey || hasValue) {
                    this.addValue(result, hasKey, key, hasValue ? value : null);

                }
            } else {
                if (hasValue && !hasKey) {
                    if (!result.length) {
                        result = value;

                    } else {
                        this.error();

                    }
                } else if (hasKey) {
                    this.addValue(result, key !== null, key, hasValue ? value : null);

                }
            }

            return result;

        },

        addValue: function(result, hasKey, key, value) {
            if (hasKey) {
                if (result && result.has(key)) {
                    this.error("Duplicated key " + key);

                }

                result.set(key, value);

            } else {
                result.push(value);

            }
        },

        _cbStr: function(m) {
            var mapping = {t: '\t', n: '\n', r: '\r', f: '\x0C', b: '\x08', '"': '"', '\\': '\\', '/': '/', '_': '\xC2\xA0'}

            if (mapping[m.charAt(1)] !== undefined) {
                return mapping[m.charAt(1)];

            } else if (m.charAt(1) === 'u' && m.length === 6) {
                return String.fromCharCode(parseInt(m.substr(2), 16));

            } else if (m.charAt(1) === 'x' && m.length === 4) {
                return String.fromCharCode(parseInt(m.substr(2), 16));

            } else {
                this.error('Invalid escape sequence ' + m);

            }
        },

        error: function(msg) {
            var last = this.tokens[this.n] !== undefined ? this.tokens[this.n] : null,
                pos = Tokenizer.getCoordinates(this.input, last ? last[1] : this.input.length),
                token = last ? last[0].substr(0, 40).replace(/\n/g, '<new line>') : 'end';

            throw new Error((msg || 'Unexpected %s').replace(/%s/g, token) + ' on line ' + pos[0] + ', column ' + pos[1]);

        }

    });

    var NeonEntity = this.NeonEntity = function(value, attributes) {
        this.value = value || null;
        this.attributes = attributes || null;

    };

    _context.register(Neon, 'Neon');
    _context.register(NeonEntity, 'NeonEntity');

}, {
    HashMap: 'Utils.HashMap',
    Strings: 'Utils.Strings',
    Arrays: 'Utils.Arrays',
    DateTime: 'Utils.DateTime',
    Tokenizer: 'Nittro.Utils.Tokenizer'
});
;
_context.invoke('Nittro.Forms', function (DOM, Arrays) {

    if (!window.Nette || !window.Nette.validators) {
        throw new Error('Nette/Forms vendor netteForms.js asset has not been loaded');

    }

    var VendorForms = window.Nette;
    _context.register(VendorForms, 'Vendor');

    VendorForms.addEvent = DOM.addListener;

    VendorForms.validators.mimeType = function(elem, arg, val) {
        if (!Arrays.isArray(arg)) {
            arg = arg.trim().split(/\s*,\s*/);

        }

        try {
            if (!val.length) return false;

            for (var i = 0; i < val.length; i++) {
                if (arg.indexOf(val[i].type) === -1 && arg.indexOf(val[i].type.replace(/\/.*/, '/*')) === -1) {
                    return false;

                }
            }
        } catch (e) {}

        return true;

    };

}, {
    DOM: 'Utils.DOM',
    Arrays: 'Utils.Arrays'
});
;
_context.invoke('Nittro.Forms', function (DOM, Arrays, DateTime, FormData, Vendor, undefined) {

    var Form = _context.extend('Nittro.Object', function (form) {
        Form.Super.call(this);

        if (typeof form === 'string') {
            form = DOM.getById(form);

        }

        if (!form || !(form instanceof HTMLFormElement)) {
            throw new TypeError('Invalid argument, must be a HTMLFormElement');

        }

        this._.form = form;
        this._.form.noValidate = 'novalidate';
        this._.submittedBy = null;

        DOM.addListener(this._.form, 'submit', this._handleSubmit.bind(this));
        DOM.addListener(this._.form, 'reset', this._handleReset.bind(this));

    }, {
        getElement: function (name) {
            return name ? this._.form.elements.namedItem(name) : this._.form;

        },

        getElements: function () {
            return this._.form.elements;

        },

        setSubmittedBy: function (value) {
            this._.submittedBy = value;
            return this;

        },

        validate: function () {
            if (!Vendor.validateForm(this._.form)) {
                return false;

            }

            var evt = this.trigger('validate');
            return !evt.isDefaultPrevented();

        },

        setValues: function (values, reset) {
            var i, elem, name, value, names = [];
            values || (values = {});

            for (i = 0; i < this._.form.elements.length; i++) {
                elem = this._.form.elements.item(i);
                name = elem.name;
                value = undefined;

                if (!name || names.indexOf(name) > -1 || elem.tagName.toLowerCase() === 'button' || elem.type in {'submit':1, 'reset':1, 'button':1, 'image':1}) {
                    continue;

                }

                names.push(name);

                if (name.indexOf('[') > -1) {
                    value = values;

                    name.replace(/]/g, '').split(/\[/g).some(function (key) {
                        if (key === '') {
                            return true;

                        } else if (!(key in value)) {
                            value = undefined;
                            return true;

                        } else {
                            value = value[key];
                            return false;

                        }
                    });
                } else if (name in values) {
                    value = values[name];

                }

                if (value === undefined) {
                    if (reset) {
                        value = null;

                    } else {
                        continue;

                    }
                }

                this.setValue(name, value);

            }
        },

        setValue: function (elem, value) {
            if (typeof elem === 'string') {
                elem = this._.form.elements.namedItem(elem);

            }

            var i,
                toStr = function(v) { return '' + v; };

            if (!elem) {
                throw new TypeError('Invalid argument to setValue(), must be (the name of) an existing form element');

            } else if (!elem.tagName) {
                if ('length' in elem) {
                    for (i = 0; i < elem.length; i++) {
                        this.setValue(elem[i], value);

                    }
                }
            } else if (elem.type === 'radio') {
                elem.checked = value !== null && elem.value === toStr(value);

            } else if (elem.type === 'file') {
                if (value === null) {
                    value = elem.parentNode.innerHTML;
                    DOM.html(elem.parentNode, value);

                }
            } else if (elem.tagName.toLowerCase() === 'select') {
                var single = elem.type === 'select-one',
                    arr = Arrays.isArray(value),
                    v;

                if (arr) {
                    value = value.map(toStr);

                } else {
                    value = toStr(value);

                }

                for (i = 0; i < elem.options.length; i++) {
                    v = arr ? value.indexOf(elem.options.item(i).value) > -1 : value === elem.options.item(i).value;
                    elem.options.item(i).selected = v;

                    if (v && single) {
                        break;

                    }
                }
            } else if (elem.type === 'checkbox') {
                elem.checked = Arrays.isArray(value) ? value.map(toStr).indexOf(elem.value) > -1 : !!value;

            } else if (elem.type === 'date') {
                elem.value = value ? DateTime.from(value).format('Y-m-d') : '';

            } else if (elem.type === 'datetime-local' || elem.type === 'datetime') {
                elem.value = value ? DateTime.from(value).format('Y-m-d\\TH:i:s') : '';

            } else {
                elem.value = value !== null ? toStr(value) : '';

            }

            return this;

        },

        serialize: function () {
            var elem, i,
                data = new FormData(),
                names = [],
                value;

            for (i = 0; i < this._.form.elements.length; i++) {
                elem = this._.form.elements.item(i);

                if (elem.name && names.indexOf(elem.name) === -1 && (elem.type === 'submit' && elem.name === this._.submittedBy || !(elem.type in {submit: 1, button: 1, reset: 1}))) {
                    names.push(elem.name);

                }
            }

            for (i = 0; i < names.length; i++) {
                elem = this._.form.elements.namedItem(names[i]);

                if (Vendor.isDisabled(elem)) {
                    continue;

                }

                value = Vendor.getEffectiveValue(elem);

                if (Arrays.isArray(value) || value instanceof FileList) {
                    for (var j = 0; j < value.length; j++) {
                        data.append(names[i], value[j]);

                    }
                } else {
                    data.append(names[i], value);

                }
            }

            this.trigger('serialize', data);

            return data;

        },

        submit: function (by) {
            var evt;

            if (by) {
                var btn = this._.form.elements.namedItem(by);

                if (btn && btn.type === 'submit') {
                    try {
                        evt = new MouseEvent('click', {bubbles: true, cancelable: true, view: window});

                    } catch (e) {
                    evt = document.createEvent('MouseEvents');
                    evt.initMouseEvent('click', true, true, window);

                    }

                    btn.dispatchEvent(evt);
                    return this;

                } else {
                    throw new TypeError('Unknown element or not a submit button: ' + by);

                }
            }

            try {
                evt = new Event('submit', {bubbles: true, cancelable: true});

            } catch (e) {
            evt = document.createEvent('HTMLEvents');
            evt.initEvent('submit', true, true);

            }

            this._.form.dispatchEvent(evt);

            return this;

        },

        reset: function () {
            this._.form.reset();
            return this;

        },

        _handleSubmit: function (evt) {
            if (this.trigger('submit').isDefaultPrevented()) {
                evt.preventDefault();
                return;

            }

            if (!this.validate()) {
                evt.preventDefault();

            }
        },

        _handleReset: function (evt) {
            if (evt.target !== this._.form) {
                return;

            }

            var elem, i;

            for (i = 0; i < this._.form.elements.length; i++) {
                elem = this._.form.elements.item(i);

                if (elem.type === 'hidden' && elem.hasAttribute('data-default-value')) {
                    this.setValue(elem, DOM.getData(elem, 'default-value') || '');

                } else if (elem.type === 'file') {
                    this.setValue(elem, null);

                }
            }

            this.trigger('reset');

        }
    });

    _context.register(Form, 'Form');

}, {
    DOM: 'Utils.DOM',
    Arrays: 'Utils.Arrays',
    DateTime: 'Utils.DateTime',
    FormData: 'Nittro.Ajax.FormData'
});
;
_context.invoke('Nittro.Forms', function (Form, Vendor) {

    var Locator = _context.extend(function (flashMessages) {
        this._ = {
            flashMessages: flashMessages,
            registry: {},
            anonId: 0
        };

        Vendor.addError = this._handleError.bind(this);

    }, {
        getForm: function (id) {
            var elem;

            if (typeof id !== 'string') {
                elem = id;

                if (!elem.getAttribute('id')) {
                    elem.setAttribute('id', 'frm-anonymous' + (++this._.anonId));

                }

                id = elem.getAttribute('id');

            }

            if (!(id in this._.registry)) {
                this._.registry[id] = new Form(elem || id);
                this._.registry[id].on('error:default', this._showError.bind(this));

            }

            return this._.registry[id];

        },

        removeForm: function (id) {
            if (typeof id !== 'string') {
                id = id.getAttribute('id');

            }

            if (id in this._.registry) {
                delete this._.registry[id];

            }
        },

        _handleError: function (elem, msg) {
            var frm = this.getForm(elem.form);
            frm.trigger('error', {elem: elem, message: msg});

        },

        _showError: function (evt) {
            this._.flashMessages.add(evt.data.elem, 'warning', evt.data.message);

            if (evt.data.elem && typeof evt.data.elem.focus === 'function') {
                evt.data.elem.focus();

            }
        }
    });

    _context.register(Locator, 'Locator');

});
;
_context.invoke('Nittro.DI', function(Nittro, ReflectionClass, ReflectionFunction, Arrays, Strings, HashMap, Neon, NeonEntity, undefined) {

    var prepare = function (self) {
        if (!self._) {
            self._ = {};
        }

        if (!self._.services) {
            self._.services = {};
            self._.serviceDefs = {};

        }
    };

    var Container = {
        addService: function (name, service) {
            prepare(this);

            if (this._.services[name] || this._.serviceDefs[name]) {
                throw new Error('Container already has a service named "' + name + '"');

            }

            this._.services[name] = service;

            return this;

        },

        addServiceDefinition: function (name, definition) {
            prepare(this);

            if (this._.services[name] || this._.serviceDefs[name]) {
               throw new Error('Container already has a service named "' + name + '"');

            }

            this._.serviceDefs[name] = definition;

            return this;

        },

        getService: function (name) {
            prepare(this);

            if (name === 'container') {
                return this;

            } else if (this._.services[name] === undefined) {
                if (this._.serviceDefs[name]) {
                    this._createService(name);

                } else {
                    throw new Error('Container has no service named "' + name + '"');

                }
            }

            return this._.services[name];

        },

        hasService: function (name) {
            prepare(this);
            return name === 'container' || this._.services[name] !== undefined || this._.serviceDefs[name] !== undefined;

        },

        isServiceCreated: function (name) {
            if (!this.hasService(name)) {
                throw new Error('Container has no service named "' + name + '"');

            }

            return !!this._.services[name];

        },

        runServices: function () {
            prepare(this);

            var name, def;

            for (name in this._.serviceDefs) {
                def = this._.serviceDefs[name];

                if (typeof def === 'string' && def.match(/!$/) || def.factory !== undefined && def.run) {
                    this.getService(name);

                }
            }
        },

        invoke: function (callback, args, thisArg) {
            prepare(this);
            args = this._autowireArguments(callback, args);
            return callback.apply(thisArg || null, this._expandArguments(args));

        },

        _createService: function (name) {
            if (!this._.serviceDefs[name]) {
                throw new Error('Container has no service "' + name + '"');

            }

            if (typeof this._.serviceDefs[name] === 'string') {
                this._.serviceDefs[name] = {
                    run: !!this._.serviceDefs[name].match(/!$/),
                    factory: this._.serviceDefs[name].replace(/!$/, '')
                };
            }

            var def = this._.serviceDefs[name],
                factory,
                obj,
                service;

            if (typeof def.factory === 'function') {
                service = this.invoke(def.factory);

                if (!service) {
                    throw new Error('Factory failed to create service "' + name + '"');

                }
            } else {
                factory = this._toEntity(def.factory);
                service = this._expandEntity(factory);

                if (service === factory) {
                    throw new Error('Invalid factory for service "' + name + '"');

                }
            }

            this._.services[name] = service;

            if (def.setup !== undefined) {
                for (var i = 0; i < def.setup.length; i++) {
                    if (typeof def.setup[i] === 'function') {
                        this.invoke(def.setup[i], null, service);

                    } else {
                        obj = this._toEntity(def.setup[i]);
                        this._expandEntity(obj, service);

                    }
                }
            }

            return service;

        },

        _autowireArguments: function (callback) {
            var argList = ReflectionFunction.from(callback).getArgs();

            var args = Arrays.createFrom(arguments, 1)
                .filter(function(arg) { return !!arg; })
                .map(function (arg) {
                    if (arg instanceof HashMap) {
                        if (arg.isList()) {
                            arg = HashMap.from(arg.getValues(), argList);

                        }
                    } else {
                        arg = HashMap.from(arg, argList);

                    }

                    return arg;

                });

            var i, a;

            lookupArg:
            for (i = 0; i < argList.length; i++) {
                for (a = args.length - 1; a >= 0; a--) {
                    if (args[a].has(argList[i])) {
                        argList[i] = args[a].get(argList[i]);
                        continue lookupArg;

                    } else if (args[a].has(i)) {
                        argList[i] = args[a].get(i);
                        continue lookupArg;

                    }
                }

                if (this.hasService(argList[i])) {
                    argList[i] = this.getService(argList[i]);
                    continue;

                }

                throw new Error('Cannot autowire argument "' + argList[i] + '" of function');

            }

            return argList;

        },

        _expandArguments: function (args) {
            for (var i = 0; i < args.length; i++) {
                args[i] = this._expandArg(args[i]);

            }

            return args;

        },

        _expandArg: function (arg) {
            if (arg instanceof NeonEntity) {
                return this._expandEntity(arg);

            } else if (typeof arg === 'string' && arg.match(/^@\S+$/)) {
                return this.getService(arg.substr(1));

            } else {
                return arg;

            }
        },

        _toEntity: function (str) {
            var m = str.match(/^([^\(]+)\((.*)\)$/);

            if (m) {
                return new NeonEntity(m[1], Neon.decode('[' + m[2] + ']'));

            } else {
                return new NeonEntity(str, new HashMap());

            }
        },

        _expandEntity: function (entity, context, mergeArgs) {
            var m, obj, method, args;

            if (m = entity.value.match(/^(?:(@)?([^:].*?))?(?:::(.+))?$/)) {
                if (m[2]) {
                    obj = m[1] ? this.getService(m[2]) : ReflectionClass.getClass(m[2]);

                } else if (context) {
                    obj = context;

                } else {
                    throw new Error('No context for calling ' + entity.value + ' given');

                }

                if (m[3] !== undefined) {
                    method = m[3];
                    args = this._autowireArguments(obj[method], entity.attributes, mergeArgs);
                    return obj[method].apply(obj, this._expandArguments(args));

                } else if (!m[1]) {
                    args = this._autowireArguments(obj, entity.attributes, mergeArgs);
                    return ReflectionClass.from(obj).newInstanceArgs(this._expandArguments(args));

                } else if (entity.attributes.length) {
                    throw new Error('Invalid entity "' + entity.value + '"');

                } else {
                    return obj;

                }
            } else {
                return entity;

            }
        }
    };

    _context.register(Container, 'Container');

}, {
    ReflectionClass: 'Utils.ReflectionClass',
    ReflectionFunction: 'Utils.ReflectionFunction',
    Arrays: 'Utils.Arrays',
    Strings: 'Utils.Strings',
    HashMap: 'Utils.HashMap',
    Neon: 'Nittro.Neon.Neon',
    NeonEntity: 'Nittro.Neon.NeonEntity'
});
;
_context.invoke('Nittro.DI', function(Container, Arrays, HashMap, ReflectionClass, NeonEntity, undefined) {

    function traverse(cursor, path, create) {
        if (typeof path === 'string') {
            path = path.split(/\./g);

        }

        var i, p, n = path.length;

        for (i = 0; i < n; i++) {
            p = path[i];

            if (Arrays.isArray(cursor) && p.match(/^\d+$/)) {
                p = parseInt(p);

            }

            if (cursor[p] === undefined) {
                if (create) {
                    cursor[p] = {};

                } else {
                    return undefined;

                }
            }

            cursor = cursor[p];

        }

        return cursor;

    }

    var Context = _context.extend(function(config) {
        config || (config = {});

        this._ = {
            params: Arrays.mergeTree({}, config.params || null),
            serviceDefs: Arrays.mergeTree({}, config.services || null),
            services: {},
            factories: Arrays.mergeTree({}, config.factories || null)
        };

    }, {
        hasParam: function(name) {
            return traverse(this._.params, name) !== undefined;

        },

        getParam: function(name, def) {
            var value = traverse(this._.params, name);
            return value !== undefined ? value : (def !== undefined ? def : null);

        },

        setParam: function(name, value) {
            name = name.split(/\./g);

            var p = name.pop(),
                cursor = this._.params;

            if (name.length) {
                cursor = traverse(cursor, name, true);

            }

            if (Arrays.isArray(cursor) && p.match(/^\d+$/)) {
                p = parseInt(p);

            }

            cursor[p] = value;

            return this;

        },

        hasFactory: function(name) {
            return this._.factories[name] !== undefined;

        },

        addFactory: function(name, factory, params) {
            if (typeof factory === 'string') {
                this._.factories[name] = factory;

            } else {
                this._.factories[name] = {
                    callback: factory,
                    params: params || null
                };
            }

            return this;

        },

        create: function(name, args) {
            if (!this.hasFactory(name)) {
                throw new Error('No factory named "' + name + '" has been registered');

            }

            var factory = this._.factories[name];

            if (typeof factory === 'string') {
                this._.factories[name] = factory = this._toEntity(factory);

            } else if (!(factory.params instanceof HashMap)) {
                factory.params = new HashMap(factory.params);

            }

            if (factory instanceof NeonEntity) {
                return this._expandEntity(factory, null, args);

            } else {
                args = this._autowireArguments(factory.callback, factory.params, args);
                return factory.callback.apply(null, this._expandArguments(args));

            }
        },

        _expandArg: function (arg) {
            if (typeof arg === 'string' && arg.indexOf('%') > -1) {
                if (arg.match(/^%[^%]+%$/)) {
                    return this.getParam(arg.replace(/^%|%$/g, ''));

                } else {
                    return arg.replace(/%([a-z0-9_.-]+)%/gi, function () {
                        return this.getParam(arguments[1]);

                    }.bind(this));
                }
            } else {
                return this.__expandArg(arg);

            }
        }
    });

    _context.mixin(Context, Container, {
        _expandArg: '__expandArg'
    });

    _context.register(Context, 'Context');

}, {
    Arrays: 'Utils.Arrays',
    HashMap: 'Utils.HashMap',
    ReflectionClass: 'Utils.ReflectionClass',
    NeonEntity: 'Nittro.Neon.NeonEntity'
});
;
_context.invoke('Nittro.Application', function() {

    var Storage = _context.extend(function(namespace, persistent) {
        this._.persistent = persistent;
        this._.engine = persistent ? window.localStorage : window.sessionStorage;
        this._.items = {};
        this._.namespace = namespace || '';
        this._.filters = {
            'in': [],
            out: []
        };

    }, {
        STATIC: {
            NAMESPACE_SEPARATOR: '/',
            FILTER_IN : 'in',
            FILTER_OUT : 'out'
        },

        getItem: function(key, need) {
            var value = this._.engine.getItem(this._formatKey(key));

            if (value === null) {
                if (need) {
                    throw new Error();

                }

                return null;

            }

            return this._applyFilters(this._parseValue(value), Storage.FILTER_OUT);

        },

        setItem: function(key, value) {
            value = this._stringifyValue(this._applyFilters(value, Storage.FILTER_IN));
            this._.engine.setItem(this._formatKey(key), value);

            return this;

        },

        hasItem: function(key) {
            return this._.engine.getItem(this._formatKey(key)) !== null;

        },

        removeItem: function(key) {
            this._.engine.removeItem(this._formatKey(key));
            return this;

        },

        clear: function() {
            var ns = this._.namespace + Storage.NAMESPACE_SEPARATOR,
                nsl = ns.length,
                rem = [];

            for (var i = 0; i < this._.engine.length; i++) {
                var k = this._.engine.key(i);

                if (k.substr(0, nsl) === ns) {
                    rem.push(k);

                }
            }

            while (rem.length) {
                this._.engine.removeItem(rem.shift());

            }

            return this;

        },

        walk: function(callback) {
            var ns = this._.namespace + Storage.NAMESPACE_SEPARATOR,
                nsl = ns.length;

            for (var i = 0; i < this._.engine.length; i++) {
                var k = this._.engine.key(i);

                if (k.substr(0, nsl) === ns) {
                    k = k.substr(nsl);
                    var v = this.getItem(k);
                    callback.call(v, k, v);

                }
            }
        },

        getNamespace: function(namespace) {
            return new this.constructor((this._.namespace ? this._.namespace + Storage.NAMESPACE_SEPARATOR : '') + namespace, this._.persistent);

        },

        addFilter: function(callback, type) {
            this._.filters[type].push(callback);
            return this;

        },

        _formatKey: function(key) {
            return this._.namespace + Storage.NAMESPACE_SEPARATOR + key;

        },

        _parseValue: function(value) {
            return JSON.parse(value);

        },

        _stringifyValue: function(value) {
            return JSON.stringify(value);

        },

        _applyFilters: function(value, type) {
            for (var i = 0; i < this._.filters[type].length; i++) {
                value = this._.filters[type][i](value);

            }

            return value;

        }
    });

    _context.register(Storage, 'Storage');

});
;
_context.invoke('Nittro.Application.Routing', function (Nittro, Strings, Arrays) {

    var URLRoute = _context.extend(Nittro.Object, function (mask) {
        URLRoute.Super.call(this);
        this._.mask = this._prepareMask(mask);

    }, {
        STATIC: {
            styles: {
                'int': parseInt,
                'float': parseFloat,
                'bool': function(v) { return !v.match(/^(?:0|false|)$/); }
            }
        },

        match: function (url) {
            var params = this.tryMatch(url);

            if (params) {
                Arrays.mergeTree(params, url.getParams());
                this.trigger('match', params);

            }
        },

        tryMatch: function (url) {
            var match = this._.mask.pattern.exec(url.getPath().replace(/^\/|\/$/g, ''));

            if (!match) {
                return null;

            }

            var params = {},
                i, n, p, v;

            match.shift();

            for (i = 0, n = this._.mask.map.length; i < n; i++) {
                p = this._.mask.map[i];
                v = decodeURIComponent(match[i]);

                if (p.style) {
                    params[p.name] = URLRoute.styles[p.style].call(null, v);

                } else {
                    params[p.name] = v;

                }
            }

            return params;

        },

        _prepareMask: function (mask) {
            var reTop = /^([<\[\]\(])|^([^<\[\]\(]+)/,
                reParam = /^([^ #>]+)(?: +([^ #>]+))?(?: +#([^ >]+))? *>/,
                reParen = /\((?!\?:)/g,
                reOptional = /^\?:/,
                match, param,
                map = [],
                pattern = ['^'];

            mask = mask.replace(/^\/|\/$/g, '');

            while (mask.length) {
                match = reTop.exec(mask);

                if (!match) {
                    throw new Error('Invalid mask, error near ' + mask.substr(0, 10));

                }

                mask = mask.substr(match[0].length);

                if (match[1] === '<') {
                    param = reParam.exec(mask);

                    if (!param) {
                        throw new Error('Invalid mask, error near ' + mask.substr(0, 10));

                    }

                    mask = mask.substr(param[0].length);

                    if (param[2]) {
                        param[2] = param[2].replace(reParen, '(?:');

                    } else {
                        param[2] = '[^/]+';

                    }

                    pattern.push('(', param[2], ')');

                    if (param[3] && !(param[3] in URLRoute.styles)) {
                        throw new Error('Unknown parameter style: ' + param[3]);

                    }

                    map.push({
                        name: param[1],
                        style: param[3] || null
                    });

                } else if (match[1] === '[') {
                    pattern.push('(?:');

                } else if (match[1] === ']') {
                    pattern.push(')?');

                } else if (match[1] === '(') {
                    pattern.push(reOptional.test(mask) ? '(' : '(?:');

                } else {
                    pattern.push(Strings.escapeRegex(match[2]));

                }
            }

            pattern.push('$');

            return {
                pattern: new RegExp(pattern.join('')),
                map: map
            };
        }
    });

    _context.register(URLRoute, 'URLRoute');

}, {
    Strings: 'Utils.Strings',
    Arrays: 'Utils.Arrays'
});
;
_context.invoke('Nittro.Application.Routing', function (Nittro, DOM) {

    var DOMRoute = _context.extend(Nittro.Object, function (selector) {
        DOMRoute.Super.call(this);
        this._.selector = selector;

    }, {
        match: function () {
            var matches = DOM.find(this._.selector);

            if (matches.length) {
                this.trigger('match', matches);

            }
        }
    });

    _context.register(DOMRoute, 'DOMRoute');

}, {
    DOM: 'Utils.DOM'
});
;
_context.invoke('Nittro.Application.Routing', function (Nittro, DOMRoute, URLRoute, Url) {

    var Router = _context.extend(Nittro.Object, function (page, basePath) {
        Router.Super.call(this);

        this._.page = page;
        this._.basePath = '/' + basePath.replace(/^\/|\/$/g, '');
        this._.routes = {
            dom: {},
            url: {}
        };

        this._.page.on('setup', this._matchAll.bind(this));

    }, {
        getDOMRoute: function (selector) {
            if (!(selector in this._.routes.dom)) {
                this._.routes.dom[selector] = new DOMRoute(selector);

            }

            return this._.routes.dom[selector];

        },

        getURLRoute: function (mask) {
            if (!(mask in this._.routes.url)) {
                this._.routes.url[mask] = new URLRoute(mask);

            }

            return this._.routes.url[mask];

        },

        _matchAll: function () {
            var k, url = Url.fromCurrent();

            if (url.getPath().substr(0, this._.basePath.length) === this._.basePath) {
                url.setPath(url.getPath().substr(this._.basePath.length));

                for (k in this._.routes.url) {
                    this._.routes.url[k].match(url);

                }
            }

            for (k in this._.routes.dom) {
                this._.routes.dom[k].match();

            }
        }
    });

    _context.register(Router, 'Router');

}, {
    Url: 'Utils.Url'
});
