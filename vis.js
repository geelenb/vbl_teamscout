function get_most_common_number_per_player(player_list_for_games) {
    const name_to_counts = {};

    player_list_for_games.forEach(players_in_a_game => {
        players_in_a_game.forEach(player => {
            if (player['Functie'] !== 'S') {
                return
            }
            const rugnr = String(player['RugNr']);
            if (player['Naam'] in name_to_counts) {
                if (rugnr in name_to_counts[player['Naam']]) {
                    name_to_counts[player['Naam']][rugnr] += 1
                } else {
                    name_to_counts[player['Naam']][rugnr] = 1
                }
            } else {
                name_to_counts[player['Naam']] = {};
                name_to_counts[player['Naam']][rugnr] = 1
            }
        })
    });

    const name_to_most_common = {};
    for (let naam in name_to_counts) {
        if (!naam) {
            continue
        }
        let max_count = 0;
        for (let number in name_to_counts[naam]) {
            let count = name_to_counts[naam][number];
            if (count > max_count) {
                max_count = name_to_counts[naam][number];
                name_to_most_common[naam] = number
            }
        }
    }

    return name_to_most_common
}


function shorten_teamname(teamname) {
    return [
        " As ", "Achel", "Alken",
        "Bilzerse", "Black Sheep", "Bree", "Beringen",
        "Cosmo",
        "Hades", "Hasselt BT", "Helchteren", "Hageland",
        "Maasmechelen",
        "Leopoldsburg", "Lommel", "Lummen",
        "Optima", "Orly",
        "Sint-Truiden", "Stevoort",
        "Zolder", "Zonhoven",
    ].filter(kw =>
        teamname.toLowerCase().includes(kw.toLowerCase())
    ).map(kw => `${kw.trim()} ${teamname[teamname.length - 1]}`)[0] || teamname;
}

const th = content => `<th></th><th colspan="2" style="text-align: left;">${content}</th>`;
const td = content => `<td class="data">${content}</td>`;

const emoji_for_winst = w => String.fromCodePoint(w ? 0x2705 : 0x274C);
// const home_away_emoji = is_home => String.fromCodePoint(is_home ? 0x1F3E0 : 0x1F697);
const home_away_emoji = is_home => String.fromCodePoint(is_home ? 0x1F3E0 : '');

function make_row_for_player(disp_name, number, birth_date, player_data_cells) {
    let row = [ // list of strings we will join at the end
        '<tr class="player">',
        `<td class="data">${number}</td>`,
        `<td class="spelersnaam">${disp_name}</td>`,
        `<td class="data borderright">${birth_date}</td>`,
    ];

    let sum = 0;
    let count = 0;
    player_data_cells.forEach(data_cell => {
        if (data_cell === undefined) {
            row.push(td(''))
        } else {
            sum += parseInt(data_cell);
            count += 1;
            row.push(td(data_cell))
        }
    });

    if (count === 0) {
        return ''
    }

    row.push(
        `<td class="data borderleft">${sum}</td>`,
        td(count),
        td((sum / count).toFixed(1)),
        '</tr>'
    );
    return row.join('')
}

function make_data_table(data, attribute_to_display) {
    const team_id_plus = data.team_id_plus;
    const games = data.games;
    const player_list = data.player_list;
    const name_to_number = data.name_to_most_common_number;
    const name_to_relguid = player_list.flat().reduce((acc, player) => {acc[player['Naam']] = player['RelGUID']; return acc}, {});
    const name_to_dob = player_list.flat().reduce((acc, player) => {acc[player['Naam']] = player['GebDat']; return acc}, {});
    const data_per_player_per_game = data[attribute_to_display];

    const is_my_team = team_id_plus.includes('BVBL1049HSE');
    const is_home_game_for_this_team = game => is_home_game_for_team(game, team_id_plus);
    const game_is_at_home = games.map(is_home_game_for_this_team);


    const uitslagen = games.map(game => game["uitslag"].substring(0, 7));
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
        'three_pt': 'Driepunters',
    }[attribute_to_display] || '';

    const row_for_player_name = name => make_row_for_player(
        is_my_team ? name.split(' ')[0] : name,
        name_to_number[name],
        name_to_dob[name].substring(8, 10),
        data_per_player_per_game.map(game => game[name_to_relguid[name]])
    );


    const innerhtml = [// list of strings we will join at the end
        '<tr class="teamnaam">',
        th(attribute_str),
        ...games.map(game => get_opponent_from_game(game, team_id_plus))
            .map(team =>
                `<th><div><p><a href="autoscout.html?team=${team.id_plus}">${shorten_teamname(team.naam)}</a></p></div></th>`
            ),
        '<td></td>'.repeat(3),
        '</tr>',

        '<tr class="maand">',
        th('Maand'),
        ...games.map(game => game['datumString'].substring(3, 5)).map(Number).map(td),
        '<td></td>'.repeat(3),
        '</tr>',

        '<tr class="dag">',
        th('Dag'),
        ...games.map(game => game['datumString'].substring(0, 2)).map(Number).map(td),
        '<td></td>'.repeat(3),
        '</tr>',

        '<tr class="winst">',
        th('Winst'),
        ...winst.map(emoji_for_winst).map(td),
        '<td></td>'.repeat(3),
        '</tr>',

        '<tr>',
        th('Voor'),
        ...own_points.map(td),
        '<td></td>'.repeat(3),
        '</tr>',

        '<tr>',
        th('Tegen'),
        ...opp_points.map(td),
        '<td></td>'.repeat(3),
        '</tr>',


        '<tr class="verschil">',
        th('Verschil'),
        ...verschillen.map(td),
        '<td></td>'.repeat(3),
        '</tr>',

        '<tr class="thuis">',
        th('Thuis'),
        ...games.map(g => is_home_game_for_team(g, team_id_plus))
            .map(home_away_emoji)
            .map(text => `<td class="borderbottom data">${text}</td>`),
        td('&sum;'),
        td('#'),
        td('/'),
        '</tr>',
        ...Object.keys(name_to_number)
            .sort((a, b) => Number(name_to_number[a]) - Number(name_to_number[b]))
            .map(row_for_player_name)
    ];



    const table = document.createElement('table');
    table.innerHTML = innerhtml.join('');

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

