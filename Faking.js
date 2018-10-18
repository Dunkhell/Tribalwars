/*
 * Selecting troops and coordinates based on many factors
 * Created by: Hermitowski
 * Modified on: 13/02/2017 - version 2.2 - added targeting specific players/allies
 * Modified on: 14/02/2018 - version 2.3 - added minimum village points threshold
 * Modified on: 08/03/2018 - version 2.4 - added omitting recently selected villages for a short period of time
 * Modified on: 14/03/2018 - version 2.4 - improved performance
 * Modified on: 25/04/2018 - version 2.5 - added omitting recently selected villages in global context
 * Modified on: 26/04/2018 - version 2.5 - improved 'skip village' logic
 * Modified on: 26/04/2018 - version 2.6 - minor changes to selecting based on player/allies names
 * Modified on: 14/06/2018 - version 2.7 - added distance option
 * Modified on: 01/08/2018 - version 2.8 - added safeguard option
 * Modified on: 04/08/2018 - version 2.9 - redesign of contexts
 * Modified on: 04/08/2018 - version 2.10 - added bounding boxes
 * Modified on: 04/08/2018 - version 2.11 - added 'excludeCoords'
 * --- VERSION 3.0 ---
 * Modified on: 29/08/2018 - version 3.0a - major cleanup
 */

