/**
 * Helper for distributing deff troops
 * Created by: Hermitowski
 * Modified on: 30/03/2018 - version 2.0 - initial release
 * Modified on: 25/10/2018 - version 2.1 - added strategy for selecting villages
 * Modified on: 27/10/2018 - version 2.2 - added time range filter
 */

(function (TribalWars) {
    let Info = {
        SETTINGS_SAVED: 'Zapisano pomy\u{15B}lnie',
        SETTINGS_RESET: 'Przywr\u{F3}cono domy\u{15B}lne ustawienia',
        CURRENT_SELECTED_GROUP: 'Obecnie wybrana grupa',
        LEGEND: {
            ratio: 'Przeliczniki',
            safeguard: 'Rezerwa',
            initial: 'Domy\u{15B}lne warto\u{15B}ci'
        },
        DESCRIPTION: {
            initial: {
                deffCount: 'Ilo\u{15B}\u{107} deffa',
                spyCount: 'Ilo\u{15B}\u{107} zwiadu',
                villageCount: 'Ilo\u{15B}\u{107} wiosek',
                minimumCount: 'Ilo\u{15B}\u{107} minimalna',
                strategy: 'Strategia wybierania',
                group_id: 'Domy\u{15B}lna grupa',
                date: 'Data dotarcia'
            },
            strategy: {
                TROOP_ASC: 'Ilo\u{15B}\u{107} wojsk rosnaco',
                TROOP_DESC: 'Ilo\u{15B}\u{107} wojsk malej\u{105}co',
                DIST_ASC: 'Odleg\u{142}o\u{15B}\u{107} rosn\u{105}co',
                DIST_DESC: 'Odleg\u{142}o\u{15B}\u{107} malej\u{105}co',
                RANDOM: 'Losowo xD'
            },
            ratio: {
                spear: 'Przelicznik - Pikinier',
                sword: 'Przelicznik - Miecznik',
                archer: 'Przelicznik - \u{141}ucznik',
                spy: 'Przelicznik - Zwiadowca',
                heavy: 'Przelicznik - Ci\u{119}\u{17C}ka kawaleria',
            },
            safeguard: {
                spear: 'Rezerwa - Pikinier',
                sword: 'Rezerwa - Miecznik',
                archer: 'Rezerwa - \u{141}ucznik',
                spy: 'Rezerwa - Zwiadowca',
                heavy: 'Rezerwa - Ci\u{119}\u{17C}ka kawaleria',
            },
            BUTTONS: {
                SAVE_SETTINGS: 'Zapisz',
                RESET_SETTINGS: 'Przywr\u{F3}\u{107} domy\u{15B}lne',
                CALCULATE: 'Oblicz',
                SEND: 'Wykonaj'
            },
            HEADERS: {
                TARGET: 'Cel',
                GROUP: 'Grupa',
                PROCESS: 'Oblicz',
                SELECTED: 'Wybrano'
            },
        },
        ERROR: {
            BLANK: 'Pole <strong>__1__</strong> jest puste',
            NAN: 'Pole <strong>__1__</strong> nie reprezentuje liczby',
            NEGATIVE_NUMBER: 'Pole <strong>__1__</strong> jest ujemne',
            BAD_FORMAT: 'Pole <strong>__1__</strong> ma z\u{142}y format'
        }
    };

    let Guard = {
        _beautifyNumber: function (number) {
            let prefix = ['', 'K', 'M', 'G'];
            for (let i = 0; i < prefix.length; i++) {
                if (number >= 1000) {
                    number /= 1000;
                } else {
                    if (i === 0)
                        return number.toFixed(2);
                    let fraction = 2;
                    if (number >= 10)
                        fraction = 1;
                    if (number >= 100)
                        fraction = 0;
                    return `${number.toFixed(fraction)}${prefix[i]}`;
                }
            }
            return `${number.toFixed(0)}T`;
        },
        _parseDate: function (dateString) {
            dateString = dateString.trim();
            let parts = dateString.split(' ');
            if (parts.length !== 2) {
                throw 'Invalid date';
            }

            let result = {};
            let dateParts = parts[0].split('.').filter(x => x.trim().length !== 0);
            let timeParts = parts[1].split(':').filter(x => x.trim().length !== 0);
            if (dateParts.length < 2 || timeParts.length < 2) {
                throw 'Invalid date';
            }
            result['day'] = Number(dateParts[0]);
            result['month'] = Number(dateParts[1]);
            result['year'] = dateParts.length === 3
                ? Number(dateParts[2])
                : new Date().getFullYear();

            result['hour'] = Number(timeParts[0]);
            result['minute'] = Number(timeParts[1]);
            result['second'] = timeParts.length === 3
                ? Number(timeParts[2])
                : 0;
            for (const key in result) {
                if (isNaN(result[key])) {
                    throw `${key} is invalid`;
                }
            }
            return new Date(result.year, result.month - 1, result.day, result.hour, result.minute, result.second);
        },
        _isNumber: function (selector, replacement) {
            let emptyRegex = new RegExp(/^\s*$/);
            let input = $(selector);
            let value = input.val();
            if (emptyRegex.test(value)) {
                UI.ErrorMessage(Info.ERROR.BLANK.replace('__1__', replacement));
                input.trigger('focus');
                return false;
            }
            let numericValue = Number(value);
            if (isNaN(numericValue)) {
                UI.ErrorMessage(Info.ERROR.NAN.replace('__1__', replacement));
                input.trigger('focus');
                return false;
            }
            if (numericValue < 0) {
                UI.ErrorMessage(Info.ERROR.NEGATIVE_NUMBER.replace('__1__', replacement));
                input.trigger('focus');
                return false;
            }
            return true;
        },

        addToResults: function (village, coords, groupId) {
            let misc = {
                x: coords[0],
                y: coords[1],
                from: 'simulator',
                village: village.id
            };
            let anyUnit = false;
            for (const unit in Guard._defaultSettings.safeguard) {
                if (!Guard._defaultSettings.safeguard.hasOwnProperty(unit)) continue;
                if (village.units[unit] !== 0) {
                    misc[unit] = village.units[unit];
                    anyUnit = true;
                }
            }
            // empty entry
            if (anyUnit === false)
                return;
            let row = $('<tr>');

            let villageLink = TribalWars.buildURL('GET', 'info_village', {id: village.id});


            let placeLink = TribalWars.buildURL('GET', 'place', misc);


            let villageCell = $('<td>', {
                html: `<a href="${villageLink}">${village.name}</a>`
            });
            row.append(villageCell);

            for (const unit in village.units) {
                if (!village.units.hasOwnProperty(unit)) continue;
                let unitCell = $('<td>');
                unitCell.text(village.units[unit]);
                if (village.units[unit] === 0) {
                    unitCell.addClass('hidden');
                }
                row.append(unitCell);
            }

            let placeCell = $('<td>');

            let placeA = $('<a>', {
                href: placeLink,
                text: Info.DESCRIPTION.BUTTONS.SEND
            });
            placeCell.attr('href', placeLink);
            let deleteRow = function () {
                // delete cached information for future recalculations as the command may be issued
                Guard._unitsPerGroup.delete(groupId);
                $(this).closest('tr').remove();
            };
            placeA.on('click', deleteRow);
            placeCell.append(placeA);
            row.append(placeCell);
            $('#GuardResultList').append(row);
        },
        createGui: function () {
            let div = $('<div>', {
                id: 'HermitianGuard',
                class: 'vis vis_item'
            });
            let mainTable = $('<table>', {
                width: '100%'
            });
            let head = $('<thead>');
            let header = $('<tr>', {
                html:
                `<th><label class="center" for="Guard_target">${Info.DESCRIPTION.HEADERS.TARGET}</label></th>` +
                `<th><label class="center" for="Guard_group">${Info.DESCRIPTION.HEADERS.GROUP}</label></th>` +
                `<th><label class="center" for="Guard_deffCount">${Info.DESCRIPTION.initial.deffCount}</label></th>` +
                `<th><label class="center" for="Guard_spyCount">${Info.DESCRIPTION.initial.spyCount}</label></th>` +
                `<th><label class="center" for="Guard_villageCount">${Info.DESCRIPTION.initial.villageCount}</label></th>` +
                `<th><label class="center" for="Guard_minimumCount">${Info.DESCRIPTION.initial.minimumCount}</label></th>` +
                `<th><label class="center" for="Guard_strategy">${Info.DESCRIPTION.initial.strategy}</label></th>` +
                `<th><label class="center" for="Guard_date">${Info.DESCRIPTION.initial.date}</label></th>` +
                `<th></th>` + // padding for buttton
                `<th><img id="Guard_settings" src="${image_base}icons/settings.png" alt="settings"/></th>`
            });
            let inputRow = $('<tr>', {
                html:
                `<td><input id='Guard_target' type='text' size='8' pattern="\\s*\\d{1,3}\\|\\d{1,3}\\s*"/></td>` +
                `<td><select id='Guard_group'></select></td>` +
                `<td><input size="16" id='Guard_deffCount' type="text" pattern="\\s*\\d+\\s*"></td>` +
                `<td><input size="16" id='Guard_spyCount' type="text" pattern="\\s*\\d+\\s*"></td>` +
                `<td><input size="16" id='Guard_villageCount' type="text" pattern="\\s*\\d+\\s*"></td>` +
                `<td><input size="16" id='Guard_minimumCount' type="text" pattern="\\s*\\d+\\s*"></td>` +
                `<td><select id='Guard_strategy'/></td>` +
                `<td><span><input id='Guard_apply_filter_date' type="checkbox"><input id='Guard_date' size="16" type="text" disabled/></span></td>` +
                `<td><input id='Guard_calculate' class="btn" type="button" disabled="disabled" value="${Info.DESCRIPTION.BUTTONS.CALCULATE}"/></td>` +
                `<td></td>` // padding for settings icon
            });
            head.append(header);
            head.append(inputRow);

            let createResultTable = function () {

                let table = $('<table>', {
                    width: '100%'
                });
                let head = $('<thead>');
                let body = $('<tbody>', {
                    id: 'GuardResultList'
                });

                let addCell = function (unit_name) {
                    let html = `<th>`;
                    html += `<img src="${image_base}unit/unit_${unit_name}.png" alt="${unit_name}"/>`;
                    html += `(<span id="Guard_selected_${unit_name}">0</span>`;
                    html += `/`;
                    html += `<span id="Guard_all_${unit_name}">0</span>)`;
                    html += `</th>`;
                    return html;
                };

                let header = `<th><img src="${image_base}face.png" alt="deff"/>`;
                header += `(<span id="Guard_selected_deff">0</span>/<span id="Guard_all_deff">0</span>)</th>`;
                for (const unit in Guard._defaultSettings.safeguard) {
                    if (!Guard._defaultSettings.safeguard.hasOwnProperty(unit)) continue;
                    header += addCell(unit);
                }
                header += '<th>Rozkaz</th>';
                head.append(header);
                table.append(head);
                table.append(body);
                return table;
            };

            let resultTable = createResultTable();

            let subDiv = $('<div class="vis vis_item" style="overflow-y:auto;height:200px">');

            subDiv.append(resultTable);

            mainTable.append(head);
            div.append(mainTable);
            div.append(subDiv);

            $('#contentContainer').prepend(div);

        },
        initGui: function () {
            // target
            let input = $('#Guard_target');
            input.val(`${game_data.village.x}|${game_data.village.y}`);
            if (game_data.screen === 'info_village') {
                input.val(`${TWMap.pos[0]}|${TWMap.pos[1]}`);
            }
            let strategy$ = $('#Guard_strategy');
            for (const key of Guard._strategies) {
                let option$ = $('<option>', {text: Info.DESCRIPTION.strategy[key], value: key});
                strategy$.append(option$);
            }
            for (const key in Guard._defaultSettings.initial) {
                if (!Guard._defaultSettings.initial.hasOwnProperty(key)) continue;
                $(`#Guard_${key}`).val(Guard._settings.initial[key]);
            }
            let default_date = new Date();
            if (Guard._worldInfo.config.night.active) {
                let end_hour = Number(Guard._worldInfo.config.night.end_hour);
                if (default_date.getHours() >= end_hour) {
                    default_date.setDate(default_date.getDate() + 1);
                }
                default_date.setHours(end_hour);
            }

            $('#Guard_date').val(`${default_date.getDate()}.${default_date.getMonth() + 1} ${default_date.getHours()}:00:00`);
            // handlers
            $('#Guard_calculate').on('click', Guard.Calculate);
            $('#Guard_settings').on('click', Guard.EditSettings);
            $('#Guard_apply_filter_date').on('change', (e) => {
                $('#Guard_date').prop('disabled', !e.target.checked);
            });

            let getGroupsInfo = function () {
                let url = TribalWars.buildURL('GET', 'groups', {mode: 'overview', ajax: 'load_group_menu'});
                return fetch(url, {credentials: 'include'}).then(t => t.text()).then(response => {
                    let groups = JSON.parse(response);
                    groups.result.filter(x => x.type !== 'separator').map(x => {
                        Guard._groups.push(x.group_id);
                        Guard._groupId2Name[x.group_id] = x.name;
                        return x.group_id;
                    });
                    return groups;
                });
            };

            getGroupsInfo().then(groupInfo => {
                let select = $("#Guard_group");
                for (const group of groupInfo.result) {
                    if (group.type === 'separator') continue;
                    let option = $('<option>');
                    option.val(group.group_id);
                    option.text(group.name);
                    select.append(option);
                }
                select.val(Number(Guard._settings.initial.group_id) === Guard._defaultSettings.initial.group_id
                    ? groupInfo.group_id
                    : Guard._settings.initial.group_id);
                $('#Guard_calculate').prop('disabled', false);
            });

        },

        Calculate: function () {

            let checkInput = function (userInput) {
                let numeric = ['deffCount', 'spyCount', 'villageCount', 'minimumCount'];
                for (const key of numeric) {
                    let input = $(`#Guard_${key}`);
                    let value = input.val();
                    if (!Guard._isNumber(`#Guard_${key}`, Info.DESCRIPTION.initial[key]))
                        return false;
                    userInput[key] = Number(value);
                }

                let coordsRegex = new RegExp(/^\s*\d{1,3}\|\d{1,3}\s*$/);
                let coordsInput = $('#Guard_target');
                if (!coordsRegex.test(coordsInput.val())) {
                    UI.ErrorMessage(Info.ERROR.BAD_FORMAT.replace('__1__', Info.DESCRIPTION.HEADERS.TARGET));
                    coordsInput.trigger('focus');
                    return false;
                }
                userInput['target'] = coordsInput.val();
                userInput['strategy'] = $('#Guard_strategy').val();
                try {
                    if ($('#Guard_apply_filter_date').prop('checked')) {
                        let target_date = Guard._parseDate($('#Guard_date').val());
                        userInput['travel_time'] = (target_date.getTime() - Date.now()) / 60 / 1000;
                    }
                    else {
                        userInput['travel_time'] = NaN;
                    }
                }
                catch (e) {
                    UI.ErrorMessage(e, 3e3);
                    return false;
                }
                return true;
            };

            let normalizeVillages = function (villages) {
                let target = userInput.target.split('|').map(x => Number(x));
                let normalizeVillage = function (village) {
                    let normalized = {
                        deff: 0,
                        name: village.name,
                        id: village.id,
                        coords: village.coords,
                        distance: Math.hypot(target[0] - village.coords[0], target[1] - village.coords[1]),
                        units: {}
                    };
                    for (const unit in Guard._defaultSettings.safeguard) {
                        if (!Guard._defaultSettings.safeguard.hasOwnProperty(unit)) continue;
                        let ratio = Guard._settings.ratio[unit] === undefined
                            ? 0
                            : Number(Guard._settings.ratio[unit]);

                        normalized.units[unit] = village.units[unit] === undefined
                            ? 0
                            : Math.max(village.units[unit] - Number(Guard._settings.safeguard[unit]), 0);

                        // check whether unit travel time is in time range
                        if (!isNaN(userInput.travel_time) && Guard._worldInfo.unit_info.hasOwnProperty(unit)) {
                            if (Number(Guard._worldInfo.unit_info[unit].speed) * normalized.distance > userInput.travel_time) {
                                normalized.units[unit] = 0;
                            }
                        }

                        normalized.deff += Number(normalized.units[unit]) * ratio;
                    }
                    return normalized;
                };


                let normalizedVillages = {
                    villages: [],
                    all: {deff: 0},
                    selected: {deff: 0}
                };

                for (const unit in Guard._defaultSettings.safeguard) {
                    if (!Guard._defaultSettings.safeguard.hasOwnProperty(unit)) continue;
                    normalizedVillages.all[unit] = 0;
                    normalizedVillages.selected[unit] = 0;
                }

                for (const village of villages) {
                    let normalized = normalizeVillage(village);

                    for (const unit in Guard._defaultSettings.safeguard) {
                        if (!Guard._defaultSettings.safeguard.hasOwnProperty(unit)) continue;
                        normalizedVillages.all[unit] += normalized.units[unit];
                    }
                    normalizedVillages.all.deff += normalized.deff;
                    normalizedVillages.villages.push(normalized);
                }
                return normalizedVillages;
            };

            let sortByOwnedDeffAsc = function (lhs, rhs) {
                return lhs.deff !== rhs.deff ? lhs.deff > rhs.deff ? 1 : -1 : 0;
            };
            let sortByOwnedDeffDesc = function (lhs, rhs) {
                return lhs.deff !== rhs.deff ? lhs.deff > rhs.deff ? -1 : 1 : 0;
            };

            let sortByOwnedSpiesDesc = function (lhs, rhs) {
                return lhs.units.spy !== rhs.units.spy ? lhs.units.spy > rhs.units.spy ? -1 : 1 : 0;
            };
            let sortByOwnedSpiesAsc = function (lhs, rhs) {
                return lhs.units.spy !== rhs.units.spy ? lhs.units.spy > rhs.units.spy ? 1 : -1 : 0;
            };

            let sortByDistanceDesc = function (lhs, rhs) {
                return lhs.distance !== rhs.distance ? lhs.distance > rhs.distance ? -1 : 1 : 0;
            };
            let sortByDistanceAsc = function (lhs, rhs) {
                return lhs.distance !== rhs.distance ? lhs.distance > rhs.distance ? 1 : -1 : 0;
            };

            let sortByDistance = function (villages, userInput) {
                userInput.strategy === 'DIST_ASC'
                    ? villages.sort(sortByDistanceAsc)
                    : villages.sort(sortByDistanceDesc);
            };

            let randomSort = function (villages) {
                for (let i = villages.length - 1; i > 0; i--) {
                    let j = Math.floor(Math.random() * (i + 1));
                    let x = villages[i];
                    villages[i] = villages[j];
                    villages[j] = x;
                }
                return villages;
            };

            let preprocessVillages = function (normalized) {
                normalized.villages = normalized.villages.filter(village => village.deff >= userInput.minimumCount);

                if (userInput.deffCount) {
                    normalized.villages = normalized.villages.filter(village => village.deff !== 0);
                }
                else {
                    // we need only spies
                    normalized.villages = normalized.villages.filter(village => village.units.spy !== 0);
                }
                switch (userInput.strategy) {
                    case 'DIST_ASC':
                    case 'DIST_DESC':
                        sortByDistance(normalized.villages, userInput);
                        break;
                    case 'RANDOM':
                        randomSort(normalized.villages);
                        break;
                    case 'TROOP_ASC':
                        normalized.villages.sort(userInput.deffCount
                            ? sortByOwnedDeffAsc
                            : sortByOwnedSpiesAsc
                        );
                        break;
                    case 'TROOP_DESC':
                    default:
                        normalized.villages.sort(userInput.deffCount
                            ? sortByOwnedDeffDesc
                            : sortByOwnedSpiesDesc
                        );
                        break;
                }
                // take as many villages as user wanted
                normalized.villages = normalized.villages.slice(0, userInput.villageCount);
                return normalized;
            };

            let selectDeff = function (normalized) {
                normalized = preprocessVillages(normalized);

                // deff selection
                normalized.villages.sort(sortByOwnedDeffDesc);
                for (let i = normalized.villages.length; i > 0; i--) {
                    let village = normalized.villages[i - 1];
                    // on average we should pick this amount deff to balance distribution
                    let threshold = (userInput.deffCount - normalized.selected.deff) / i;
                    let ratio = threshold < village.deff ? threshold / village.deff : 1.0;
                    for (const unit in Guard._defaultSettings.ratio) {
                        if (!Guard._defaultSettings.ratio.hasOwnProperty(unit)) continue;
                        let selectedCount = Math.min(Math.round(ratio * village.units[unit]), village.units[unit]);
                        normalized.selected[unit] += selectedCount;
                        normalized.selected['deff'] += selectedCount * Number(Guard._settings.ratio[unit]);
                        village.units[unit] = selectedCount;
                    }
                }
                // spy selection
                normalized.villages.sort(sortByOwnedSpiesDesc);
                for (let i = normalized.villages.length; i > 0; i--) {
                    let village = normalized.villages[i - 1];
                    let threshold = (userInput.spyCount - normalized.selected.spy) / i;
                    let ratio = threshold < village.units.spy ? threshold / village.units.spy : 1.0;
                    let selectedCount = Math.min(Math.round(ratio * village.units.spy), village.units.spy);
                    normalized.selected.spy += selectedCount;
                    village.units.spy = selectedCount;
                }
                for (const name in normalized.all) {
                    if (!normalized.all.hasOwnProperty(name)) continue;
                    let selected = Guard._beautifyNumber(normalized.selected[name]);
                    let all = Guard._beautifyNumber(normalized.all[name]);
                    $(`#Guard_selected_${name}`).text(selected);
                    $(`#Guard_all_${name}`).text(all);
                }

                return normalized;
            };

            let userInput = {};
            if (!checkInput(userInput)) {
                return;
            }
            // clear output
            $('#GuardResultList').find('tr').remove();
            $('#Guard_calculate').prop('disabled', true);
            let selectedGroupId = $('#Guard_group').val();
            Guard.getUnitsForGroup(selectedGroupId).then(villages => {
                let normalized = normalizeVillages(villages);
                selectDeff(normalized);
                for (const village of normalized.villages) {
                    Guard.addToResults(village, userInput.target.split('|'), selectedGroupId);
                }
                $('#Guard_calculate').prop('disabled', false);
            });
        },
        getUnitsForGroup: function (group_id) {
            if (Guard._unitsPerGroup.has(group_id)) {
                let villages = Guard._unitsPerGroup.get(group_id);
                return new Promise(resolve => resolve(villages));
            }
            let url = TribalWars.buildURL('GET', 'overview_villages', {
                mode: 'units',
                type: 'own_home',
                group: group_id
            });
            return fetch(url, {credentials: "same-origin"}).then(t => t.text()).then(response => {
                let requestedBody = $('<body>', {
                    html: response
                });
                let unitsTable = requestedBody.find('#units_table').get(0);
                let villages = [];
                if (unitsTable !== undefined) {
                    for (let i = 1; i < unitsTable.rows.length; i++) {
                        let row = unitsTable.rows[i];
                        // scan for units
                        let units = {};
                        const offset = 2;
                        for (let j = 0; j < game_data.units.length; j++) {
                            let unit_name = game_data.units[j];
                            units[unit_name] = Number(row.cells[offset + j].textContent);
                        }
                        // general info
                        let mainCell = row.cells[0];
                        let name = mainCell.textContent.trim();
                        let villageInfo = {
                            name: name,
                            coords: name.match(/\d+\|\d+/).pop().split('|').map(x => Number(x)),
                            id: mainCell.children[0].getAttribute('data-id'),
                            units: units
                        };
                        villages.push(villageInfo);
                    }
                }
                Guard._unitsPerGroup.set(group_id, villages);
                return villages;
            });
        },
        EditSettings: function () {

            let addUnitFieldset = function (branch) {
                let fieldset = `<fieldset><legend>${Info.LEGEND[branch]}</legend><table>`;
                for (const unit_name in Guard._defaultSettings[branch]) {
                    if (!Guard._defaultSettings[branch].hasOwnProperty(unit_name)) continue;
                    let id = `Guard_default_${branch}_${unit_name}`;
                    let value = Guard._settings[branch][unit_name];
                    fieldset += '<tr>';
                    fieldset += `<td><label for="${id}"><image src="${image_base}unit/unit_${unit_name}.png" alt="${unit_name}"></image></label></td>`;
                    fieldset += `<td><input id="${id}" value="${value}"/></td>`;
                    fieldset += '</tr>';
                }
                fieldset += '</table></fieldset>';
                return fieldset;
            };

            let addSettingsInput = function (id, value) {
                return `<td><input id="${id}" value="${value}"/></td>`;
            };

            let addSettingsSelect = function (id, value, options, map) {
                let html = `<td><select id="${id}">`;
                for (let option of options) {
                    html += `<option value="${option}">${map ? map[option] : option}</option>`
                }
                html += '</select></td>';
                return html;
            };

            let addInfoFieldset = function (branch) {
                let fieldset = `<fieldset><legend>${Info.LEGEND[branch]}</legend><table>`;
                for (const key in Guard._defaultSettings[branch]) {
                    if (!Guard._defaultSettings[branch].hasOwnProperty(key)) continue;
                    let id = `Guard_default_${branch}_${key}`;
                    let value = Guard._settings[branch][key];
                    fieldset += '<tr>';
                    fieldset += `<td><label for="${id}">${Info.DESCRIPTION[branch][key]}:</label></td>`;
                    if (key === 'strategy') {
                        fieldset += addSettingsSelect(id, value, Guard._strategies, Info.DESCRIPTION.strategy);
                    }
                    else if (key === 'group_id') {
                        fieldset += addSettingsSelect(id, value, Guard._groups, Guard._groupId2Name);
                    }
                    else {
                        fieldset += addSettingsInput(id, value);
                    }
                    fieldset += '</tr>';
                }
                fieldset += '</table></fieldset>';
                return fieldset;
            };

            let saveSettings = function () {
                let settings = {};
                for (const branch in Guard._defaultSettings) {
                    if (!Guard._defaultSettings.hasOwnProperty(branch)) continue;
                    settings[branch] = {};
                    for (const key in Guard._defaultSettings[branch]) {
                        if (!Guard._defaultSettings[branch].hasOwnProperty(key)) continue;
                        let userInput = $(`#Guard_default_${branch}_${key}`);
                        let userValue = userInput.val();
                        if (['strategy', 'group_id'].indexOf(key) !== -1) {
                            settings[branch][key] = userValue;
                        }
                        else {
                            if (!Guard._isNumber(`#Guard_default_${branch}_${key}`, Info.DESCRIPTION[branch][key])) {
                                return;
                            }
                            settings[branch][key] = Number(userValue);
                        }
                        // apply changes to current setttings, but don't change user's input
                        if (branch !== 'initial') {
                            Guard._settings[branch][key] = settings[branch][key];
                        }
                    }
                }
                localStorage[Guard._storageKey] = JSON.stringify(settings);
                UI.SuccessMessage(Info.SETTINGS_SAVED);
                $('.popup_box_close').trigger('click');
            };

            let resetSettings = function () {
                localStorage.removeItem(Guard._storageKey);
                UI.SuccessMessage(Info.SETTINGS_RESET);
                $('.popup_box_close').trigger('click');
            };
            let gui = '<div>';
            gui += addUnitFieldset('ratio');
            gui += addUnitFieldset('safeguard');
            gui += addInfoFieldset('initial');
            gui += `<button id="GuardResetSettings" class="btn">${Info.DESCRIPTION.BUTTONS.RESET_SETTINGS}</button>`;
            gui += `<button id="GuardSaveSettings" class="btn right">${Info.DESCRIPTION.BUTTONS.SAVE_SETTINGS}</button><div>`;
            Dialog.show('GuardOptionEditor', gui);
            $('#GuardSaveSettings').on('click', saveSettings);
            $('#GuardResetSettings').on('click', resetSettings);

        },
        _storageKey: 'GuardSettings',
        _unitsPerGroup: new Map(),
        _strategies: ['TROOP_DESC', 'TROOP_ASC', 'DIST_DESC', 'DIST_ASC', 'RANDOM'],
        _groups: ['-1'],
        _groupId2Name: {
            '-1': Info.CURRENT_SELECTED_GROUP
        },
        _defaultSettings: {
            ratio: {
                spear: 1,
                sword: 1,
                archer: 1,
                heavy: 6
            },
            safeguard: {
                spear: 0,
                sword: 0,
                archer: 0,
                spy: 0,
                heavy: 0
            },
            initial: {
                deffCount: 0,
                spyCount: 0,
                villageCount: 12,
                minimumCount: 0,
                strategy: 'TROOP_DESC',
                group_id: -1
            },
        },
        _settings: {},
        initSettings: function () {
            let storedSettingsJson = localStorage.getItem(Guard._storageKey);
            if (storedSettingsJson === null) {
                let settingsJson = JSON.stringify(Guard._defaultSettings);
                localStorage.setItem(Guard._storageKey, settingsJson);
                Guard._settings = JSON.parse(settingsJson);
                return;
            }
            Guard._settings = JSON.parse(storedSettingsJson);
        },
        init: function (worldInfo) {
            let instance = $('#HermitianGuard');
            if (0 === instance.length) {
                Guard._worldInfo = worldInfo;
                Guard.initSettings();
                Guard.createGui();
                Guard.initGui();
            }
            else {
                instance.remove();
            }
        },
    };

    $.getScript('https://media.innogamescdn.com/com_DS_PL/skrypty/MapFiles.js', () => {
        GetWorldInfo({
            config: {}, unit_info: {}
        }).then(worldInfo => {
            Guard.init(worldInfo);
        });

    });
})(TribalWars);
