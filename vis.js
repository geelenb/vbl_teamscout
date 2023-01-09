function get_most_common_number_per_player(roster_for_games) {
    const name_to_counts = {};

    roster_for_games.forEach(players_in_a_game => {
        players_in_a_game.forEach(player => {
            if (player['Functie'] !== 'S') {
                return
            }
            const rugnr = String(player['RugNr']);
            if (player['RelGUID'] in name_to_counts) {
                if (rugnr in name_to_counts[player['RelGUID']]) {
                    name_to_counts[player['RelGUID']][rugnr] += 1
                } else {
                    name_to_counts[player['RelGUID']][rugnr] = 1
                }
            } else {
                name_to_counts[player['RelGUID']] = {};
                name_to_counts[player['RelGUID']][rugnr] = 1
            }
        })
    });

    const guid_to_most_common = {};
    for (let guid in name_to_counts) {
        if (!guid) {
            continue;
        }
        let max_count = 0;
        for (let number in name_to_counts[guid]) {
            let count = name_to_counts[guid][number];
            if (count > max_count) {
                max_count = name_to_counts[guid][number];
                guid_to_most_common[guid] = number
            }
        }
    }

    return guid_to_most_common
}

const months = ['', 'januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
const short_months = ['', 'jan', 'feb', 'maa', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

const short_teamnames = [
    "As", "Achel", "Alken", "Asse-Ternat", "Aarschot",
    "Bilzerse", "Black Sheep", "Bree", "Beringen", "Brasschaat", "Bertem", "Bavi", "Bulldogs",
    "Cosmo",
    "Dilbeek", "Dino",
    "Gems", "Grimbergen",
    "Hades", "Hasselt BT", "Helchteren", "Hageland", "Haacht", "Halle",
    "Maasmechelen", "Mechelen", "Merchtem",
    "Kortenberg", "Kapelle",
    "Landen", "Leopoldsburg", "Lommel", "Lummen", "Londerzeelse", "Leuven Bears",
    "Machelen", "Molenbeek",
    "Nijlen",
    "Optima", "Orly", "Opwijk",
    "Pelt", "Peer",
    "Rode Leeuwen",
    "Sint-Truiden", "Stevoort", "Streek Inn",
    "Tienen", "Tongeren",
    "Vorst",
    "Waremme", "Woluwe", "WIZ", "Waregem", "Wemmel",
    "Zolder", "Zonhoven", "Zemst", "Zaventem",
];
const short_teamname_and_re = short_teamnames.map(short => [short, RegExp(`\\b${short}\\b`)]);

function shorten_teamname(teamname) {
    const found_short_teamname = short_teamname_and_re
        .filter(([short, re]) => re.test(teamname))
        .map(([short, re]) => `${short.trim()} ${teamname[teamname.length - 1]}`)[0]
    return found_short_teamname || teamname;
}

function shorten_teamname_more(teamname) {
    const found_short_teamname = short_teamname_and_re
        .filter(([short, re]) => re.test(teamname))
        .map(([short, re]) => short.trim())[0]
    return found_short_teamname || teamname;
}

const th = content => `<th></th><th colspan="2" style="text-align: left;">${content}</th>`;
const td_data = content => `<td class="data">${content}</td>`;

// const char_for_winst = w => String.fromCodePoint(w ? 0x2705 : 0x274C);
const char_for_winst = w => w ? String.fromCodePoint(0x2705) : '';
// const home_away_char = is_home => String.fromCodePoint(is_home ? 0x1F3E0 : 0x1F697);
const home_away_char = is_home => is_home ? String.fromCodePoint(0x1F3E0) : '';

function make_row_for_player(disp_name, number, birth_date, player_data_cells, tr_class="player") {
    let row = [ // list of strings we will join at the end
        `<tr class="${tr_class}">`,
        `<td class="data">${number}</td>`,
        `<td class="spelersnaam">${disp_name}</td>`,
        `<td class="data borderright">${birth_date}</td>`,
    ];

    let sum = 0;
    let count = 0;
    player_data_cells.forEach(data_cell => {
        if (data_cell === undefined || data_cell == 'NaN') { // don't use isnan here, strings might be passed in!
            row.push(td_data(''))
        } else {
            sum += parseInt(data_cell);
            count += 1;
            row.push(td_data(data_cell))
        }
    });

    if (count === 0) {
        return ''
    }

    row.push(
        `<td class="data borderleft">${sum}</td>`,
        td_data(count),
        td_data((sum / count).toFixed(1)),
        '</tr>'
    );
    return row.join('')
}

function make_data_table(data, attribute_to_display_and_extended_details) {
    const attribute_to_display = attribute_to_display_and_extended_details[0];
    const extended_details_mode = attribute_to_display_and_extended_details[1];

    const relguid_to_number = data.relguid_to_most_common_number;
    let relguid_to_name = data.rosters.flat().reduce((acc, player) => {
        if (player['Naam']) {
            acc[player['RelGUID']] = player['Naam'];
        }
        return acc
    }, {});

    // Shorten known names to first name only
    if (data.team_id_plus.includes('BVBL1049HSE')) {
        Object.keys(relguid_to_name).forEach(relguid => {
            relguid_to_name[relguid] = relguid_to_name[relguid].split(' ')[0]
        })
    }

    const relguid_to_dob = data.rosters.flat().reduce((acc, player) => {
        acc[player['RelGUID']] = player['GebDat'];
        return acc
    }, {});
    const data_per_player_per_game = data[attribute_to_display];

    const game_is_at_home = data.previous_games.map(game => is_home_game_for_team(game, data.team_id_plus));

    const uitslagen = data.previous_games.map(game => game["uitslag"].substring(0, 7));
    const own_points = uitslagen.map((uitslag, i) => game_is_at_home[i] ? uitslag.substring(0, 3) : uitslag.substring(4, 7)).map(Number);
    const opp_points = uitslagen.map((uitslag, i) => game_is_at_home[i] ? uitslag.substring(4, 7) : uitslag.substring(0, 3)).map(Number);
    const verschillen = uitslagen.map(eval).map((v, i) => game_is_at_home[i] ? v : -v).map(v => v > 0 ? '+' + v : v);
    const winst = verschillen.map(v => (v > 0));

    const attribute_str = {
        'points': 'Punten',
        'plus_minus': 'Plus minus',
        'fouls': 'Fouten',
        'minutes': 'Minuten<br>(ongeveer)',
        'free_throws': 'Gescoorde<br>vrijworpen',
        'three_pt': 'Driepunters'
    }[attribute_to_display] || '';

    const row_for_player = relguid => make_row_for_player(
        relguid_to_name[relguid],
        relguid_to_number[relguid],
        relguid_to_dob[relguid] ? relguid_to_dob[relguid].substring(8, 10) : '',
        data_per_player_per_game.map(game => game[relguid])
    );

    // relguids of current team
    const totals = (
        data_per_player_per_game.map(game =>
            Object.keys(relguid_to_number)
                .map(relguid => game[relguid] || 0)
                .map(x => `${x}`)
                .map(Number.parseFloat)
                .reduce((a, b) => a + b, 0)
        )
    );

    const tr_class_only_on_extended_data = 'extended_only'; // ALWAYS_FULL / extended_only

    let innerhtml = [// list of strings we will join at the end
        `<tr class="teamnaam">`,
        th(attribute_str),
        ...data.previous_games
            .map(game =>
                `<th><div><p><a href="match_grafiek.html?game_id=${game.guid}">`+
                shorten_teamname(get_opponent_from_game(game, data.team_id_plus).naam) +
                '</a></p></div></th>'
            ),
        '<td></td>'.repeat(3),
        '</tr>',

        `<tr class="maand ${tr_class_only_on_extended_data}">`,
        th('Maand'),
        ...data.previous_games.map(game => game['datumString'].substring(3, 5)).map(Number).map(td_data),
        '<td></td>'.repeat(3),
        '</tr>',

        `<tr class="dag ${tr_class_only_on_extended_data}">`,
        th('Dag'),
        ...data.previous_games.map(game => game['datumString'].substring(0, 2)).map(Number).map(td_data),
        '<td></td>'.repeat(3),
        '</tr>',

        `<tr class="winst ${tr_class_only_on_extended_data}">`,
        th('Winst'),
        ...winst.map(char_for_winst).map(td_data),
        '<td></td>'.repeat(3),
        '</tr>',

        `<tr class="${tr_class_only_on_extended_data}">`,
        th('Voor'),
        ...own_points.map(td_data),
        '<td></td>'.repeat(3),
        '</tr>',

        `<tr class="${tr_class_only_on_extended_data}">`,
        th('Tegen'),
        ...opp_points.map(td_data),
        '<td></td>'.repeat(3),
        '</tr>',

        `<tr class="thuis ${tr_class_only_on_extended_data}">`,
        th('Thuis'),
        ...data.previous_games.map(g => is_home_game_for_team(g, data.team_id_plus))
            .map(home_away_char)
            .map(td_data),
        '<td></td>'.repeat(3),
        '</tr>',

        `<tr class="verschil">`,
        th('Verschil'),
        ...verschillen.map(text => `<td class="borderbottom data">${text}</td>`),

        td_data('+'), // &sum;
        td_data('#'),
        td_data('avg'),
        '</tr>',

        ...Object.keys(relguid_to_number)
            .sort((a, b) => Number(relguid_to_number[a]) - Number(relguid_to_number[b]))
            .map(row_for_player),

        make_row_for_player('', '', '  ', totals, "totals")
    ];

    if (attribute_to_display === 'free_throws') {
        const attempted = data.free_throws_attempted.map((g, i) => g[game_is_at_home[i] ? 'T' : 'U']);
        const pct = totals.map((total, i) => total / attempted[i]).map(x => (x * 100).toFixed(0));
        innerhtml.push(make_row_for_player('FTA', '', '  ', attempted, "fta"));
        innerhtml.push(make_row_for_player('PCT', '', '  ', pct, "pct"));
    }

    const table = document.createElement('table');
    table.innerHTML = innerhtml.join('');
    table.classList.add(extended_details_mode);
    if (extended_details_mode == 'ONLY_WHEN_EXTENDED') {
        table.classList.add('ONLY_WHEN_EXTENDED')
    }

    return table
}

function table_from_list_of_objs(objs) {
    let table = ['<table>'];
    let keys = [];
    // for (obj of objs) {
    objs.forEach(obj => {
        table.push('<tr>');

        for (let key of keys) {
            table.push('<td>' + (obj[key] || '') + '</td>')
        }

        for (let key in obj) {
            if (keys.indexOf(key) === -1) {
                table.push('<td>', obj[key], '</td>');
                keys.push(key)
            }
        }
        table.push('</tr>')
    });

    table.push('</table>');

    table[0] += '<tr>' + keys.map(key => `<th>${key}</th>`).join('') + '</tr>';

    return table.join('')
}

const n_home_wins_in_games = (games) => {
    return games.filter(pg =>pg.uitslag.substring(0, 3) - pg.uitslag.substring(4, 7) > 0).length
}