function Faking() {
    const i18n = {
        DOWNLOADING_SCRIPT: 'Pobieranie skryptu... ',
        ERROR_MESSAGE: 'Komunikat o b\u{142}\u{119}dzie: ',
        FORUM_THREAD: 'Link do w\u{105}tku na forum',
        FORUM_THREAD_HREF: 'https://forum.plemiona.pl/index.php?threads/hermitowskie-fejki.125294/',
        VILLAGE_OUT_OF_GROUP: 'Wioska poza grup\u{105}. Przechodz\u{119} do nast\u{119}pnej wioski z grupy',
        MISSING_CONFIGURATION: 'Brak konfiguracji u\u{17C}ytkownika',
        BAD_SCREEN: 'Nie jeste\u{15B}  na placu',
        BLOCKED_SCREEN: 'Skrypt jest zablokowany w tym przegl\u{105}dzie',
        INSUFFICIENT_TROOPS: 'Nie uda si\u{119} wybra\u{107} wystarczaj\u{105}cej liczby jednostek',
        NO_TROOPS_SELECTED: 'Wydaje si\u{119}, \u{17C}e obecne ustawienia nie pozwalaj\u{105} na wyb\u{F3}r jednostek',
        COORDS_EMPTY: 'Pula wiosek jest pusta',
        COORDS_EMPTY_SNOBS: 'Pula wiosek le\u{17C}y poza zasi\u{119}iem szlachcic\u{F3}w',
        COORDS_EMPTY_TIME: 'Pula wiosek jest pusta z powodu wybranych ram czasowych',
        COORDS_EMPTY_CONTEXTS: 'W puli wiosek zosta\u{142}y tylko wioski, kt\u{F3}re zosta\u{142}y wybrane chwil\u{119} temu',
        ATTACK_TIME: 'Atak dojdzie __DAY__.__MONTH__ na __HOURS__:__MINUTES__',
        UNKNOWN_UNIT: 'Podana jednostka nie istnieje: __UNIT_NAME__',
        UNKNOWN_OPTION: 'Nieznana opcja: __PROPERTY__',
        NONEXISTENT_UNIT: 'Podana jednostka nie wyst\u{119}puje na tym \u{15B}wiecie: __UNIT_NAME__',
        INVALID_SETTINGS_SAFEGUARD: 'Ustawienia > safeguard > __UNIT_NAME__  : __VALUE__'
    };

    function SetupScriptCache() {
        if (localStorage.getItem('Faking') === null) {
            localStorage.setItem('Faking', `(${Faking.toString()})()`);
            localStorage.setItem('FakingTimestamp', JSON.stringify(Date.now() + 24 * 3600 * 1000));
        }
        if (Number(localStorage.getItem('FakingTimestamp')) < Date.now()) {
            localStorage.removeItem('Faking');
            localStorage.removeItem('FakingTimestamp');
        }
    }

    SetupScriptCache();
    let getWorldInfo = localStorage['GetWorldInfo'];
    if (getWorldInfo !== undefined) {
        eval(getWorldInfo);
        ExecuteScript();
    }
    else {
        UI.SuccessMessage(i18n.DOWNLOADING_SCRIPT);
        $.ajax({
            url: 'https://media.innogamescdn.com/com_DS_PL/skrypty/MapFiles.js',
            dataType: 'script',
        }).then(ExecuteScript);
    }

    return true;

    function ExecuteScript() {
        let config = {
            unit_info: {
                caching: 'Mandatory'
            },
            config: {
                caching: 'Mandatory'
            }
        };
        let misc = {};
        if (typeof HermitowskieFejki !== 'undefined') {
            let requirePlayerFiles = HermitowskieFejki.players !== undefined && HermitowskieFejki.players.trim() !== '';
            let isCacheMandatory = true;
            if (HermitowskieFejki.hasOwnProperty('mandatoryCaching') && !HermitowskieFejki['mandatoryCaching']) {
                isCacheMandatory = false;
                delete HermitowskieFejki['mandatoryCaching'];
            }
            if (requirePlayerFiles) {
                config['village'] = {
                    caching: isCacheMandatory ? 'Mandatory' : 'Preferred'
                };
                config['player'] = {
                    caching: isCacheMandatory ? 'Mandatory' : 'Preferred'
                };
            }
            misc['purgeCache'] = HermitowskieFejki.hasOwnProperty('purgeCache') && HermitowskieFejki.purgeCache;
        }
        GetWorldInfo(config, misc).then(worldInfo => {
            if (worldInfo.error !== undefined) {
                // some failure getting worldInfo data, e.g. QUOTA
                throw worldInfo.error;
            }
            CreateFaker(worldInfo).init();

        }).catch(HandleError);
    }

    function HandleError(error) {
        const gui =
            `<h2>WTF - What a Terrible Failure</h2>
             <p><strong>${i18n.ERROR_MESSAGE}</strong><br/>
                <textarea rows='5' cols='42'>${error}\n\n${error.stack}</textarea><br/>
                <a href="${i18n.FORUM_THREAD_HREF}">${i18n.FORUM_THREAD}</a>
             </p>`;
        Dialog.show('scriptError', gui);
    }

    function CreateFaker(worldInfo) {
        return {
            _owner: 699198069,
            _settings: {},
            _fakeLimit: worldInfo.config.game.fake_limit,
            _defaultSettings: {
                omitNightBonus: 'true',
                coords: '',
                players: '',
                days: '1-31',
                intervals: '0:00-23:59',
                templates: [
                    {spy: 1, ram: 1},
                    {spy: 1, catapult: 1},
                    {ram: 1},
                    {catapult: 1}
                ],
                fillWith: 'spear,sword,axe,archer,spy,light,marcher,heavy,ram,catapult',
                fillExact: 'false',
                skipVillages: 'true',
                safeguard: {},
                localContext: '0',
                customContexts: '',
                boundingBoxes: [],
                purgeCache: false
            },
            _localContextKey: `HermitowskieFejki_${game_data.village.id}`,
            _cache_control_key: `HermitowskieFejki_CacheControl`,
            _now: Date.now(),
            init: function () {
                try {
                    this.checkConfig();
                    this.invalidateCache();
                    this.checkScreen();
                    let troops = this.selectTroops();
                    let target = this.selectTarget(troops);
                    this.displayTargetInfo(troops, target);
                } catch (err) {
                    UI.ErrorMessage(err, '1e3');
                }
            },
            checkConfig: function () {
                if (typeof(HermitowskieFejki) === 'undefined')
                    throw i18n.MISSING_CONFIGURATION;
                this._fixConfig(HermitowskieFejki);
            },
            invalidateCache() {
                let cacheControl = this._getCacheControl();
                let purgeCache = this._toBoolean(this._settings.purgeCache);
                for (const key in cacheControl) {
                    if (cacheControl.hasOwnProperty(key)) {
                        if (cacheControl[key] < this._now || purgeCache) {
                            let timestamp = this._invalidateItem(key, purgeCache);
                            if (timestamp === 0) {
                                delete cacheControl[key];
                            }
                            else {
                                cacheControl[key] = timestamp;
                            }
                        }
                    }
                }
                localStorage.setItem(this._cache_control_key, JSON.stringify(cacheControl));
            },
            checkScreen: function () {
                if ($('.jump_link').length) {
                    this.goToNextVillage(i18n.VILLAGE_OUT_OF_GROUP);
                }
                if (game_data.screen !== 'place' || $('#command-data-form').length !== 1) {
                    location = TribalWars.buildURL('GET', 'place', {mode: 'command'});
                    throw i18n.BAD_SCREEN;
                }
                // disable executing script on screen with command confirmation
                if ($('#troop_confirm_go').length !== 0) {
                    throw i18n.BLOCKED_SCREEN;
                }
            },
            goToNextVillage: function (message) {
                if (this._toBoolean(this._settings.skipVillages)) {
                    let switchRight = $('#village_switch_right')[0];
                    let jumpLink = $('.jump_link')[0];
                    if (switchRight) {
                        location = switchRight.href;
                    }
                    else if (jumpLink) {
                        location = jumpLink.href;
                    }
                }
                throw message;
            },
            selectTroops: function () {
                this._clearPlace();
                let place = this._getAvailableUnits();

                for (let template of this._settings.templates) {
                    if (this._isEnough(template, place)) {
                        if (this._fill(template, place)) {
                            return template;
                        }
                    }
                }
                this.goToNextVillage(i18n.INSUFFICIENT_TROOPS);
            },
            selectTarget: function (troops) {
                let slowest = this._slowestUnit(troops);
                let poll = this._sanitizeCoordinates(this._settings.coords);
                poll = this._targeting(poll);
                poll = this._removeUnreachableVillages(poll, troops, slowest);
                poll = this._applyLocalContext(poll);
                poll = this._applyCustomContexts(poll);
                return this._selectCoordinates(poll);
            },
            displayTargetInfo: function (troops, target) {
                let defaultTargetInput = $('.target-input-field');
                if (defaultTargetInput.length === 1) {
                    defaultTargetInput.val(target);
                }
                else { // mobile devices
                    $('#inputx').val(target.split('|')[0]);
                    $('#inputy').val(target.split('|')[1]);
                }
                this._selectUnits(troops);
                let arrivalTime = this._calculateArrivalTime(target, this._slowestUnit(troops));
                let attack_time = i18n.ATTACK_TIME
                    .replace('__DAY__', this._twoDigitNumber(arrivalTime.getDate()))
                    .replace('__MONTH__', this._twoDigitNumber(arrivalTime.getMonth() + 1))
                    .replace('__HOURS__', this._twoDigitNumber(arrivalTime.getHours()))
                    .replace('__MINUTES__', this._twoDigitNumber(arrivalTime.getMinutes()));
                UI.SuccessMessage(attack_time);
            },
            _removeUnreachableVillages: function (poll, troops, slowest) {
                if (troops.hasOwnProperty('snob') && Number(troops.snob) > 0) {
                    let max_dist = Number(worldInfo.config.snob.max_dist);
                    poll = poll.filter(coords =>
                        this._calculateDistanceTo(coords) <= max_dist
                    );
                }
                if (poll.length === 0) {
                    this.goToNextVillage(i18n.COORDS_EMPTY_SNOBS);
                }

                poll = poll.filter(coordinates =>
                    this._checkConstraints(this._calculateArrivalTime(coordinates, slowest))
                );
                if (poll.length === 0) {
                    this.goToNextVillage(i18n.COORDS_EMPTY_TIME);
                }

                return poll;
            },
            _invalidateItem: function (key, purge) {
                if (purge) {
                    localStorage.removeItem(key);
                    return 0;
                }
                let items = localStorage.getItem(key);
                items = JSON.parse(items);
                items = items.filter(item => item[1] > this._now);
                if (items.length === 0) {
                    localStorage.removeItem(key);
                    return 0;
                }
                localStorage.setItem(key, JSON.stringify(items));
                return Math.min(...items.map(item => item[1]));
            },
            _twoDigitNumber: function (number) {
                return `${Number(number) < 10 ? '0' : ''}${number}`;
            },
            _sanitizeCoordinates: function (coordinates) {
                let coordsRegex = new RegExp(/\d{1,3}\|\d{1,3}/g);
                let match = coordinates.match(coordsRegex);
                return match == null
                    ? []
                    : match;
            },
            _checkConstraints: function (arrivalTime) {
                let daysIntervals = this._settings.days.split(',');
                /* daysIntervals: ['1-23','23-30'], */
                let hoursIntervals = this._settings.intervals.split(',');
                /* hoursIntervals: ['7:00-8:00','23:00-23:59'], */
                if (this._isInInterval(arrivalTime, daysIntervals, this._parseDailyDate) === false) {
                    return false;
                }
                if (this._toBoolean(this._settings.omitNightBonus) && this._isInNightBonus(arrivalTime)) {
                    return false;
                }
                return this._isInInterval(arrivalTime, hoursIntervals, this._parseTime);
            },
            _isInNightBonus: function (arrivalTime) {
                if (!worldInfo.config.night.active) {
                    return false;
                }
                let timeInterval = [
                    `${worldInfo.config.night.start_hour}:00-
                     ${worldInfo.config.night.end_hour}:00`
                ];
                return this._isInInterval(arrivalTime, timeInterval, this._parseTime);
            },
            _selectCoordinates: function (poll) {
                let target = poll[Math.floor(Math.random() * poll.length)];
                this._save(target);
                return target;
            },
            _clearPlace: function () {
                $('[id^=unit_input_]').val('');
                let defaultTargetInput = $('.target-input-field');

                if (defaultTargetInput.length === 1) {
                    defaultTargetInput.val('');
                }
                else { // mobile devices
                    $('#inputy').val('');
                    $('#inputx').val('');
                }
            },
            _selectUnit: function (unitName, unitCount) {
                if (worldInfo.unit_info.hasOwnProperty(unitName) === false) {
                    throw i18n.UNKNOWN_UNIT.replace('__UNIT_NAME__', unitName);
                }
                let input = this._getInput(unitName);
                let maxUnitCount = Number(input.attr('data-all-count'));
                let selectedUnitCount = Number(input.val());
                unitCount = Math.min(maxUnitCount, selectedUnitCount + unitCount);
                input.val(unitCount === 0 ? '' : unitCount);
            },
            _selectUnits: function (units) {
                for (const unitName in units) {
                    if (units.hasOwnProperty(unitName))
                        this._selectUnit(unitName, units[unitName]);
                }
            },
            _countPopulations: function (units) {
                let sum = 0;
                for (const unitName in units) {
                    if (units.hasOwnProperty(unitName)) {
                        let pop = Number(worldInfo.unit_info[unitName].pop);
                        let quantity = units[unitName];
                        sum += pop * quantity;
                    }
                }
                return sum;
            },
            _getFillTable: function () {
                let entries = this._settings.fillWith.split(',');
                let fillTable = [];
                for (const entry of entries) {
                    let name = entry;
                    let quantity = 1e9;
                    if (name.indexOf(':') !== -1) {
                        let parts = entry.split(':');
                        name = parts[0];
                        quantity = Number(parts[1]);
                    }
                    name = name.trim();
                    fillTable.push([name, quantity]);
                }
                return fillTable;
            },
            _fill: function (template, place) {
                let left = Math.floor(game_data.village.points * Number(this._fakeLimit) * 0.01);
                left -= this._countPopulations(template);
                if ((left <= 0 || !this._shouldApplyFakeLimit(template)) && !this._toBoolean(this._settings.fillExact)) {
                    return true;
                }
                let fillTable = this._getFillTable();
                for (const entry of fillTable) {
                    let name = entry[0];
                    if (!worldInfo.unit_info.hasOwnProperty(name)) continue;
                    let minimum = entry[1];
                    let pop = Number(worldInfo.unit_info[name].pop);
                    if (!this._toBoolean(this._settings.fillExact)) {
                        if (name === 'spy' &&
                            game_data.units.filter(unit => unit !== 'spy').every(unit => Number(template[unit]) > 0)) {
                            let spies = (template['spy']) ? Number(template['spy']) : 0;
                            minimum = Math.min(minimum, Math.ceil(left / pop), 5 - spies);
                        } else {
                            minimum = Math.min(minimum, Math.ceil(left / pop));
                        }
                    }
                    let selected = 0;
                    if (!!template[name]) {
                        selected = template[name];
                    }
                    minimum = Math.min(place[name] - selected, minimum);
                    if (!template[name]) {
                        template[name] = minimum;
                    }
                    else {
                        template[name] += minimum;
                    }
                    left -= minimum * pop;
                    if ((left <= 0 || !this._shouldApplyFakeLimit(template)) && !this._toBoolean(this._settings.fillExact)) {
                        break;
                    }
                }
                return left <= 0 || !this._shouldApplyFakeLimit(template);
            },
            _slowestUnit: function (units) {
                let speed = 0;
                for (const unitName in units) {
                    if (units.hasOwnProperty(unitName) && units[unitName] !== 0) {
                        speed = Math.max(Number(worldInfo.unit_info[unitName].speed), speed);
                    }
                }
                if (speed === 0) {
                    throw i18n.NO_TROOPS_SELECTED;
                }
                return speed;
            },
            _fixConfig: function (userConfig) {
                // check if user have only valid settings

                for (let property in userConfig) {
                    if (!this._defaultSettings.hasOwnProperty(property)) {
                        throw i18n.UNKNOWN_OPTION.replace('__PROPERTY__', property);
                    }
                }

                // overwrite default values with user defined
                for (let property in this._defaultSettings) {
                    if (this._defaultSettings.hasOwnProperty(property)) {
                        this._settings[property] = JSON.parse(JSON.stringify(
                            (userConfig[property] === undefined)
                                ? this._defaultSettings[property]
                                : userConfig[property]
                        ));
                    }
                }
            },
            _toBoolean: function (input) {
                if (typeof(input) === 'boolean') {
                    return input;
                }
                return (input.toLowerCase() === 'true');
            },
            _calculateDistanceTo: function (target) {
                let dx = game_data.village.x - Number(target.split('|')[0]);
                let dy = game_data.village.y - Number(target.split('|')[1]);
                return Math.hypot(dx, dy);
            },
            _calculateArrivalTime: function (coordinates, slowestUnitSpeed) {
                let distance = this._calculateDistanceTo(coordinates);
                let timePerField = slowestUnitSpeed * 60 * 1000;
                return new Date(distance * timePerField + this._now);
            },
            _getInput: function (unitName) {
                let input = $(`#unit_input_${unitName}`);
                if (input.length === 0) {
                    throw i18n.NONEXISTENT_UNIT.replace('__UNIT_NAME__', unitName);
                }
                return input;
            },
            _isInInterval: function (value, intervals, predicate) {
                for (let i = 0; i < intervals.length; i++) {
                    if (predicate(value, intervals[i])) {
                        return true;
                    }
                }
                return false;
            },
            _parseDailyDate: function (value, interval) {
                let day = value.getDate();
                let range = interval.split('-');
                return Number(range[0]) <= day && day <= Number(range[1]);
            },
            _parseTime: function (value, interval) {
                let convertTimeToMinutes = timer => Number(timer[0]) * 60 + Number(timer[1]);
                let minutes = convertTimeToMinutes([value.getHours(), value.getMinutes()]);
                let range = interval.split('-');
                return convertTimeToMinutes(range[0].split(':')) <= minutes && minutes <= convertTimeToMinutes(range[1].split(':'));
            },
            _getAvailableUnits: function () {
                let units = game_data.units.filter(unit => unit !== 'militia');
                let obj = {};
                for (let unit of units) {
                    obj[unit] = Number(this._getInput(unit).attr('data-all-count'));
                    if (this._settings.safeguard.hasOwnProperty(unit)) {
                        let threshold = Number(this._settings.safeguard[unit]);
                        if (isNaN(threshold) || threshold < 0) {
                            throw i18n.INVALID_SETTINGS_SAFEGUARD
                                .replace('__UNIT_NAME__', unit)
                                .replace('__VALUE__', this._settings.safeguard[unit]);
                        }
                        obj[unit] = Math.max(0, obj[unit] - threshold);
                    }
                }
                return obj;
            },
            _isEnough: function (template, placeUnits) {
                for (let unit in template) {
                    if (template.hasOwnProperty(unit)) {
                        if (!worldInfo.unit_info.hasOwnProperty(unit) || template[unit] > placeUnits[unit])
                            return false;
                    }
                }
                return true;
            },
            _omitEmptyAndToLower: function (collection) {
                return collection
                    .map(name => name.trim())
                    .filter(name => name.length !== 0)
                    .map(name => name.toLowerCase());
            },
            _targeting: function (poll) {
                let players = this._omitEmptyAndToLower(this._settings.players.split(','));

                if (players.length === 0) {
                    return poll;
                }

                let playerIds = worldInfo.player.filter(p =>
                    players.some(target => target === p.name.toLowerCase())
                ).map(p => p.id);

                let villages = worldInfo.village.filter(v =>
                    playerIds.some(target => target === v.playerId)
                ).map(v => v.coords);

                villages = this._applyBoundingBoxes(villages);

                poll = [... new Set([...poll, ...villages])];
                if (poll.length === 0) {
                    this.goToNextVillage(i18n.COORDS_EMPTY);
                }
                return poll;
            },
            _save: function (coords) {
                this._saveEntry(coords, this._localContextKey, Number(this._settings.localContext));
                let customContexts = this._getCustomContexts();
                for (let customContext of customContexts) {
                    this._saveEntry(coords, customContext.key, customContext.liveTime);
                }
            },
            _saveEntry: function (coords, key, liveTime) {
                if (isNaN(liveTime)) {
                    return;
                }
                let expirationTime = this._now + liveTime * 60 * 1000;
                let recent = localStorage[key];
                recent = recent === undefined ? [] : JSON.parse(recent);
                recent.push([coords, expirationTime]);
                localStorage[key] = JSON.stringify(recent);
                this._updateCacheControl(key, expirationTime);
            },
            _updateCacheControl: function (key, expirationTime) {
                let cacheControl = this._getCacheControl();
                if (!cacheControl.hasOwnProperty(key) || cacheControl[key] > expirationTime) {
                    cacheControl[key] = expirationTime;
                    localStorage.setItem(this._cache_control_key, JSON.stringify(cacheControl));
                }
            },
            _getCacheControl: function () {
                let cacheControl = localStorage.getItem(this._cache_control_key);
                if (cacheControl == null) {
                    return {};
                }
                return JSON.parse(cacheControl);
            },
            _getCustomContexts: function () {
                return this._settings.customContexts.split(',')
                    .filter(value => value.length !== 0)
                    .map(entry => entry.split(":"))
                    .map(entry => {
                        return {
                            key: `HermitowskieFejki_${entry[0].trim()}`,
                            liveTime: Number(entry[1])
                        }
                    });
            },
            _applyLocalContext: function (poll) {
                poll = this._omitRecentlySelectedCoords(poll, {
                    key: this._localContextKey,
                    liveTime: Number(this._settings.localContext)
                });
                if (poll.length === 0) {
                    this.goToNextVillage(i18n.COORDS_EMPTY_CONTEXTS);
                }
                return poll;
            },
            _applyCustomContexts: function (poll) {
                let customContexts = this._getCustomContexts();
                for (let customContext of customContexts) {
                    poll = this._omitRecentlySelectedCoords(poll, customContext);
                }
                if (poll.length === 0) {
                    this.goToNextVillage(i18n.COORDS_EMPTY_CONTEXTS);
                }
                return poll;
            },
            _omitRecentlySelectedCoords(poll, context) {
                let recent = localStorage.getItem(context.key);
                if (recent === null) {
                    return poll;
                }
                recent = JSON.parse(recent);
                return this._exclude(poll, recent.map(entry => entry[0]));
            },
            _exclude: function (poll, excluded) {
                let banned = new Set([...excluded]);
                return poll.filter(pollCoords => !banned.has(pollCoords));
            },
            _applyBoundingBoxes: function (poll) {
                if (this._settings.boundingBoxes.length === 0) {
                    return poll;
                }

                let coords = poll.map(c => {
                    let parts = c.split('|');
                    return {
                        x: Number(parts[0]),
                        y: Number(parts[1])
                    }
                });

                coords = coords.filter(c => {
                    return this._settings.boundingBoxes.some(boundingBox => {
                        return (boundingBox.minX <= c.x && c.x <= boundingBox.maxX) &&
                            (boundingBox.minY <= c.y && c.y <= boundingBox.maxY);
                    });
                });
                return coords.map(c => `${c.x}|${c.y}`);
            },
            _shouldApplyFakeLimit: function (units) {
                return game_data.units.filter(unit => unit !== 'spy').some(unit => Number(units[unit]) > 0) || units['spy'] < 5;
            }
        };
    }
}

Faking();